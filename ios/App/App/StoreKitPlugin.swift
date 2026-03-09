import Capacitor
import StoreKit

@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreKitPlugin"
    public let jsName = "StoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getActivePurchases", returnType: CAPPluginReturnPromise),
    ]

    private var products: [String: Product] = [:]
    private var updateTask: Task<Void, Never>?

    override public func load() {
        updateTask = Task {
            for await result in Transaction.updates {
                if case .verified(let transaction) = result {
                    await transaction.finish()
                }
            }
        }
    }

    deinit {
        updateTask?.cancel()
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let productIds = call.getArray("productIds", String.self) else {
            call.reject("Missing productIds")
            return
        }

        Task {
            do {
                let storeProducts = try await Product.products(for: Set(productIds))
                var result: [[String: Any]] = []
                for product in storeProducts {
                    products[product.id] = product
                    result.append([
                        "id": product.id,
                        "displayName": product.displayName,
                        "displayPrice": product.displayPrice,
                        "price": NSDecimalNumber(decimal: product.price).doubleValue,
                        "type": product.type == .autoRenewable ? "subscription" : "nonConsumable"
                    ])
                }
                call.resolve(["products": result])
            } catch {
                call.reject("Failed to fetch products: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }

        Task {
            let product: Product
            if let cached = products[productId] {
                product = cached
            } else if let fetched = try? await Product.products(for: [productId]),
                      let first = fetched.first {
                product = first
            } else {
                call.reject("Product not found")
                return
            }

            do {
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        call.resolve([
                            "success": true,
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id)
                        ])
                    case .unverified(_, let error):
                        call.reject("Transaction unverified: \(error.localizedDescription)")
                    }
                case .userCancelled:
                    call.resolve(["success": false, "cancelled": true])
                case .pending:
                    call.resolve(["success": false, "pending": true])
                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                var restored: [[String: Any]] = []
                for await result in Transaction.currentEntitlements {
                    if case .verified(let transaction) = result {
                        restored.append([
                            "productId": transaction.productID,
                            "transactionId": String(transaction.id)
                        ])
                    }
                }
                call.resolve([
                    "success": restored.count > 0,
                    "transactions": restored
                ])
            } catch {
                call.reject("Restore failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func getActivePurchases(_ call: CAPPluginCall) {
        Task {
            var active: [[String: Any]] = []
            for await result in Transaction.currentEntitlements {
                if case .verified(let transaction) = result {
                    active.append([
                        "productId": transaction.productID,
                        "transactionId": String(transaction.id)
                    ])
                }
            }
            call.resolve(["purchases": active])
        }
    }
}

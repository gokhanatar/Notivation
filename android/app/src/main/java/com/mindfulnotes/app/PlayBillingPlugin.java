package com.mindfulnotes.app;

import android.util.Log;

import com.android.billingclient.api.*;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private static final String TAG = "PlayBillingPlugin";
    private BillingClient billingClient;
    private Map<String, ProductDetails> productDetailsMap = new HashMap<>();
    private PluginCall pendingPurchaseCall;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
                .setListener(this)
                .enablePendingPurchases()
                .build();
        connectBillingClient();
    }

    private void connectBillingClient() {
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Billing client connected");
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                Log.d(TAG, "Billing client disconnected");
            }
        });
    }

    private void ensureConnected(Runnable onConnected, PluginCall call) {
        if (billingClient.isReady()) {
            onConnected.run();
        } else {
            billingClient.startConnection(new BillingClientStateListener() {
                @Override
                public void onBillingSetupFinished(BillingResult billingResult) {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        onConnected.run();
                    } else {
                        call.reject("Billing connection failed: " + billingResult.getDebugMessage());
                    }
                }

                @Override
                public void onBillingServiceDisconnected() {
                    call.reject("Billing service disconnected");
                }
            });
        }
    }

    @PluginMethod
    public void getProducts(PluginCall call) {
        JSArray productIds = call.getArray("productIds");
        if (productIds == null) {
            call.reject("Missing productIds");
            return;
        }

        ensureConnected(() -> {
            try {
                List<QueryProductDetailsParams.Product> productList = new ArrayList<>();
                for (int i = 0; i < productIds.length(); i++) {
                    String id = productIds.getString(i);
                    // Try subscription first
                    productList.add(QueryProductDetailsParams.Product.newBuilder()
                            .setProductId(id)
                            .setProductType(BillingClient.ProductType.SUBS)
                            .build());
                }

                QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                        .setProductList(productList)
                        .build();

                billingClient.queryProductDetailsAsync(params, (billingResult, productDetailsList) -> {
                    if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                        // Also query inapp for lifetime
                        queryInAppProducts(call, productIds, productDetailsList);
                    } else {
                        call.reject("Failed to fetch products: " + billingResult.getDebugMessage());
                    }
                });
            } catch (Exception e) {
                call.reject("Failed to fetch products: " + e.getMessage());
            }
        }, call);
    }

    private void queryInAppProducts(PluginCall call, JSArray productIds, List<ProductDetails> subProducts) {
        try {
            List<QueryProductDetailsParams.Product> inappList = new ArrayList<>();
            for (int i = 0; i < productIds.length(); i++) {
                String id = productIds.getString(i);
                inappList.add(QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(id)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build());
            }

            QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                    .setProductList(inappList)
                    .build();

            billingClient.queryProductDetailsAsync(params, (billingResult, inappProducts) -> {
                try {
                    JSArray result = new JSArray();
                    List<ProductDetails> allProducts = new ArrayList<>(subProducts);
                    allProducts.addAll(inappProducts);

                    for (ProductDetails details : allProducts) {
                        productDetailsMap.put(details.getProductId(), details);
                        JSObject product = new JSObject();
                        product.put("id", details.getProductId());
                        product.put("displayName", details.getName());

                        if (details.getProductType().equals(BillingClient.ProductType.SUBS)) {
                            product.put("type", "subscription");
                            List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                            if (offers != null && !offers.isEmpty()) {
                                ProductDetails.PricingPhase phase = offers.get(0).getPricingPhases()
                                        .getPricingPhaseList().get(0);
                                product.put("displayPrice", phase.getFormattedPrice());
                                product.put("price", phase.getPriceAmountMicros() / 1_000_000.0);
                            }
                        } else {
                            product.put("type", "nonConsumable");
                            ProductDetails.OneTimePurchaseOfferDetails oneTime = details.getOneTimePurchaseOfferDetails();
                            if (oneTime != null) {
                                product.put("displayPrice", oneTime.getFormattedPrice());
                                product.put("price", oneTime.getPriceAmountMicros() / 1_000_000.0);
                            }
                        }
                        result.put(product);
                    }

                    JSObject ret = new JSObject();
                    ret.put("products", result);
                    call.resolve(ret);
                } catch (Exception e) {
                    call.reject("Failed to process products: " + e.getMessage());
                }
            });
        } catch (Exception e) {
            call.reject("Failed to query inapp products: " + e.getMessage());
        }
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        if (productId == null) {
            call.reject("Missing productId");
            return;
        }

        ensureConnected(() -> {
            ProductDetails details = productDetailsMap.get(productId);
            if (details == null) {
                call.reject("Product not found. Call getProducts first.");
                return;
            }

            pendingPurchaseCall = call;

            List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
            BillingFlowParams.ProductDetailsParams.Builder builder = BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(details);

            if (details.getProductType().equals(BillingClient.ProductType.SUBS)) {
                List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
                if (offers != null && !offers.isEmpty()) {
                    builder.setOfferToken(offers.get(0).getOfferToken());
                }
            }

            productDetailsParamsList.add(builder.build());

            BillingFlowParams billingFlowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(productDetailsParamsList)
                    .build();

            billingClient.launchBillingFlow(getActivity(), billingFlowParams);
        }, call);
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (pendingPurchaseCall == null) return;

        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                acknowledgePurchase(purchase);
            }
            Purchase p = purchases.get(0);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("productId", p.getProducts().get(0));
            ret.put("transactionId", p.getOrderId());
            pendingPurchaseCall.resolve(ret);
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("cancelled", true);
            pendingPurchaseCall.resolve(ret);
        } else {
            pendingPurchaseCall.reject("Purchase failed: " + billingResult.getDebugMessage());
        }
        pendingPurchaseCall = null;
    }

    private void acknowledgePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED && !purchase.isAcknowledged()) {
            AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.getPurchaseToken())
                    .build();
            billingClient.acknowledgePurchase(params, billingResult -> {
                Log.d(TAG, "Purchase acknowledged: " + billingResult.getResponseCode());
            });
        }
    }

    @PluginMethod
    public void restorePurchases(PluginCall call) {
        ensureConnected(() -> {
            // Query subscriptions
            billingClient.queryPurchasesAsync(
                    QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
                    (billingResult, subPurchases) -> {
                        // Query inapp
                        billingClient.queryPurchasesAsync(
                                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
                                (billingResult2, inappPurchases) -> {
                                    try {
                                        JSArray transactions = new JSArray();
                                        List<Purchase> allPurchases = new ArrayList<>(subPurchases);
                                        allPurchases.addAll(inappPurchases);

                                        for (Purchase p : allPurchases) {
                                            if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                                                JSObject tx = new JSObject();
                                                tx.put("productId", p.getProducts().get(0));
                                                tx.put("transactionId", p.getOrderId());
                                                transactions.put(tx);
                                            }
                                        }

                                        JSObject ret = new JSObject();
                                        ret.put("success", transactions.length() > 0);
                                        ret.put("transactions", transactions);
                                        call.resolve(ret);
                                    } catch (Exception e) {
                                        call.reject("Restore failed: " + e.getMessage());
                                    }
                                }
                        );
                    }
            );
        }, call);
    }

    @PluginMethod
    public void getActivePurchases(PluginCall call) {
        ensureConnected(() -> {
            billingClient.queryPurchasesAsync(
                    QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(),
                    (billingResult, subPurchases) -> {
                        billingClient.queryPurchasesAsync(
                                QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(),
                                (billingResult2, inappPurchases) -> {
                                    try {
                                        JSArray purchases = new JSArray();
                                        List<Purchase> allPurchases = new ArrayList<>(subPurchases);
                                        allPurchases.addAll(inappPurchases);

                                        for (Purchase p : allPurchases) {
                                            if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                                                JSObject tx = new JSObject();
                                                tx.put("productId", p.getProducts().get(0));
                                                tx.put("transactionId", p.getOrderId());
                                                purchases.put(tx);
                                            }
                                        }

                                        JSObject ret = new JSObject();
                                        ret.put("purchases", purchases);
                                        call.resolve(ret);
                                    } catch (Exception e) {
                                        call.reject("Failed to get purchases: " + e.getMessage());
                                    }
                                }
                        );
                    }
            );
        }, call);
    }
}

import { Capacitor } from '@capacitor/core';
import { isNative, isIOS, isAndroid } from '@/lib/capacitor';
import { PlanType } from '@/lib/currency';

export const PRODUCT_IDS = {
  monthly: 'com.mindfulnotes.app.monthly',
  yearly: 'com.mindfulnotes.app.yearly',
  lifetime: 'com.mindfulnotes.app.pro.lifetime',
} as const;

const PRO_STORAGE_KEY = 'mindful-notes-pro-status';
const PRO_PLAN_KEY = 'mindful-notes-pro-plan';

function getStoreKitPlugin() {
  return Capacitor.Plugins.StoreKit;
}

function getPlayBillingPlugin() {
  return Capacitor.Plugins.PlayBilling;
}

export async function initializePurchases(): Promise<void> {
  if (!isNative) return;
  // Check active purchases on init
  try {
    await syncActivePurchases();
  } catch (e) {
    console.error('Init purchases failed:', e);
  }
}

async function syncActivePurchases(): Promise<void> {
  try {
    let result: any;
    if (isIOS) {
      result = await getStoreKitPlugin().getActivePurchases();
    } else if (isAndroid) {
      result = await getPlayBillingPlugin().getActivePurchases();
    }
    if (result?.purchases?.length > 0) {
      const productId = result.purchases[0].productId;
      const plan = Object.entries(PRODUCT_IDS).find(([, id]) => id === productId)?.[0] as PlanType;
      if (plan) activateProLocally(plan);
    }
  } catch (e) {
    console.error('Sync purchases failed:', e);
  }
}

export async function purchasePro(plan: PlanType): Promise<boolean> {
  if (!isNative) return false;

  const productId = PRODUCT_IDS[plan];

  try {
    // Ensure products are loaded
    const allIds = Object.values(PRODUCT_IDS);
    if (isIOS) {
      await getStoreKitPlugin().getProducts({ productIds: allIds });
    } else if (isAndroid) {
      await getPlayBillingPlugin().getProducts({ productIds: allIds });
    }

    // Purchase
    let result: any;
    if (isIOS) {
      result = await getStoreKitPlugin().purchase({ productId });
    } else if (isAndroid) {
      result = await getPlayBillingPlugin().purchase({ productId });
    }

    if (result?.success) {
      activateProLocally(plan);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Purchase failed:', e);
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!isNative) return false;

  try {
    let result: any;
    if (isIOS) {
      result = await getStoreKitPlugin().restorePurchases();
    } else if (isAndroid) {
      result = await getPlayBillingPlugin().restorePurchases();
    }

    if (result?.success && result?.transactions?.length > 0) {
      const productId = result.transactions[0].productId;
      const plan = Object.entries(PRODUCT_IDS).find(([, id]) => id === productId)?.[0] as PlanType;
      if (plan) {
        activateProLocally(plan);
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('Restore failed:', e);
    return false;
  }
}

export function activateProLocally(plan: PlanType): void {
  localStorage.setItem(PRO_STORAGE_KEY, 'active');
  localStorage.setItem(PRO_PLAN_KEY, plan);
}

export function deactivateProLocally(): void {
  localStorage.removeItem(PRO_STORAGE_KEY);
  localStorage.removeItem(PRO_PLAN_KEY);
}

export function isProOwned(): boolean {
  return localStorage.getItem(PRO_STORAGE_KEY) === 'active';
}

export function getActivePlan(): PlanType | null {
  const plan = localStorage.getItem(PRO_PLAN_KEY);
  if (plan === 'monthly' || plan === 'yearly' || plan === 'lifetime') return plan;
  return null;
}

export interface StoreProduct {
  id: string;
  displayName: string;
  displayPrice: string;
  price: number;
  type: 'subscription' | 'nonConsumable';
}

export async function fetchStoreProducts(): Promise<StoreProduct[]> {
  if (!isNative) return [];

  try {
    const allIds = Object.values(PRODUCT_IDS);
    let result: any;
    if (isIOS) {
      result = await getStoreKitPlugin().getProducts({ productIds: allIds });
    } else if (isAndroid) {
      result = await getPlayBillingPlugin().getProducts({ productIds: allIds });
    }
    return (result?.products as StoreProduct[]) || [];
  } catch (e) {
    console.error('Fetch store products failed:', e);
    return [];
  }
}

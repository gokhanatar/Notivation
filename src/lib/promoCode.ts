const VALID_CODE = 'NESALPDENIZ2016';
const PRO_STORAGE_KEY = 'mindful-notes-pro-status';
const PRO_PLAN_KEY = 'mindful-notes-pro-plan';

export function activateProWithCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  if (code.trim().toUpperCase() === VALID_CODE) {
    localStorage.setItem(PRO_STORAGE_KEY, 'active');
    localStorage.setItem(PRO_PLAN_KEY, 'lifetime');
    return true;
  }
  return false;
}

export function isProActivated(): boolean {
  return localStorage.getItem(PRO_STORAGE_KEY) === 'active';
}

export function deactivatePro(): void {
  localStorage.removeItem(PRO_STORAGE_KEY);
  localStorage.removeItem(PRO_PLAN_KEY);
}

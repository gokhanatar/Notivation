import { getSettings, updateSettings } from '@/lib/db';

export type LandmarkType = 'monday' | 'monthStart' | 'newYear' | 'birthday' | 'season' | 'weeklyReset';

export interface Landmark {
  type: LandmarkType;
  messageKey: string;
  emoji: string;
}

export function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export function detectLandmarks(userBirthday?: string): Landmark[] {
  const now = new Date();
  const landmarks: Landmark[] = [];
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();
  const month = now.getMonth();
  const monthDay = `${String(month + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;

  if (dayOfWeek === 1) landmarks.push({ type: 'monday', messageKey: 'freshStart.monday', emoji: '\u{1F305}' });
  if (dayOfMonth === 1) landmarks.push({ type: 'monthStart', messageKey: 'freshStart.monthStart', emoji: '\u{1F4C5}' });
  if (month === 0 && dayOfMonth <= 7) landmarks.push({ type: 'newYear', messageKey: 'freshStart.newYear', emoji: '\u{1F386}' });
  if (userBirthday && monthDay === userBirthday) landmarks.push({ type: 'birthday', messageKey: 'freshStart.birthday', emoji: '\u{1F382}' });
  // Season starts: Mar 1, Jun 1, Sep 1, Dec 1
  if (dayOfMonth === 1 && [2, 5, 8, 11].includes(month)) {
    landmarks.push({ type: 'season', messageKey: `freshStart.${getCurrentSeason()}`, emoji: getCurrentSeason() === 'spring' ? '\u{1F338}' : getCurrentSeason() === 'summer' ? '\u2600\uFE0F' : getCurrentSeason() === 'autumn' ? '\u{1F342}' : '\u2744\uFE0F' });
  }
  return landmarks;
}

export async function shouldShowFreshStart(): Promise<boolean> {
  const settings = await getSettings();
  if (settings.freshStartEnabled === false) return false;
  const dismissKey = `freshStart-dismissed-${new Date().toDateString()}`;
  return !localStorage.getItem(dismissKey);
}

export function dismissFreshStart(): void {
  localStorage.setItem(`freshStart-dismissed-${new Date().toDateString()}`, 'true');
}

export async function saveWeeklyIntention(intention: string): Promise<void> {
  await updateSettings({ weeklyIntention: intention, weeklyIntentionDate: new Date() });
}

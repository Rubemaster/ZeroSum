import type { Coordinates } from '../types/onboarding';

export async function getLocationFromIP(): Promise<Coordinates | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) return null;

    const data = await response.json();
    if (data.latitude && data.longitude) {
      return { lat: data.latitude, lng: data.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

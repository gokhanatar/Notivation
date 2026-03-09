import { isNative } from '@/lib/capacitor';

export interface PhotoResult {
  base64: string; // data URI
}

/**
 * Take a photo using the native camera or web file picker.
 * Returns base64 data URI.
 * Max width: 800px for IndexedDB size management.
 */
export async function takePhoto(): Promise<PhotoResult | null> {
  if (isNative) {
    return takePhotoNative('camera');
  }
  return takePhotoWeb();
}

/**
 * Pick a photo from the gallery.
 */
export async function pickFromGallery(): Promise<PhotoResult | null> {
  if (isNative) {
    return takePhotoNative('gallery');
  }
  return takePhotoWeb();
}

async function takePhotoNative(source: 'camera' | 'gallery'): Promise<PhotoResult | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

    const result = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      width: 800,
    });

    if (result.base64String) {
      const mimeType = result.format === 'png' ? 'image/png' : 'image/jpeg';
      return { base64: `data:${mimeType};base64,${result.base64String}` };
    }
    return null;
  } catch (e) {
    console.warn('Camera error:', e);
    return null;
  }
}

function takePhotoWeb(): Promise<PhotoResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      try {
        const resized = await resizeImage(file, 800);
        resolve({ base64: resized });
      } catch {
        resolve(null);
      }
    };

    // Handle cancel
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}

function resizeImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const MAX_ATTACHMENTS = 5;

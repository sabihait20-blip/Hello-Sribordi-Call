/**
 * Service for uploading images to ImgBB API
 * Official Docs: https://api.imgbb.com/
 */

const DEFAULT_IMGBB_API_KEY = '5a96450548a710e6f8cf39c709ed732a';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: string | number;
    height: string | number;
    size: number;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb?: {
      url: string;
    };
    medium?: {
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Uploads an image file to ImgBB and returns the direct public image URL.
 * @param file The image File or Blob to upload
 * @param customKey Optional custom API key override
 */
export async function uploadToImgBB(
  file: File | Blob,
  customKey?: string
): Promise<string> {
  const apiKey =
    customKey ||
    import.meta.env.VITE_IMGBB_API_KEY ||
    DEFAULT_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error('ImgBB API key is missing. Please configure VITE_IMGBB_API_KEY.');
  }

  // Max allowed size for ImgBB free tier is 32 MB
  if (file.size > 32 * 1024 * 1024) {
    throw new Error('Image size exceeds the maximum limit of 32MB.');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = 'Failed to upload image to ImgBB';
    try {
      const errJson = JSON.parse(errorText);
      if (errJson?.error?.message) {
        parsedMessage = errJson.error.message;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(parsedMessage);
  }

  const result: ImgBBResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error('ImgBB did not return a valid image URL');
  }

  // Return the direct display URL or direct URL
  return result.data.display_url || result.data.url;
}

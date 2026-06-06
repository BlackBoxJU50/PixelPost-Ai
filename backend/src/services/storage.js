import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(buffer, mimeType) {
  // Compress image heavily for DB storage
  const processed = await sharp(buffer)
    .resize({ width: 600, withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();

  const base64Data = processed.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Data}`;

  return {
    url: dataUrl,
    publicId: 'local-base64',
    width: 600,
    height: 600,
  };
}

/**
 * Convert image buffer to base64 string for AI vision
 */
export async function toBase64(buffer) {
  const processed = await sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
  return processed.toString('base64');
}

export async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

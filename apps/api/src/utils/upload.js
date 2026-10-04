import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.resolve(here, '../../uploads');

const { cloudName, apiKey, apiSecret } = env.cloudinary;
export const cloudinaryEnabled = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
};

function localFileName(folder, ext) {
  const safe = String(folder).replace(/[^a-z0-9-]/gi, '') || 'misc';
  return `${safe}-${crypto.randomBytes(6).toString('hex')}${ext}`;
}

function toCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `sis/${folder}`, resource_type: 'image' },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id, provider: 'cloudinary' });
      }
    );
    stream.end(buffer);
  });
}

async function toLocal(buffer, folder, baseUrl, ext) {
  const name = localFileName(folder, ext);
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, name), buffer);
  return { url: `${baseUrl}/uploads/${name}`, publicId: name, provider: 'local' };
}

/** Uploads an image buffer to Cloudinary when configured, else to local disk. */
export async function uploadImage(buffer, { folder = 'misc', baseUrl = '', mimetype } = {}) {
  const ext = ALLOWED_IMAGE_TYPES[mimetype];
  if (!ext) {
    const err = new Error('Unsupported file type');
    err.statusCode = 400;
    throw err;
  }
  if (cloudinaryEnabled) return toCloudinary(buffer, folder);
  return toLocal(buffer, folder, baseUrl, ext);
}

/** 404-safe delete; local names have no `/`, Cloudinary public_ids do. */
export async function deleteImage(publicId) {
  if (!publicId) return { ok: true };
  if (publicId.includes('/')) {
    if (cloudinaryEnabled) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => {});
    }
    return { ok: true };
  }
  const name = path.basename(publicId);
  await fs.unlink(path.join(UPLOADS_DIR, name)).catch(() => {});
  return { ok: true };
}

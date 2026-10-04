import multer from 'multer';
import { asyncHandler, ApiError } from '../utils/apiError.js';
import {
  uploadImage,
  deleteImage,
  cloudinaryEnabled,
  ALLOWED_IMAGE_TYPES,
} from '../utils/upload.js';

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('file');

function baseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided (field name must be "file")');
  if (!ALLOWED_IMAGE_TYPES[req.file.mimetype]) {
    throw ApiError.badRequest('Unsupported file type — use JPEG, PNG, WebP, AVIF or GIF');
  }

  const folder = String(req.query.folder || 'misc').replace(/[^a-z0-9-]/gi, '') || 'misc';
  const result = await uploadImage(req.file.buffer, {
    folder,
    baseUrl: baseUrl(req),
    mimetype: req.file.mimetype,
  });

  res.status(201).json({
    url: result.url,
    publicId: result.publicId,
    provider: result.provider,
    cloudinary: cloudinaryEnabled,
  });
});

export const remove = asyncHandler(async (req, res) => {
  const publicId = decodeURIComponent(req.params.publicId);
  await deleteImage(publicId);
  res.json({ ok: true });
});

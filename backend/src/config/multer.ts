import multer, { FileFilterCallback, StorageEngine } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from '../utils/AppError';
import { config } from './env';

/**
 * Disk storage engine for Multer
 * Stores files in the configured upload directory
 */
const storage: StorageEngine = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // Ensure upload directory exists
    if (!fs.existsSync(config.upload.directory)) {
      fs.mkdirSync(config.upload.directory, { recursive: true });
    }
    cb(null, config.upload.directory);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename: timestamp-random-originalname
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${timestamp}-${random}-${name}${ext}`;
    cb(null, filename);
  },
});

/**
 * File filter to allow only supported file types
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  const isValidExtension = config.upload.allowedExtensions.includes(ext);
  const isValidMimeType = config.upload.allowedMimeTypes.includes(mimeType);

  if (!isValidExtension || !isValidMimeType) {
    cb(
      new AppError(
        `Invalid file type. Only ${config.upload.allowedExtensions.join(', ')} are allowed`,
        400,
        'FILE_TYPE_INVALID'
      )
    );
  } else {
    cb(null, true);
  }
};

/**
 * Multer instance with disk storage and file filters
 */
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSizeBytes,
  },
});

import fs from 'fs';
import path from 'path';

export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_PATH || './uploads');
export const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
export const POST_IMAGE_DIR = path.join(UPLOAD_ROOT, 'posts');
export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
export const MAX_POST_IMAGES = 4;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function ensureUploadDirs(): void {
  for (const dir of [UPLOAD_ROOT, AVATAR_DIR, POST_IMAGE_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export function isAllowedImageMime(mime: string): boolean {
  return ALLOWED_MIME_TYPES.has(mime);
}

export function publicUploadUrl(subpath: string): string {
  return `/uploads/${subpath.replace(/^\/+/, '').replace(/\\/g, '/')}`;
}

export function uniqueFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
}

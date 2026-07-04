import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export function generateFileName(originalName: string): string {
  const ext = extname(originalName);
  return `${uuidv4()}${ext}`;
}

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || './uploads';
}

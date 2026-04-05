import { put, del } from "@vercel/blob";
import fs from "fs";
import path from "path";

/**
 * Upload a file to Vercel Blob Storage
 * @param file - The file to upload
 * @param filename - Custom filename (optional)
 * @returns URL of the uploaded file
 */
export async function uploadToBlob(
  file: Buffer,
  filename: string
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[blob] Sem token; usando fallback local em /uploads");
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._/-]/g, "_");
    const base = path.basename(safeName);
    const localName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${base}`;
    const localPath = path.join(uploadsDir, localName);
    fs.writeFileSync(localPath, file);
    return `/uploads/${localName}`;
  }

  const blob = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return blob.url;
}

/**
 * Delete a file from Vercel Blob Storage
 * @param url - The URL of the file to delete
 */
export async function deleteFromBlob(url: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Em ambiente local, arquivos ficam em /uploads.
    if (url.startsWith("/uploads/")) {
      const filename = url.replace("/uploads/", "");
      const filePath = path.resolve(process.cwd(), "uploads", filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    return;
  }

  try {
    await del(url);
  } catch (error) {
    console.error("Error deleting from blob:", error);
  }
}
import { put, del } from "@vercel/blob";

export const uploadToBlob = async (
  buffer: Buffer,
  filename: string
): Promise<string> => {
  const { url } = await put(filename, buffer, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return url;
};

export const deleteFromBlob = async (url: string): Promise<void> => {
  if (!url.startsWith("https://")) return; // ignora URLs locais
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
};
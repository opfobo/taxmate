// utils/ocr/ocrHelpers.ts

import { supabase } from "@/integrations/supabase/client";

export const sendToPdfPreviewServer = async (file: File) => {
  if (!file || !file.name.endsWith(".pdf")) return null;
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("https://pcgs.ru/pdfserver/convert", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Preview conversion failed");
    return json;
  } catch (err) {
    console.warn("❌ PDF Preview server error:", err);
    return null;
  }
};

export const uploadFileToSupabase = async (
  bucket: string,
  path: string,
  file: Blob,
  contentType = "application/octet-stream"
) => {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true,
  });
  return error;
};

export const uploadPreviewImage = async (
  userId: string,
  fileName: string,
  blob: Blob
): Promise<string | null> => {
  const previewPath = `${userId}/${fileName.replace(/\.[^/.]+$/, "_preview.jpg")}`;
  const uploadError = await uploadFileToSupabase("ocr-temp", previewPath, blob, "image/jpeg");
  if (uploadError) {
    console.warn("❌ Vorschau-Bild Upload fehlgeschlagen:", uploadError.message);
    return null;
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from("ocr-temp")
    .createSignedUrl(previewPath, 600);

  if (signedUrlError) {
    console.warn("❌ Vorschau-Link Fehler:", signedUrlError.message);
    return null;
  }

  return signedUrlData?.signedUrl || null;
};

export const generateSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn = 600
): Promise<string | null> => {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    console.warn("❌ Signed URL Fehler:", error?.message);
    return null;
  }
  return data.signedUrl;
};

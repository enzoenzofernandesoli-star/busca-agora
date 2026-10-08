import "server-only";

import { createAdminClient } from "@/lib/db/admin";

// Private bucket for labels, order summaries and (later) DANFEs. Only the
// server touches it; the admin downloads through short-lived signed links.
const BUCKET = "documentos";

export async function saveDocument(path: string, pdf: Uint8Array) {
  const { error } = await createAdminClient()
    .storage.from(BUCKET)
    .upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (error)
    throw new Error(`Não foi possível guardar ${path}: ${error.message}`);
}

export async function readDocument(path: string): Promise<Uint8Array> {
  const { data, error } = await createAdminClient()
    .storage.from(BUCKET)
    .download(path);
  if (error || !data) throw new Error(`Arquivo ${path} não encontrado`);
  return new Uint8Array(await data.arrayBuffer());
}

/** 10-minute link for the admin to open or download a PDF. */
export async function signedDocumentUrl(
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await createAdminClient()
    .storage.from(BUCKET)
    .createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

export function isPdf(bytes: Uint8Array): boolean {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 // F
  );
}

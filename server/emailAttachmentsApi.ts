import crypto from "node:crypto";
import express, { type Express, type Request, type Response } from "express";
import { ENV } from "./_core/env";
import { storageDelete, storageDownload, storageGetSignedUrl, storagePutAtKey } from "./storage";

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_CHUNK_BYTES = 5 * 1024 * 1024;
const MAX_CHUNKS = Math.ceil(MAX_FILE_BYTES / MAX_CHUNK_BYTES);
const ALLOWED_STATUS = new Set(["pending", "uploading", "ready", "attached", "failed", "cancelled", "expired"]);

type AttachmentRow = {
  id: string;
  company_id: string;
  email_message_id?: string | null;
  communication_id?: string | null;
  storage_bucket: string;
  storage_key?: string | null;
  upload_session_id?: string | null;
  original_name: string;
  mime_type: string;
  byte_size: number;
  checksum_sha256?: string | null;
  chunk_size_bytes: number;
  total_chunks: number;
  uploaded_chunks: number[];
  uploaded_bytes: number;
  status: string;
  created_by?: string | null;
};

function supabaseConfig() {
  const url = ENV.supabaseUrl.replace(/\/+$/, "");
  if (!url || !ENV.supabaseServiceKey || !ENV.supabaseAnonKey) throw new Error("Supabase server configuration is incomplete.");
  return { url, serviceKey: ENV.supabaseServiceKey, anonKey: ENV.supabaseAnonKey };
}

function serviceHeaders() {
  const { serviceKey } = supabaseConfig();
  return { apikey: serviceKey, authorization: `Bearer ${serviceKey}`, "content-type": "application/json" };
}

async function supabaseRest(path: string, init: RequestInit = {}) {
  const { url } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init, headers: { ...serviceHeaders(), ...(init.headers || {}) } });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(payload?.message || payload?.hint || `Supabase request failed (${response.status})`), { status: response.status, details: payload });
  return payload;
}

async function authenticateAndResolveCompany(req: Request): Promise<{ userId: string; companyId: string }> {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw Object.assign(new Error("An active account session is required."), { status: 401 });
  const { url, anonKey } = supabaseConfig();
  const userResponse = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, authorization: `Bearer ${token}` } });
  const user = await userResponse.json().catch(() => null);
  if (!userResponse.ok || !user?.id) throw Object.assign(new Error("The account session is invalid or expired."), { status: 401 });

  const companyResponse = await fetch(`${url}/rest/v1/rpc/current_company_id`, {
    method: "POST",
    headers: { apikey: anonKey, authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: "{}",
  });
  const companyPayload = await companyResponse.json().catch(() => null);
  const companyId = typeof companyPayload === "string" ? companyPayload : Array.isArray(companyPayload) ? companyPayload[0] : companyPayload?.company_id;
  if (!companyResponse.ok || !companyId || !/^[0-9a-f-]{36}$/i.test(String(companyId))) throw Object.assign(new Error("The active company context could not be resolved."), { status: 403 });
  return { userId: user.id, companyId: String(companyId) };
}

function errorResponse(res: Response, error: any) {
  const status = Number(error?.status) || 500;
  if (status >= 500) console.error("[EmailAttachments]", error);
  res.status(status).json({ error: status >= 500 ? "Attachment service temporarily unavailable." : error.message, code: error.code || undefined });
}

function safeFileName(value: unknown) {
  const raw = String(value || "attachment").trim().replace(/[\\/\0]/g, "_");
  return raw.slice(0, 180) || "attachment";
}

function storageKeyFor(companyId: string, sessionId: string, name: string) {
  return `email-attachments/${companyId}/${sessionId}/${name}`;
}

async function getAttachment(id: string, companyId: string): Promise<AttachmentRow | null> {
  const rows = await supabaseRest(`email_attachments?id=eq.${encodeURIComponent(id)}&company_id=eq.${encodeURIComponent(companyId)}&select=*`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function updateAttachment(id: string, companyId: string, patch: Record<string, unknown>) {
  return supabaseRest(`email_attachments?id=eq.${encodeURIComponent(id)}&company_id=eq.${encodeURIComponent(companyId)}`, { method: "PATCH", headers: { ...serviceHeaders(), prefer: "return=representation" }, body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }) });
}

async function initiate(req: Request, res: Response) {
  try {
    const { userId, companyId } = await authenticateAndResolveCompany(req);
    const { fileName, mimeType, byteSize, checksumSha256, emailMessageId, communicationId } = req.body || {};
    const size = Number(byteSize);
    if (!fileName || !Number.isSafeInteger(size) || size < 0 || size > MAX_FILE_BYTES) {
      res.status(400).json({ error: `Attachment must be between 0 and ${MAX_FILE_BYTES} bytes.`, code: "FILE_TOO_LARGE" });
      return;
    }
    const sessionId = crypto.randomUUID();
    const totalChunks = Math.max(1, Math.ceil(size / MAX_CHUNK_BYTES));
    const originalName = safeFileName(fileName);
    const storageKey = storageKeyFor(companyId, sessionId, originalName);
    const rows = await supabaseRest("email_attachments", { method: "POST", headers: { ...serviceHeaders(), prefer: "return=representation" }, body: JSON.stringify({ company_id: companyId, email_message_id: emailMessageId || null, communication_id: communicationId || null, storage_key: storageKey, upload_session_id: sessionId, original_name: originalName, mime_type: String(mimeType || "application/octet-stream").slice(0, 180), byte_size: size, checksum_sha256: checksumSha256 || null, chunk_size_bytes: MAX_CHUNK_BYTES, total_chunks: totalChunks, uploaded_chunks: [], uploaded_bytes: 0, status: "pending", created_by: userId, expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }) });
    const attachment = Array.isArray(rows) ? rows[0] : rows;
    res.status(201).json({ attachmentId: attachment.id, uploadSessionId: sessionId, chunkSizeBytes: MAX_CHUNK_BYTES, totalChunks, storageKey, status: "pending" });
  } catch (error) { errorResponse(res, error); }
}

async function uploadChunk(req: Request, res: Response) {
  try {
    const { userId, companyId } = await authenticateAndResolveCompany(req);
    const attachment = await getAttachment(String(req.params.attachmentId), companyId);
    const chunkIndex = Number(req.params.chunkIndex);
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    if (!attachment) { res.status(404).json({ error: "Attachment upload session was not found." }); return; }
    if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= attachment.total_chunks) { res.status(400).json({ error: "Invalid attachment chunk index." }); return; }
    if (!body.length || body.length > MAX_CHUNK_BYTES) { res.status(400).json({ error: "Chunk size is invalid." }); return; }
    const expectedLastSize = attachment.byte_size - (attachment.total_chunks - 1) * attachment.chunk_size_bytes;
    const expectedSize = chunkIndex === attachment.total_chunks - 1 ? expectedLastSize : attachment.chunk_size_bytes;
    if (body.length !== expectedSize) { res.status(400).json({ error: "Chunk byte size does not match the upload plan." }); return; }
    const chunkKey = `${attachment.storage_key}/chunks/${chunkIndex}`;
    await storagePutAtKey(chunkKey, body, req.headers["content-type"] || attachment.mime_type);
    const uploadedChunks = Array.from(new Set([...(attachment.uploaded_chunks || []), chunkIndex])).sort((a, b) => a - b);
    const uploadedBytes = uploadedChunks.reduce((sum, index) => sum + (index === attachment.total_chunks - 1 ? expectedLastSize : attachment.chunk_size_bytes), 0);
    await updateAttachment(attachment.id, companyId, { uploaded_chunks: uploadedChunks, uploaded_bytes: uploadedBytes, status: "uploading", metadata: { last_uploaded_by: userId } });
    res.json({ attachmentId: attachment.id, chunkIndex, uploadedChunks, uploadedBytes, totalBytes: attachment.byte_size, percent: Math.round((uploadedBytes / attachment.byte_size) * 100) });
  } catch (error) { errorResponse(res, error); }
}

async function finalize(req: Request, res: Response) {
  try {
    const { companyId } = await authenticateAndResolveCompany(req);
    const attachment = await getAttachment(String(req.params.attachmentId), companyId);
    if (!attachment) { res.status(404).json({ error: "Attachment upload session was not found." }); return; }
    if (attachment.status === "ready" && attachment.storage_key) { res.json({ attachmentId: attachment.id, status: "ready", storageKey: attachment.storage_key }); return; }
    const expected = Array.from({ length: attachment.total_chunks }, (_, index) => index);
    const uploaded = new Set(attachment.uploaded_chunks || []);
    if (expected.some((index) => !uploaded.has(index))) { res.status(409).json({ error: "Not all attachment chunks have been uploaded.", code: "UPLOAD_INCOMPLETE", missingChunks: expected.filter((index) => !uploaded.has(index)) }); return; }
    const chunks: Buffer[] = [];
    for (const index of expected) chunks.push(await storageDownload(`${attachment.storage_key}/chunks/${index}`));
    const complete = Buffer.concat(chunks);
    if (complete.length !== attachment.byte_size) { res.status(409).json({ error: "Uploaded bytes do not match the declared attachment size.", code: "SIZE_MISMATCH" }); return; }
    const checksum = crypto.createHash("sha256").update(complete).digest("hex");
    if (attachment.checksum_sha256 && checksum !== attachment.checksum_sha256) { await updateAttachment(attachment.id, companyId, { status: "failed", error_code: "CHECKSUM_MISMATCH", error_message: "The uploaded attachment checksum does not match." }); res.status(422).json({ error: "Attachment checksum mismatch.", code: "CHECKSUM_MISMATCH" }); return; }
    await storagePutAtKey(attachment.storage_key!, complete, attachment.mime_type);
    await Promise.all(expected.map((index) => storageDelete(`${attachment.storage_key}/chunks/${index}`).catch(() => undefined)));
    await updateAttachment(attachment.id, companyId, { status: "ready", uploaded_bytes: complete.length, uploaded_chunks: expected, checksum_sha256: checksum });
    res.json({ attachmentId: attachment.id, status: "ready", storageKey: attachment.storage_key, originalName: attachment.original_name, mimeType: attachment.mime_type, byteSize: complete.length, checksumSha256: checksum });
  } catch (error) { errorResponse(res, error); }
}

async function abort(req: Request, res: Response) {
  try {
    const { companyId } = await authenticateAndResolveCompany(req);
    const attachment = await getAttachment(String(req.params.attachmentId), companyId);
    if (!attachment) { res.status(404).json({ error: "Attachment upload session was not found." }); return; }
    for (let index = 0; index < attachment.total_chunks; index += 1) await storageDelete(`${attachment.storage_key}/chunks/${index}`).catch(() => undefined);
    await updateAttachment(attachment.id, companyId, { status: "cancelled" });
    res.json({ attachmentId: attachment.id, status: "cancelled" });
  } catch (error) { errorResponse(res, error); }
}

async function signedUrl(req: Request, res: Response) {
  try {
    const { companyId } = await authenticateAndResolveCompany(req);
    const attachment = await getAttachment(String(req.params.attachmentId), companyId);
    if (!attachment || !attachment.storage_key || !["ready", "attached"].includes(attachment.status)) { res.status(404).json({ error: "Ready attachment was not found." }); return; }
    res.json({ attachmentId: attachment.id, fileName: attachment.original_name, mimeType: attachment.mime_type, expiresIn: 900, url: await storageGetSignedUrl(attachment.storage_key, 900) });
  } catch (error) { errorResponse(res, error); }
}

export function registerEmailAttachmentRoutes(app: Express) {
  app.post("/api/communications/attachments/initiate", initiate);
  app.put("/api/communications/attachments/:attachmentId/chunks/:chunkIndex", express.raw({ type: "*/*", limit: "6mb" }), uploadChunk);
  app.post("/api/communications/attachments/:attachmentId/finalize", finalize);
  app.delete("/api/communications/attachments/:attachmentId", abort);
  app.get("/api/communications/attachments/:attachmentId/signed-url", signedUrl);
}

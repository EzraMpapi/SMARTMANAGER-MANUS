export const EMAIL_ATTACHMENT_POLICY = Object.freeze({
  maxFileBytes: 100 * 1024 * 1024,
  maxDirectSendBytes: 24 * 1024 * 1024,
  maxTotalDirectSendBytes: 24 * 1024 * 1024,
  chunkSizeBytes: 5 * 1024 * 1024,
  allowedMimeTypes: null,
});

export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB"];
  let size = value / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[index]}`;
}

export function validateEmailAttachment(file, policy = EMAIL_ATTACHMENT_POLICY) {
  if (!file) return { ok: false, code: "FILE_MISSING", message: "Attachment file is missing." };
  if (!file.name) return { ok: false, code: "FILE_NAME_MISSING", message: "Attachment must have a file name." };
  if (file.size > policy.maxFileBytes) return { ok: false, code: "FILE_TOO_LARGE", message: `${file.name} is ${formatBytes(file.size)}. The maximum is ${formatBytes(policy.maxFileBytes)}.` };
  if (Array.isArray(policy.allowedMimeTypes) && policy.allowedMimeTypes.length && !policy.allowedMimeTypes.includes(file.type)) {
    return { ok: false, code: "FILE_TYPE_NOT_ALLOWED", message: `${file.name} has an unsupported file type.` };
  }
  return { ok: true, code: null, message: null };
}

export function calculateAttachmentPlan(file, policy = EMAIL_ATTACHMENT_POLICY) {
  const totalChunks = Math.max(1, Math.ceil(file.size / policy.chunkSizeBytes));
  return { chunkSizeBytes: policy.chunkSizeBytes, totalChunks, directSend: file.size <= policy.maxDirectSendBytes };
}

export function totalAttachmentBytes(files = []) {
  return files.reduce((total, file) => total + (Number(file?.size) || 0), 0);
}

export function directSendEligibility(files = [], policy = EMAIL_ATTACHMENT_POLICY) {
  const invalid = files.map((file) => validateEmailAttachment(file, policy)).find((result) => !result.ok);
  if (invalid) return invalid;
  const totalBytes = totalAttachmentBytes(files);
  if (totalBytes > policy.maxTotalDirectSendBytes) {
    return { ok: false, code: "TOTAL_TOO_LARGE_FOR_DIRECT_SEND", message: `Attachments total ${formatBytes(totalBytes)}. They will be sent as secure links instead of inline Gmail attachments.` };
  }
  return { ok: true, code: null, message: null };
}

export async function sha256Hex(blob) {
  if (!globalThis.crypto?.subtle) return null;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

/**
 * Uploads a file one chunk at a time. The server callback owns authentication,
 * storage keys, and resumable session state; this helper never stores file
 * bytes in the database.
 */
export async function uploadFileInChunks(file, {
  uploadChunk,
  chunkSizeBytes = EMAIL_ATTACHMENT_POLICY.chunkSizeBytes,
  signal,
  onProgress,
  startChunk = 0,
} = {}) {
  if (typeof uploadChunk !== "function") throw new Error("uploadChunk callback is required.");
  const validation = validateEmailAttachment(file);
  if (!validation.ok) throw Object.assign(new Error(validation.message), { code: validation.code });
  const plan = calculateAttachmentPlan(file, { ...EMAIL_ATTACHMENT_POLICY, chunkSizeBytes });
  const checksum = await sha256Hex(file);
  let uploadedBytes = Math.min(file.size, startChunk * plan.chunkSizeBytes);
  let uploadResult = null;

  for (let chunkIndex = startChunk; chunkIndex < plan.totalChunks; chunkIndex += 1) {
    if (signal?.aborted) throw Object.assign(new Error("Attachment upload cancelled."), { code: "UPLOAD_CANCELLED" });
    const start = chunkIndex * plan.chunkSizeBytes;
    const end = Math.min(file.size, start + plan.chunkSizeBytes);
    const chunk = file.slice(start, end);
    uploadResult = await uploadChunk({ file, chunk, chunkIndex, totalChunks: plan.totalChunks, uploadedBytes, totalBytes: file.size, checksum });
    uploadedBytes = end;
    onProgress?.({ file, chunkIndex, totalChunks: plan.totalChunks, uploadedBytes, totalBytes: file.size, percent: Math.round((uploadedBytes / file.size) * 100), result: uploadResult });
  }

  return {
    ...uploadResult,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    byteSize: file.size,
    checksumSha256: checksum,
    chunkSizeBytes: plan.chunkSizeBytes,
    totalChunks: plan.totalChunks,
    directSend: plan.directSend,
  };
}

export function toAttachmentMetadata(file, uploaded = {}) {
  return {
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    storageKey: uploaded.storageKey || null,
    storageBucket: uploaded.storageBucket || null,
    checksumSha256: uploaded.checksumSha256 || null,
    uploadSessionId: uploaded.uploadSessionId || null,
    status: uploaded.status || "ready",
    sendMode: uploaded.directSend === false ? "secure_link" : "inline",
  };
}

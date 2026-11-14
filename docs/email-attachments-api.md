# Email attachment upload API

All endpoints require the authenticated Supabase bearer token:

```http
Authorization: Bearer <supabase-access-token>
```

Files are stored in the private Supabase Storage bucket configured by `SUPABASE_STORAGE_BUCKET`; the `email_attachments` table stores metadata and resumable state only.

## 1. Initiate an upload

```http
POST /api/communications/attachments/initiate
Content-Type: application/json
```

```json
{
  "fileName": "quotation.pdf",
  "mimeType": "application/pdf",
  "byteSize": 73400320,
  "checksumSha256": "optional-sha256",
  "emailMessageId": "optional-email-log-uuid",
  "communicationId": "optional-timeline-uuid"
}
```

Response:

```json
{
  "attachmentId": "uuid",
  "uploadSessionId": "uuid",
  "chunkSizeBytes": 5242880,
  "totalChunks": 14,
  "storageKey": "email-attachments/<company>/<session>/quotation.pdf",
  "status": "pending"
}
```

## 2. Upload each chunk

```http
PUT /api/communications/attachments/:attachmentId/chunks/:chunkIndex
Content-Type: application/octet-stream
```

The request body is one binary chunk. Chunks are 5 MB except the final chunk. The server validates the expected byte length and records uploaded chunk indexes.

Response:

```json
{
  "attachmentId": "uuid",
  "chunkIndex": 0,
  "uploadedChunks": [0],
  "uploadedBytes": 5242880,
  "totalBytes": 73400320,
  "percent": 7
}
```

## 3. Finalize

```http
POST /api/communications/attachments/:attachmentId/finalize
```

The server verifies all chunks, assembles the object in private storage, calculates SHA-256, optionally compares it with the client checksum, removes temporary chunk objects, and marks the record `ready`.

## 4. Abort

```http
DELETE /api/communications/attachments/:attachmentId
```

Temporary chunk objects are removed and the metadata row becomes `cancelled`.

## 5. Get a short-lived secure URL

```http
GET /api/communications/attachments/:attachmentId/signed-url
```

Returns a signed URL valid for 15 minutes. The endpoint is tenant-scoped and only returns objects in `ready` or `attached` state.

## Status flow

```text
pending -> uploading -> ready -> attached
                    \-> failed
pending/uploading -> cancelled
```

The Gmail send endpoint should only accept attachments in `ready` state. It should write the attachment IDs into `email_message_logs.attachment_metadata` and then update each attachment to `attached` after Gmail accepts the message.

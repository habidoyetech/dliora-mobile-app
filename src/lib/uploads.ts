import type { UploadTarget } from '@/types/api';

type PickedFile = { uri: string; name: string; mimeType?: string };

/**
 * Sends a picked file to wherever the API said it should go.
 *
 * Two shapes come back from `POST …/uploads`: a presigned `PUT` straight to
 * object storage (production, S3 or R2), or a multipart `POST` back to the API
 * when it's running on a local disk. Both end with the file sitting at
 * `target.path`, which the submission then names.
 */
export async function uploadToTarget(
  target: UploadTarget,
  file: PickedFile,
  token?: string | null,
): Promise<void> {
  if (target.method === 'PUT') {
    // The signature covers the headers the API gave us, so they go through
    // untouched — and no auth header, which would break it.
    const body = await fetch(file.uri).then((r) => r.blob());
    const response = await fetch(target.url, { method: 'PUT', headers: target.headers, body });

    if (!response.ok) {
      throw new Error(`Upload failed (${response.status}).`);
    }
    return;
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(target.fields ?? {})) {
    form.append(key, value);
  }
  form.append(target.field ?? 'file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);

  const response = await fetch(target.url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...target.headers,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status}).`);
  }
}

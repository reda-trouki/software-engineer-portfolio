/** Uploads an image for use in content (cover, inline image, badge) and returns its /media/… URL. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', 'image');
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || 'Upload failed.');
  return j.url as string;
}

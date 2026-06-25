import { cookies } from 'next/headers';

/**
 * Util fetch sisi server — wajib dipakai oleh Server Component.
 * Membaca token dari cookie dan mengirimkan Authorization header secara otomatis.
 * Menggunakan INTERNAL_API_BASE_URL agar bisa beda jaringan dari client-side.
 */
export async function fetchServer<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  const baseUrl =
    process.env.INTERNAL_API_BASE_URL || 'http://127.0.0.1:3001/api/v1';

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    // Data admin bersifat dinamis, jangan di-cache statis
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Gagal memuat data: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

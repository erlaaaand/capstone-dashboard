import { cookies } from 'next/headers';

/**
 * Fetch sisi server — wajib dipakai oleh Server Component.
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
    process.env.INTERNAL_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://nestjs-backed-production.up.railway.app/api/v1';

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    // Coba ekstrak pesan error dari body JSON jika ada
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json() as { message?: string };
      if (body.message) message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    } catch {
      // body bukan JSON, pakai status text saja
    }
    throw new Error(`Gagal memuat data: ${message}`);
  }

  return res.json() as Promise<T>;
}
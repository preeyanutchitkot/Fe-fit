import { API_BASE, fetchWithAdminAuth } from "@/app/lib/api";

export type PendingVideo = {
  id: number | string;
  title?: string | null;
  trainer_id?: number | string | null;
  trainer_name?: string | null;
  difficulty?: string | null;
  created_at?: string | null;
  s3_url?: string | null;
};

export function ensureVideoUrl(url?: string | null) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  const filename = String(url).replace(/^.*[\\/]/, "");
  return `${API_BASE}/static/${filename}`;
}

export async function listPendingVideos(): Promise<PendingVideo[]> {
  const res = await fetchWithAdminAuth("/admin/videos/pending");
  if (res.status === 401) throw new Error("Unauthorized (need admin token)");
  if (!res.ok) throw new Error(`Failed to load pending videos (${res.status})`);
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function approveVideo(videoId: number | string) {
  const res = await fetchWithAdminAuth(`/admin/videos/${videoId}/approve`, { method: "POST" });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(data?.detail || data?.message || "Approve failed");
  return data;
}

export async function rejectVideo(videoId: number | string, reason: string) {
  const res = await fetchWithAdminAuth(`/admin/videos/${videoId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(data?.detail || data?.message || "Reject failed");
  return data;
}

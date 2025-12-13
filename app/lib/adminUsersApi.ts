import { fetchWithAdminAuth, API_BASE } from "@/app/lib/api";

export type AdminTrainer = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  membersCount: number;
  videosCount: number;
  online: boolean;
};

export type AdminTrainee = {
  id: number | string;
  name?: string | null;
  email?: string | null;
};

export function profileImageUrl(userId: number | string) {
  return `${API_BASE}/profile-image/${userId}`;
}

function toNumber(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function inviteTrainer(email: string) {
  const res = await fetchWithAdminAuth("/invite-trainer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(data?.detail || data?.message || "Invite failed");
  return data;
}

async function safeCount(path: string): Promise<number> {
  try {
    const res = await fetchWithAdminAuth(path);
    if (!res.ok) return 0;
    const data = await res.json().catch(() => []);
    return Array.isArray(data) ? data.length : toNumber((data as any)?.count, 0);
  } catch {
    return 0;
  }
}

export async function getAdminTrainers(): Promise<AdminTrainer[]> {
  // Swagger: list trainers is GET /trainers (there is no GET /admin/trainers)
  const res = await fetchWithAdminAuth("/trainers");
  if (res.status === 401) throw new Error("Unauthorized (need admin token)");
  if (!res.ok) throw new Error(`Failed to load trainers (${res.status})`);

  const data = await res.json().catch(() => []);
  const list = Array.isArray(data) ? data : [];

  // Enrich counts using existing endpoints
  return Promise.all(
    list.map(async (t: any) => {
      const id = t.id;
      const [membersCount, videosCount] = await Promise.all([
        safeCount(`/admin/trainers/${id}/trainees`),
        safeCount(`/trainers/${id}/videos`),
      ]);

      return {
        id,
        name: t.name ?? null,
        email: t.email ?? null,
        membersCount,
        videosCount,
        online: Boolean(t.online ?? false),
      };
    })
  );
}

export async function getTrainees(): Promise<AdminTrainee[]> {
  const res = await fetchWithAdminAuth("/trainees");
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to load trainees");

  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

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
  profile_image?: string | null;
};

export type AdminWorkoutSession = {
  id: number;
  user_id: number;
  video_id: number;
  exercise_name: string;
  duration_seconds: number;
  average_accuracy: number;
  max_accuracy: number;
  body_part_scores?: Record<string, any> | null;
  session_data?: Record<string, any> | null;
  created_at?: string | null;
  completed_at?: string | null;
};

export type AdminVideo = {
  id: number;
  trainer_id: number;
  title?: string | null;
  difficulty?: string | null;
  description?: string | null;
  s3_url?: string | null;
  duration?: number | null;
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
  const res = await fetchWithAdminAuth("/admin/trainers");
  if (res.status === 401) throw new Error("Unauthorized (need admin token)");
  if (!res.ok) throw new Error(`Failed to load trainers (${res.status})`);

  const data = await res.json().catch(() => []);
  const list = Array.isArray(data) ? data : [];

  // Backend returns members_count/videos_count; normalize to camelCase
  return list.map((t: any) => ({
    id: t.id,
    name: t.name ?? null,
    email: t.email ?? null,
    membersCount: toNumber(t.members_count ?? t.membersCount ?? 0, 0),
    videosCount: toNumber(t.videos_count ?? t.videosCount ?? 0, 0),
    online: Boolean(t.online ?? t.isOnline ?? false),
  }));
}

export async function getAdminTrainerById(trainerId: number | string): Promise<AdminTrainer | null> {
  const list = await getAdminTrainers();
  const want = String(trainerId);
  return list.find((t) => String(t.id) === want) || null;
}

export async function getTrainees(): Promise<AdminTrainee[]> {
  const res = await fetchWithAdminAuth("/trainees");
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to load trainees");

  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function getAdminTrainerTrainees(trainerId: number | string): Promise<AdminTrainee[]> {
  const res = await fetchWithAdminAuth(`/admin/trainers/${trainerId}/trainees`);
  if (res.status === 401) throw new Error("Unauthorized (need admin token)");
  if (!res.ok) throw new Error(`Failed to load trainer trainees (${res.status})`);
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function getAdminTraineeWorkoutSessions(traineeId: number | string): Promise<AdminWorkoutSession[]> {
  const res = await fetchWithAdminAuth(`/admin/trainees/${traineeId}/workout-sessions`);
  if (res.status === 401) throw new Error("Unauthorized (need admin token)");
  if (!res.ok) throw new Error(`Failed to load trainee workout sessions (${res.status})`);
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function getTrainerVideosForAdmin(trainerId: number | string): Promise<AdminVideo[]> {
  const res = await fetchWithAdminAuth(`/trainers/${trainerId}/videos`);
  if (!res.ok) throw new Error(`Failed to load trainer videos (${res.status})`);
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

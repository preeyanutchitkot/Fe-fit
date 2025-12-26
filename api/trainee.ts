const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_BACKEND_URL || "/api/backend";

export type WorkoutSession = {
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

export async function pingUser(token: string) {
    try {
        await fetch(`${API_BASE}/users/ping`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
    } catch (e) {
        console.error("Ping failed", e);
    }
}

export async function getMyTrainer(token: string) {
    const res = await fetch(`${API_BASE}/my-trainer`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load trainer");
    return await res.json();
}

export async function getTrainerVideos(token: string, trainerId: string) {
    const res = await fetch(`${API_BASE}/trainers/${trainerId}/videos`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load videos");
    return await res.json();
}

export async function getMyWorkoutSessions(token: string): Promise<WorkoutSession[]> {
    const res = await fetch(`${API_BASE}/trainee/workout-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to load workout sessions");
    return (await res.json()) as WorkoutSession[];
}

export async function saveWorkoutSession(token: string, payload: unknown) {
    const res = await fetch(`${API_BASE}/trainee/workout-session`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save workout session");
    return await res.json();
}



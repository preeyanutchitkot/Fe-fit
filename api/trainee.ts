const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_BACKEND_URL || "/api/backend";

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



const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_BACKEND_URL || "/api/backend";

export async function getVideos(token: string) {
    const res = await fetch(`${API_BASE}/my-videos`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load videos");
    return await res.json();
}

export async function getTrainees(token: string) {
    const res = await fetch(`${API_BASE}/my-trainees`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load trainees");
    return await res.json();
}

export async function getTrainers(token: string) {
    const res = await fetch(`${API_BASE}/trainers`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load trainers");
    return await res.json();
}

export async function getTrainerDetail(token: string, id: string) {
    const res = await fetch(`${API_BASE}/trainers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load trainer detail");
    return await res.json();
}

export async function deleteVideo(token: string, videoId: string) {
    const res = await fetch(`${API_BASE}/videos/${videoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    return res;
}

export async function deleteTrainee(token: string, traineeId: string) {
    const res = await fetch(`${API_BASE}/my-trainees/${traineeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    return res;
}

export async function inviteTrainee(token: string, email: string) {
    const res = await fetch(`${API_BASE}/invite`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
    });
    return res;
}

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

export const PROFILE_IMAGE_URL = `${API_BASE}/profile-image`;

export async function uploadVideo(token: string, formData: FormData) {
    const res = await fetch(`${API_BASE}/videos`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to upload video");
    }
    return await res.json();
}

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

export async function updateVideo(token: string, videoId: string, data: any) {
    const res = await fetch(`${API_BASE}/videos/${videoId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update video metadata");
    }
    return await res.json();
}

export async function updateVideoFormData(token: string, videoId: string, formData: FormData) {
    const res = await fetch(`${API_BASE}/videos/${videoId}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update video");
    }
    return await res.json();
}

export async function updateVideoFile(token: string, videoId: string, formData: FormData) {
    const res = await fetch(`${API_BASE}/videos/${videoId}/file`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update video file");
    }
    return await res.json();
}

export async function getVideo(token: string, videoId: string) {
    const res = await fetch(`${API_BASE}/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch video details");
    return await res.json();
}

export async function resubmitVideo(token: string, videoId: string) {
    const res = await fetch(`${API_BASE}/videos/${videoId}/resubmit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to resubmit video");
    }
    return await res.json();
}

export async function getWeeklyFrequency(token: string, userId: string) {
    const res = await fetch(`${API_BASE}/analytics/weekly-frequency?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch weekly frequency");
    return await res.json();
}

export async function getStreak(token: string, userId: string) {
    const res = await fetch(`${API_BASE}/analytics/streak?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch streak");
    return await res.json();
}

export async function getCurrentStats(token: string, userId: string) {
    const res = await fetch(`${API_BASE}/analytics/current?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch current stats");
    return await res.json();
}

export async function getPersonalRecords(token: string, userId: string) {
    const res = await fetch(`${API_BASE}/analytics/records?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch personal records");
    return await res.json();
}

export async function getTraineeDetail(token: string, userId: string) {
    const res = await fetch(`${API_BASE}/trainees/${userId}`, {  // Or /users/${userId} if generic
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch trainee profile");
    return await res.json();
}

export async function getTrainerProfile(token: string) {
    const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        // Fallback or retry
        const res2 = await fetch(`${API_BASE}/trainers/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res2.ok) throw new Error("Failed to load trainer profile");
        return await res2.json();
    }
    return await res.json();
}

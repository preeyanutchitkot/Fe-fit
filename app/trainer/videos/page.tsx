"use client";
import React, { useEffect, useMemo, useState } from "react";
import DashboardHeader from "@/app/components/DashboardHeader";
import VideoCard from "@/app/components/VideoCard";
import { useRouter } from "next/navigation";
import { getVideos, deleteVideo, pingUser, getTrainerDetail, getTrainers, PROFILE_IMAGE_URL } from "@/api/trainer";
import { Upload, Search, Filter, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import Head from "next/head";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_BACKEND_URL || "/api/backend";

/* ---------- helpers ---------- */
function parseNumber(val: any) {
    if (typeof val === "number") return val;
    if (!val) return 0;
    const m = String(val).match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
}
function getSortableDate(v: any) {
    return new Date(v.created_at || v.updated_at || 0).getTime() || Number(v.id) || 0;
}
function getLevelKey(v: any) {
    const raw = v.difficulty ?? v.level ?? "";
    if (raw == null) return "Unspecified";
    const s = String(raw).trim();
    const m = s.match(/(\d+)/);
    return m ? `Level ${m[1]}` : (s || "Unspecified");
}
function levelOrderKey(levelKey: string) {
    const m = String(levelKey).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

export default function TrainerVideos() {
    const router = useRouter();

    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Reuse profile logic for header
    const [profile, setProfile] = useState<any>({ name: "", email: "", picture: "" });

    const fetchProfileData = async () => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        if (!token) return;

        try {
            const trainers = await getTrainers(token);
            let myProfile = null;
            if (Array.isArray(trainers)) {
                if (userData) {
                    const userObj = JSON.parse(userData);
                    myProfile = trainers.find((t: any) => t.email === userObj.email);
                }
                if (!myProfile) myProfile = trainers[0];
            }

            if (myProfile) {
                setProfile({
                    id: myProfile.id,
                    name: myProfile.name,
                    email: myProfile.email,
                    picture: `${PROFILE_IMAGE_URL}/${myProfile.id}`,
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteVideo = async (videoId: string) => {
        if (!confirm("Are you sure you want to delete this video?")) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await deleteVideo(token, videoId);
            if (res.ok) {
                setVideos(videos => videos.filter(v => v.id !== videoId));
            } else {
                throw new Error('Failed to delete video');
            }
        } catch (e) {
            alert('เกิดข้อผิดพลาดในการลบวิดีโอ');
            console.error(e);
        }
    };

    // controls
    const [q, setQ] = useState("");
    const [status, setStatus] = useState("all");     // all|active|draft|rejected
    const [levelFilter, setLevelFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date");    // date|title|duration|kcal|level
    const [order, setOrder] = useState<"asc" | "desc">("desc");      // asc|desc

    useEffect(() => {
        let stop = false;
        (async () => {
            setLoading(true);
            fetchProfileData();
            try {
                const token = localStorage.getItem("token");
                if (token) await getVideos(token).then((vids) => {
                    if (!Array.isArray(vids)) vids = [];
                    const mapped = vids.map((v: any) => {
                        let url = v.s3_url || "";
                        if (url && !/^https?:\/\//i.test(url)) {
                            url = `${API_BASE}/static/${url.replace(/^.*[\\\/]/, "")}`;
                        }
                        // ดึงเลข kcal จาก description
                        let kcal = v.kcal;
                        if (!kcal && typeof v.description === "string") {
                            const match = v.description.match(/kcal:(\d+)/);
                            if (match) kcal = Number(match[1]);
                        }
                        // แปลง duration จากวินาทีเป็นนาที ถ้ามี
                        let durationStr = "00:00";
                        if (typeof v.duration === 'number') {
                            const m = Math.floor(v.duration / 60);
                            const s = v.duration % 60;
                            durationStr = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
                        } else if (v.duration) {
                            durationStr = v.duration;
                        }

                        return {
                            ...v,
                            s3_url: url,
                            thumbnail: url,
                            kcal,
                            duration: durationStr,
                            // Internal fields for sorting/filtering
                            __title: (v.title || "").toLowerCase(),
                            __dur: v.duration, // raw seconds if available, or sort by string? Assuming backend sends seconds might be safer if standardized
                            __kcal: parseNumber(kcal),
                            __date: getSortableDate(v),
                            // เพิ่มสถานะ rejected แยกจาก draft/active
                            status: v.description?.includes("draft:true") ? "Draft" : (v.rejected ? "Rejected" : (v.approved ? "Active" : "Verifying")),
                            level: v.difficulty || v.level || 1,
                            __levelKey: getLevelKey(v),
                        };
                    });
                    if (!stop) setVideos(mapped);
                });

            } catch (e) { console.error(e); } finally {
                if (!stop) setLoading(false);
            }
        })();
        return () => {
            stop = true;
        };
    }, []);

    // สร้างรายการตัวเลือกเลเวล (เรียงจากน้อยไปมาก)
    const levelOptions = useMemo(() => {
        const keys = Array.from(new Set(videos.map((v) => v.__levelKey || "Unspecified")));
        return keys.sort((a, b) => levelOrderKey(a) - levelOrderKey(b));
    }, [videos]);

    // กรอง + เรียงผลลัพธ์ (แสดงเป็นกริดเดียว)
    const list = useMemo(() => {
        let rows = [...videos];

        // search
        if (q.trim()) {
            const qq = q.trim().toLowerCase();
            rows = rows.filter((v) => v.__title.includes(qq));
        }
        // filter by status
        if (status !== "all") {
            rows = rows.filter((v) => v.status.toLowerCase() === status.toLowerCase());
        }
        // filter by level
        if (levelFilter !== "all") {
            rows = rows.filter((v) => (v.__levelKey || "Unspecified") === levelFilter);
        }

        // sort
        rows.sort((a, b) => {
            let av: any, bv: any;
            switch (sortBy) {
                case "title":
                    av = a.__title; bv = b.__title; break;
                case "duration":
                    av = a.__dur || 0; bv = b.__dur || 0; break;
                case "kcal":
                    av = a.__kcal; bv = b.__kcal; break;
                case "level":
                    av = levelOrderKey(a.__levelKey || "Unspecified");
                    bv = levelOrderKey(b.__levelKey || "Unspecified");
                    break;
                default: // date
                    av = a.__date; bv = b.__date; break;
            }
            if (av < bv) return order === "asc" ? -1 : 1;
            if (av > bv) return order === "asc" ? 1 : -1;
            return 0;
        });
        return rows;
    }, [videos, q, status, levelFilter, sortBy, order]);

    return (
        <>
            <Head>
                <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;700&display=swap" rel="stylesheet" />
            </Head>
            <div className="min-h-screen bg-linear-to-br from-violet-50 via-white to-orange-50 font-sans" style={{ fontFamily: '"Google Sans Flex", Arial, sans-serif' }}>
                <DashboardHeader role="trainer" user={profile} />

                <main className="max-w-7xl mx-auto px-8 py-10">
                    {/* Header & Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push("/trainer")}
                                className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all text-gray-600 hover:text-violet-600"
                            >
                                <ArrowUpDown className="h-5 w-5 rotate-90" /> {/* Using rotate as back arrow replacement if needed, or stick to simple back text */}
                            </button>
                            <div>
                                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                    Video Library
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">Manage all your workout videos</p>
                            </div>
                        </div>

                        <Link
                            href="/uploadvideo"
                            className="flex items-center justify-center h-11 px-6 text-sm font-semibold rounded-full bg-gradient-to-r from-[#FF6A00] via-[#FF3CAC] to-[#784BA0] text-white shadow-lg shadow-pink-200 transition-all hover:scale-105 active:scale-95"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload New Video
                        </Link>
                    </div>

                    {/* Filters Bar */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-24 z-10 backdrop-blur-md bg-white/90">
                        {/* Left: Search */}
                        <div className="relative w-full lg:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-violet-200 transition-all outline-none text-sm"
                                placeholder="Search by title..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>

                        {/* Right: Filters */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                                <Filter className="h-4 w-4 text-gray-500" />
                                <span className="text-xs font-semibold text-gray-500 uppercase">Filters</span>
                            </div>

                            <select
                                value={levelFilter}
                                onChange={(e) => setLevelFilter(e.target.value)}
                                className="h-10 pl-3 pr-8 rounded-xl border-gray-200 bg-white text-sm focus:border-violet-500 focus:ring-violet-200 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <option value="all">All Levels</option>
                                {levelOptions.map((lv) => (
                                    <option key={lv} value={lv}>{lv}</option>
                                ))}
                            </select>

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="h-10 pl-3 pr-8 rounded-xl border-gray-200 bg-white text-sm focus:border-violet-500 focus:ring-violet-200 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="rejected">Rejected</option>
                                <option value="draft">Draft</option>
                            </select>

                            <div className="w-px h-8 bg-gray-200 mx-1"></div>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="h-10 pl-3 pr-8 rounded-xl border-gray-200 bg-white text-sm focus:border-violet-500 focus:ring-violet-200 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <option value="date">Newest First</option>
                                <option value="title">Alphabetical</option>
                                <option value="duration">Duration</option>
                                <option value="kcal">Calories</option>
                                <option value="level">Difficulty</option>
                            </select>

                            <button
                                onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
                                className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
                                title={`Order: ${order === "asc" ? "Ascending" : "Descending"}`}
                            >
                                <ArrowUpDown className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Grid Content */}
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-200 border-t-violet-600 mb-4"></div>
                            <p className="text-gray-500">Loading your videos...</p>
                        </div>
                    ) : list.length === 0 ? (
                        <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">No videos found</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-6">
                                {q || status !== 'all' ? "Try adjusting your search or filters to find what you're looking for." : "Get started by uploading your first workout video."}
                            </p>
                            {(q || status !== 'all') && (
                                <button
                                    onClick={() => { setQ(""); setStatus("all"); setLevelFilter("all"); }}
                                    className="text-violet-600 font-semibold hover:underline"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {list.map((video) => (
                                <VideoCard
                                    key={video.id}
                                    video={video}
                                    onDelete={handleDeleteVideo}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

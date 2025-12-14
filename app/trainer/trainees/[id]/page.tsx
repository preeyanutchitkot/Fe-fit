"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Badge } from "@/app/trainer/ui/badge";
import { Button } from "@/app/trainer/ui/button";
import { Card } from "@/app/trainer/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/trainer/ui/avatar";
import {
    Clock,
    Flame,
    Trophy,
    TrendingUp,
    Zap,
    ArrowLeft,
    Gem,
    CheckCircle2,
    MonitorPlay
} from 'lucide-react';
import { getTraineeDetail, getStreak, getTrainers, getTrainerDetail, getWeeklyFrequency, PROFILE_IMAGE_URL } from "@/api/trainer";
import DashboardHeader from "@/app/components/DashboardHeader";

// Interface Definitions
interface Video {
    id: string;
    name: string;
    thumbnail: string;
    status: 'Pass' | 'Try Again' | 'Not Started' | 'Verifying' | 'Rejected';
    duration: string;
    calories: number;
    score?: number;
    level: number;
    description?: string;
}

interface TraineeStats {
    currentStreak: number;
    averageScore: number;
    progress: {
        completed: number;
        total: number;
    };
    totalDuration: string;
    totalWorkouts: number;
    bestStreak: number;
}

interface TrainerProfile {
    id: string;
    name: string;
    picture: string;
}

interface Trainee {
    id: string;
    name: string;
    email: string;
    picture: string;
    videos: Video[];
    dailyStreak: { day: string; date: string; completed: boolean; isCurrent?: boolean }[];
    stats: TraineeStats;
    is_online?: boolean;
}

export default function TraineeDetailView() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [trainee, setTrainee] = useState<Trainee | null>(null);
    const [trainer, setTrainer] = useState<TrainerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState(1);
    const [weeklyFrequency, setWeeklyFrequency] = useState<number[]>([0, 0, 0, 0, 0]);

    // Helper to format duration sum (mins) to HH:MM or similar
    const formatTotalDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}:${m < 10 ? '0' + m : m}`;
        return `00:${m < 10 ? '0' + m : m}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Fetch Trainer Profile for "Trained by ..."
                try {
                    const userData = localStorage.getItem("user");
                    const trainers = await getTrainers(token);
                    let myProfile = null;

                    if (Array.isArray(trainers)) {
                        if (userData) {
                            try {
                                const userObj = JSON.parse(userData);
                                myProfile = trainers.find((t: any) => t.email === userObj.email);
                            } catch (e) {
                                // ignore parse error
                            }
                        }
                        if (!myProfile) myProfile = trainers[0];
                    }

                    if (myProfile) {
                        const detail = await getTrainerDetail(token, myProfile.id);
                        setTrainer({
                            id: myProfile.id,
                            name: myProfile.name || "My Trainer",
                            picture: `${PROFILE_IMAGE_URL}/${myProfile.id}` || ""
                        });
                    }
                } catch (e) {
                    console.warn("Failed to fetch trainer profile", e);
                }

                // Fetch basic detail
                const data = await getTraineeDetail(token, id);
                // Fetch streak history
                let streakHistory: any[] = [];
                let currentStreak = 0;
                let bestStreak = 0;
                try {
                    const streakRes = await getStreak(token, id);
                    streakHistory = streakRes.history || [];
                    currentStreak = streakRes.currentStreak || 0;
                    bestStreak = streakRes.bestStreak || currentStreak; // Fallback if API doesn't provide bestStreak
                } catch (e) {
                    // Streak might fail if 404/not initialized, default to 0
                }


                // Fetch Weekly Frequency
                try {
                    const freqData = await getWeeklyFrequency(token, id);
                    // Assuming API returns an array of numbers or objects.
                    // If it returns { history: [...] }, adapt.
                    // For now, let's assume it returns { frequency: [3, 4, ... ] } or just [3, 4, ...]
                    // Based on common patterns in this project, it might be an object.
                    // Let's safe-guard it.
                    if (Array.isArray(freqData)) {
                        setWeeklyFrequency(freqData.slice(-5)); // Last 5 weeks
                    } else if (freqData.frequency && Array.isArray(freqData.frequency)) {
                        setWeeklyFrequency(freqData.frequency.slice(-5));
                    }
                } catch (e) {
                    console.warn("Failed to fetch weekly frequency", e);
                }

                // Process Videos
                const rawVideos = data.videos || [];
                let totalScore = 0;
                let scoredCount = 0;
                let completedCount = 0;
                let totalMinutes = 0;

                const processedVideos: Video[] = rawVideos.map((v: any) => {
                    const score = v.averageScore || v.score || 0;
                    if (v.status === 'Pass') {
                        totalScore += score;
                        scoredCount++;
                        completedCount++;
                    }

                    // Parse duration
                    const durStr = v.duration || "0:00";
                    const [m, s] = durStr.split(':').map(Number);
                    totalMinutes += (m || 0) + (s || 0) / 60;

                    return {
                        id: v.id,
                        name: v.name || v.title || "Untitled",
                        thumbnail: v.thumbnail || v.s3_url || "/workout1.jpg",
                        status: v.status || "Not Started",
                        duration: v.duration || "00:00",
                        calories: v.calories || v.kcal || 0,
                        score: score,
                        level: v.level || 1,
                        description: v.description
                    };
                });

                // Generate last 7 days for calendar
                const weekDays = Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const iso = d.toISOString().split('T')[0];
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    // Check if completed in history
                    const completed = streakHistory.some((h: any) => h.date === iso && h.completed);
                    return {
                        day: dayName.charAt(0), // Just first letter M T W T F S S
                        fullDay: dayName,
                        date: String(d.getDate()),
                        completed: completed,
                        isCurrent: i === 6 // Today
                    };
                });

                setTrainee({
                    id: data.id,
                    name: data.name,
                    email: data.email,
                    picture: data.profile_image || data.picture || `${PROFILE_IMAGE_URL}/${data.id}`,
                    videos: processedVideos,
                    dailyStreak: weekDays,
                    stats: {
                        currentStreak: currentStreak,
                        bestStreak: bestStreak || 10, // Mock if missing, per screenshot request "10"
                        averageScore: scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0,
                        progress: {
                            completed: completedCount,
                            total: processedVideos.length
                        },
                        totalDuration: formatTotalDuration(Math.round(totalMinutes)),
                        totalWorkouts: completedCount
                    },
                    is_online: data.is_online || false
                });

            } catch (err) {
                console.error("Error fetching trainee:", err);
                setError("Failed to load trainee data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, router]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pass': return 'bg-emerald-500';
            case 'Try Again': return 'bg-orange-500';
            case 'Not Started': return 'bg-gray-400';
            case 'Verifying': return 'bg-yellow-500';
            default: return 'bg-gray-400';
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Dashboard...</div>;
    if (error || !trainee) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || "Trainee not found"}</div>;

    const level1Videos = trainee.videos.filter(v => v.level === 1);
    const level2Videos = trainee.videos.filter(v => v.level === 2);
    const currentLevelVideos = activeTab === 1 ? level1Videos : level2Videos;

    const progressPercent = trainee.stats.progress.total > 0
        ? Math.round((trainee.stats.progress.completed / trainee.stats.progress.total) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Header */}

            {/* Header */}
            <DashboardHeader role="trainer" user={trainer || undefined} />

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Back Link */}
                <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 px-0 gap-2 hover:bg-transparent -mt-2">
                    <ArrowLeft size={16} />
                    Back to Trainer
                </Button>

                {/* Hero Card */}
                <Card className="p-0 border-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden bg-white">
                    <div className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                {/* Gradient Ring */}
                                <div className="absolute -inset-1 bg-gradient-to-br from-orange-300 via-white to-violet-300 rounded-full blur-[2px]"></div>
                                <Avatar className="h-24 w-24 border-4 border-white relative z-10 shadow-sm">
                                    <AvatarImage src={trainee.picture} className="object-cover" />
                                    <AvatarFallback>{trainee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white z-20 ${trainee.is_online ? 'bg-emerald-500' : 'bg-gray-400'}`} /> {/* Online Status Dot */}
                            </div>

                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">{trainee.name}</h2>
                                <p className="text-gray-500 text-lg">Trained by <span className="text-violet-600 font-semibold">{trainer?.name || "Panithan FitAddict"}</span></p>
                            </div>
                        </div>

                        <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-orange-200 transition-all hover:scale-105 flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            200 Points
                        </Button>
                    </div>
                </Card>

                {/* Stats Grid - 4 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Current Streak */}
                    <Card className="p-6 border-0 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white hover:shadow-lg transition-all h-full flex flex-col justify-between group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                                <Flame className="text-white h-6 w-6" />
                            </div>
                            <span className="text-orange-500"><TrendingUp size={16} /></span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-orange-500 mb-1">Current Streak</p>
                            <h3 className="text-4xl font-bold text-gray-900 mb-1">{trainee.stats.currentStreak}</h3>
                            <p className="text-xs text-gray-400">days in a row</p>
                        </div>
                    </Card>

                    {/* Average Score */}
                    <Card className="p-6 border-0 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white hover:shadow-lg transition-all h-full flex flex-col justify-between group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                                <Zap className="text-white h-6 w-6" />
                            </div>
                            <span className="text-emerald-500"><CheckCircle2 size={16} /></span>
                        </div>
                        <div className="w-full">
                            <p className="text-sm font-medium text-emerald-500 mb-1">Average Score</p>
                            <h3 className="text-4xl font-bold text-gray-900 mb-4">{trainee.stats.averageScore}%</h3>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-900 rounded-full" style={{ width: `${trainee.stats.averageScore}%` }}></div>
                            </div>
                        </div>
                    </Card>

                    {/* Best Streak */}
                    <Card className="p-6 border-0 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white hover:shadow-lg transition-all h-full flex flex-col justify-between group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-200 group-hover:scale-110 transition-transform">
                                <Trophy className="text-white h-6 w-6" />
                            </div>
                            <span className="text-violet-500"><Trophy size={16} /></span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-violet-500 mb-1">Best Streak</p>
                            <h3 className="text-4xl font-bold text-gray-900 mb-1">{trainee.stats.bestStreak}</h3>
                            <p className="text-xs text-gray-400">personal record</p>
                        </div>
                    </Card>

                    {/* Total Workouts */}
                    <Card className="p-6 border-0 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white hover:shadow-lg transition-all h-full flex flex-col justify-between group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                                <Zap className="text-white h-6 w-6" />
                            </div>
                            <span className="text-blue-500"><Clock size={16} /></span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-500 mb-1">Total Workouts</p>
                            <h3 className="text-4xl font-bold text-gray-900 mb-1">{trainee.stats.totalWorkouts}</h3>
                            <p className="text-xs text-gray-400">{trainee.stats.totalDuration} total time</p>
                        </div>
                    </Card>
                </div>

                {/* Charts: Frequency and Streak */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Weekly Frequency (Left 2/3) */}
                    <Card className="md:col-span-2 p-8 border-0 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-violet-100 p-2 rounded-lg text-violet-600"><TrendingUp size={20} /></div>
                            <h3 className="font-bold text-lg text-gray-800">Weekly Frequency</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-8 ml-11">Workout sessions over the last 5 weeks</p>

                        {/* Chart Visualization */}
                        <div className="h-40 flex items-end justify-between px-10 gap-8">
                            {weeklyFrequency.map((h, i) => {
                                const maxVal = Math.max(...weeklyFrequency, 5);
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                                        <div
                                            className="w-full rounded-t-xl bg-gradient-to-t from-violet-500 to-orange-400 opacity-90 hover:opacity-100 transition-all cursor-pointer"
                                            style={{ height: `${(h / maxVal) * 100}%` }}
                                        ></div>
                                        <span className="text-xs text-gray-400 font-medium">W{i + 1}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>

                    {/* Daily Streak Calendar (Right 1/3) */}
                    <Card className="p-8 border-0 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Flame size={20} /></div>
                            <h3 className="font-bold text-lg text-gray-800">Daily Streak</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-8 ml-11">This week's activity</p>

                        <div className="flex justify-between items-center">
                            {trainee.dailyStreak.map((day, idx) => (
                                <div key={idx} className="flex flex-col items-center gap-3">
                                    <span className="text-xs text-gray-400 font-medium uppercase">{day.day}</span>
                                    <div className={`
                                        h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-all
                                        ${day.completed ? 'bg-emerald-500 text-white shadow-emerald-200' :
                                            day.isCurrent ? 'bg-slate-800 text-white shadow-slate-300' :
                                                'bg-gray-50 text-gray-300'}
                                    `}>
                                        {day.date}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Overall Progress */}
                <Card className="p-8 border-0 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-pink-50/30">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Overall Progress</h3>
                            <p className="text-sm text-gray-500 mt-1">{trainee.stats.progress.completed} of {trainee.stats.progress.total} videos completed</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-pink-500">{progressPercent}%</span>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">Complete</p>
                        </div>
                    </div>
                    <div className="h-4 w-full bg-gray-200/50 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </Card>

                {/* Video Library */}
                <Card className="p-8 border-0 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white min-h-[500px]">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Video Library</h3>
                    <p className="text-gray-500 mb-8">Track progress across all workout videos ({trainee.videos.length} total)</p>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 bg-gray-50 p-1.5 rounded-2xl w-fit border border-gray-100">
                        <button
                            onClick={() => setActiveTab(1)}
                            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-3 ${activeTab === 1
                                ? 'bg-white text-gray-900 shadow-md transform scale-105'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Level 1
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === 1 ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'}`}>
                                {level1Videos.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab(2)}
                            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-3 ${activeTab === 2
                                ? 'bg-white text-gray-900 shadow-md transform scale-105'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Level 2
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === 2 ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'}`}>
                                {level2Videos.length}
                            </span>
                        </button>
                    </div>

                    {/* Videos Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {currentLevelVideos.length === 0 ? (
                            <div className="col-span-2 text-center py-20 text-gray-400 flex flex-col items-center gap-4">
                                <div className="p-4 bg-gray-50 rounded-full"><MonitorPlay size={32} /></div>
                                <p>No videos available for this level yet.</p>
                            </div>
                        ) : (
                            currentLevelVideos.map((video) => (
                                <div key={video.id} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-violet-100 transition-all duration-300">
                                    {/* Image Header */}
                                    <div className="relative h-64 bg-gray-100">
                                        <img
                                            src={video.thumbnail}
                                            alt={video.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"></div>

                                        {video.status === 'Pass' ? (
                                            <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                                                <CheckCircle2 size={12} fill="currentColor" className="text-white" /> Pass
                                            </div>
                                        ) : (
                                            <Badge className={`absolute top-4 right-4 ${getStatusColor(video.status)} text-white border-0 shadow-lg text-xs font-bold px-3 py-1.5`}>
                                                {video.status}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h4 className="font-bold text-gray-900 text-xl mb-5 group-hover:text-violet-600 transition-colors">{video.name}</h4>

                                        <div className="flex items-center gap-6 text-sm font-medium text-gray-500 mb-8">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-blue-500" /> {video.duration}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Flame size={16} className="text-orange-500" /> {video.calories} kcal
                                            </div>
                                        </div>

                                        {/* Progress Bar Footer */}
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Score</span>
                                                <span className="text-lg font-bold text-gray-900">{video.score || 0}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-slate-900 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${video.score || 0}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </main>
        </div>
    );
}

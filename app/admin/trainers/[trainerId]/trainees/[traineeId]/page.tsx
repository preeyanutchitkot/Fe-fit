"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import DashboardHeader from "@/app/components/DashboardHeader";
import { Badge } from "@/app/trainer/ui/badge";
import { Button } from "@/app/trainer/ui/button";
import { Card } from "@/app/trainer/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/trainer/ui/avatar";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import { PROFILE_IMAGE_URL, getTraineeDetail } from "@/api/trainer";
import {
  getAdminTraineeWorkoutSessions,
  getTrainerVideosForAdmin,
  type AdminWorkoutSession,
} from "@/app/lib/adminUsersApi";

type TraineeStats = {
  currentStreak: number;
  averageScore: number;
  progress: {
    completed: number;
    total: number;
  };
  totalDuration: string;
  totalWorkouts: number;
  bestStreak: number;
};

type Trainee = {
  id: string;
  name: string;
  email?: string;
  picture: string;
  is_online?: boolean;
  dailyStreak: { day: string; date: string; completed: boolean; isCurrent?: boolean }[];
  stats: TraineeStats;
};

type TrainerProfile = {
  id: string;
  name: string;
  picture: string;
};

const toPercent = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  const v = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(v)));
};

const isoLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const startOfWeekMonday = (d: Date) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 0=Sun => go back 6 days, else go back to Monday
  date.setDate(date.getDate() + diff);
  return date;
};

const computeLast5WeeksFrequency = (sessions: AdminWorkoutSession[]) => {
  const countsByWeekStart = new Map<string, number>();
  for (const s of sessions) {
    const raw = s.completed_at || s.created_at;
    if (!raw) continue;
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) continue;
    const weekStart = isoLocalDate(startOfWeekMonday(dt));
    countsByWeekStart.set(weekStart, (countsByWeekStart.get(weekStart) || 0) + 1);
  }

  const thisWeekStart = startOfWeekMonday(new Date());
  const last5WeekStarts = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(thisWeekStart);
    d.setDate(thisWeekStart.getDate() - (4 - i) * 7);
    return isoLocalDate(d);
  });

  return last5WeekStarts.map((k) => countsByWeekStart.get(k) || 0);
};

const computeStreaks = (dateSet: Set<string>) => {
  if (dateSet.size === 0) return { current: 0, best: 0 };

  const sorted = Array.from(dateSet).sort();
  let best = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const next = new Date(sorted[i] + "T00:00:00");
    const diffDays = Math.round((next.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) cur += 1;
    else {
      best = Math.max(best, cur);
      cur = 1;
    }
  }
  best = Math.max(best, cur);

  let current = 0;
  const today = new Date();
  for (let i = 0; i < 366; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = isoLocalDate(d);
    if (dateSet.has(key)) current += 1;
    else break;
  }

  return { current, best };
};

const formatTotalDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}:${m < 10 ? "0" + m : m}`;
  return `00:${m < 10 ? "0" + m : m}`;
};

export default function AdminTraineeDashboardPage() {
  const router = useRouter();
  const params = useParams<{ trainerId: string; traineeId: string }>();
  const trainerId = params?.trainerId as string;
  const traineeId = params?.traineeId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [weeklyFrequency, setWeeklyFrequency] = useState<number[]>([0, 0, 0, 0, 0]);

  const [trainer, setTrainer] = useState<TrainerProfile | null>(null);
  const [trainee, setTrainee] = useState<Trainee | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    if (!token) router.replace("/admin/login");
  }, [router]);

  useEffect(() => {
    const run = async () => {
      if (!traineeId) return;
      setLoading(true);
      setError("");

      try {
        // Best-effort trainer display (admin view)
        setTrainer({
          id: trainerId,
          name: `Trainer #${trainerId}`,
          picture: `${PROFILE_IMAGE_URL}/${trainerId}`,
        });

        // Trainee profile (public endpoint in backend; header doesn't matter)
        const token = localStorage.getItem("admin_token") || localStorage.getItem("token") || "";
        const profile = await getTraineeDetail(token, traineeId);

        // Sessions via admin endpoint
        const sessions = await getAdminTraineeWorkoutSessions(traineeId);

        // Weekly frequency (derive directly from sessions)
        const freq = computeLast5WeeksFrequency(sessions);
        setWeeklyFrequency(freq);

        // Progress (derive from trainer videos vs completed session video_ids)
        let progressTotal = 0;
        let progressCompleted = 0;
        try {
          const trainerVideos = await getTrainerVideosForAdmin(trainerId);
          const videoIds = new Set(trainerVideos.map((v) => Number(v.id)).filter((n) => Number.isFinite(n)));
          progressTotal = videoIds.size;

          const completedVideoIds = new Set<number>();
          sessions.forEach((s) => {
            const vid = Number(s.video_id);
            if (Number.isFinite(vid) && videoIds.has(vid)) completedVideoIds.add(vid);
          });
          progressCompleted = completedVideoIds.size;
        } catch {
          // Keep progress at 0/0 if trainer videos fail to load
        }

        const totalWorkouts = sessions.length;
        const totalMinutes = Math.round(
          sessions.reduce((sum, s) => sum + (Number(s.duration_seconds) || 0) / 60, 0)
        );

        const avgScore = totalWorkouts > 0
          ? Math.round(
              sessions.reduce((sum, s) => sum + toPercent(Number(s.average_accuracy) || 0), 0) / totalWorkouts
            )
          : 0;

        const dateSet = new Set<string>();
        sessions.forEach((s: AdminWorkoutSession) => {
          const raw = s.completed_at || s.created_at;
          if (!raw) return;
          const d = new Date(raw);
          if (!Number.isNaN(d.getTime())) dateSet.add(isoLocalDate(d));
        });
        const { current: currentStreak, best: bestStreak } = computeStreaks(dateSet);

        // Build this week's calendar
        const today = new Date();
        const currentDay = today.getDay();
        const diff = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const weekDays = dayNames.map((dayName, index) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + index);
          const key = isoLocalDate(d);
          const isToday = isoLocalDate(d) === isoLocalDate(today);
          return {
            day: dayName.charAt(0),
            date: String(d.getDate()),
            completed: dateSet.has(key),
            isCurrent: isToday,
          };
        });

        setTrainee({
          id: String(profile.id),
          name: profile.name || `Trainee #${profile.id}`,
          email: profile.email,
          picture: profile.profile_image || `${PROFILE_IMAGE_URL}/${profile.id}`,
          is_online: Boolean(profile.is_online || false),
          dailyStreak: weekDays,
          stats: {
            currentStreak,
            bestStreak,
            averageScore: avgScore,
            progress: { completed: progressCompleted, total: progressTotal },
            totalDuration: formatTotalDuration(totalMinutes),
            totalWorkouts,
          },
        });
      } catch (e: any) {
        setError(e?.message || "Failed to load trainee dashboard");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [trainerId, traineeId]);

  const headerUser = useMemo(() => {
    return trainer ? { name: "Admin", picture: trainer.picture } : { name: "Admin" };
  }, [trainer]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading Dashboard...</div>;
  if (error || !trainee) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || "Trainee not found"}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-orange-50">
      <DashboardHeader role="admin" user={headerUser} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/trainers/${trainerId}`)}
          className="text-gray-500 hover:text-gray-900 px-0 gap-2 hover:bg-transparent -mt-2"
        >
          <ArrowLeft size={16} />
          Back to Trainer
        </Button>

        <Card className="p-8 mb-2 bg-gradient-to-br from-white to-violet-50/50 border-violet-100 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 rounded-full opacity-75 blur" />
                <Avatar className="h-24 w-24 relative ring-4 ring-white">
                  <AvatarImage src={trainee.picture} className="object-cover" />
                  <AvatarFallback className="text-2xl">{trainee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className={`absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white ${trainee.is_online ? "bg-green-500" : "bg-gray-400"} shadow-lg`} />
              </div>

              <div>
                <h2 className="text-3xl mb-2 text-gray-900">{trainee.name}</h2>
                <p className="text-gray-600">
                  Trained by <span className="text-violet-600">{trainer?.name || `Trainer #${trainerId}`}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className="px-4 py-2 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white border-0 shadow-lg text-base">
                <Trophy className="h-5 w-5 mr-2" />
                Admin View
              </Badge>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-white border-orange-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-sm text-orange-600 mb-1">Current Streak</p>
            <p className="text-4xl mb-1 text-gray-900">{trainee.stats.currentStreak}</p>
            <p className="text-xs text-gray-500">days in a row</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm text-emerald-600 mb-1">Average Score</p>
            <p className="text-4xl mb-1 text-gray-900">{trainee.stats.averageScore}%</p>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gray-900 rounded-full" style={{ width: `${trainee.stats.averageScore}%` }} />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-violet-50 to-white border-violet-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <Trophy className="h-5 w-5 text-violet-500" />
            </div>
            <p className="text-sm text-violet-600 mb-1">Best Streak</p>
            <p className="text-4xl mb-1 text-gray-900">{trainee.stats.bestStreak}</p>
            <p className="text-xs text-gray-500">personal record</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm text-blue-600 mb-1">Total Workouts</p>
            <p className="text-4xl mb-1 text-gray-900">{trainee.stats.totalWorkouts}</p>
            <p className="text-xs text-gray-500">{trainee.stats.totalDuration} total time</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-8 border-0 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-violet-100 p-2 rounded-lg text-violet-600"><TrendingUp size={20} /></div>
              <h3 className="font-bold text-lg text-gray-800">Weekly Frequency</h3>
            </div>
            <p className="text-gray-400 text-sm mb-8 ml-11">Workout sessions over the last 5 weeks</p>
            <div className="h-40 flex items-end justify-between px-10 gap-8">
              {weeklyFrequency.map((h, i) => {
                const maxVal = Math.max(...weeklyFrequency, 1);
                const heightPct = Math.round((h / maxVal) * 100);
                return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-violet-500 to-orange-400 opacity-90"
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-xs text-gray-400 font-medium">W{i + 1}</span>
                </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-8 border-0 shadow-[0_2px_15px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Flame size={20} /></div>
              <h3 className="font-bold text-lg text-gray-800">Daily Streak</h3>
            </div>
            <p className="text-gray-400 text-sm mb-8 ml-11">This week&apos;s activity</p>

            <div className="flex justify-between items-center">
              {trainee.dailyStreak.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <span className="text-xs text-gray-400 font-medium uppercase">{day.day}</span>
                  <div
                    className={`
                      h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-all
                      ${day.completed ? "bg-emerald-500 text-white shadow-emerald-200" : day.isCurrent ? "bg-slate-800 text-white shadow-slate-300" : "bg-gray-50 text-gray-300"}
                    `}
                  >
                    {day.date}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

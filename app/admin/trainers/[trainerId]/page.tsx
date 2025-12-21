"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/app/trainer/ui/avatar";
import { Button } from "@/app/trainer/ui/button";
import { Card } from "@/app/trainer/ui/card";
import { Badge } from "@/app/trainer/ui/badge";

import { ArrowLeft, Calendar, TrendingUp, Users, Video } from "lucide-react";

import {
  getAdminTrainerById,
  getAdminTrainerTrainees,
  getAdminTraineeWorkoutSessions,
  getTrainerVideosForAdmin,
  profileImageUrl,
  type AdminTrainee,
  type AdminTrainer,
} from "@/app/lib/adminUsersApi";

type TraineeVM = {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  currentStreak: number;
  averageScore: number;
  isOnline: boolean;
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

const computeCurrentStreak = (dateSet: Set<string>) => {
  if (dateSet.size === 0) return 0;
  const today = new Date();
  let current = 0;
  for (let i = 0; i < 366; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = isoLocalDate(d);
    if (dateSet.has(key)) current += 1;
    else break;
  }
  return current;
};

export default function AdminTrainerDashboardPage() {
  const router = useRouter();
  const params = useParams<{ trainerId: string }>();
  const trainerId = params?.trainerId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trainees, setTrainees] = useState<AdminTrainee[]>([]);
  const [trainer, setTrainer] = useState<AdminTrainer | null>(null);
  const [videosCount, setVideosCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    if (!token) router.replace("/admin/login");
  }, [router]);

  useEffect(() => {
    const run = async () => {
      if (!trainerId) return;
      setLoading(true);
      setError("");
      try {
        const [trainerInfo, traineeList, trainerVideos] = await Promise.all([
          getAdminTrainerById(trainerId),
          getAdminTrainerTrainees(trainerId),
          getTrainerVideosForAdmin(trainerId),
        ]);
        setTrainer(trainerInfo);
        const list = await getAdminTrainerTrainees(trainerId);
        setTrainees(list);
        setVideosCount(Array.isArray(trainerVideos) ? trainerVideos.length : 0);
      } catch (e: any) {
        setError(e?.message || "Failed to load trainees");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [trainerId]);

  const traineeVMs = useMemo<TraineeVM[]>(() => {
    return trainees.map((t) => ({
      id: String(t.id),
      name: (t.name || t.email || "—").trim() || "—",
      email: (t.email || "").trim(),
      profileImage: profileImageUrl(t.id),
      currentStreak: 0,
      averageScore: 0,
      isOnline: false,
    }));
  }, [trainees]);

  const [enrichedTrainees, setEnrichedTrainees] = useState<TraineeVM[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!trainerId) return;
      if (traineeVMs.length === 0) {
        setEnrichedTrainees([]);
        return;
      }
      try {
        const rows = await Promise.all(
          traineeVMs.map(async (t) => {
            try {
              const sessions = await getAdminTraineeWorkoutSessions(t.id);
              const avg = sessions.length > 0
                ? Math.round(
                    sessions.reduce((sum, s) => sum + toPercent(Number(s.average_accuracy) || 0), 0) / sessions.length
                  )
                : 0;
              const dateSet = new Set<string>();
              sessions.forEach((s) => {
                const raw = s.completed_at || s.created_at;
                if (!raw) return;
                const d = new Date(raw);
                if (!Number.isNaN(d.getTime())) dateSet.add(isoLocalDate(d));
              });
              const streak = computeCurrentStreak(dateSet);
              return { ...t, averageScore: avg, currentStreak: streak };
            } catch {
              return t;
            }
          })
        );
        setEnrichedTrainees(rows);
      } catch {
        setEnrichedTrainees(traineeVMs);
      }
    };

    void run();
  }, [trainerId, traineeVMs]);

  const membersCount = trainees.length;
  const onlineCount = trainees.filter((t: any) => Boolean((t as any).is_online)).length;

  const usagePeriod = "—";
  const resetDays = "—";

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-orange-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-violet-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/Logo_FitAddicttest.png" alt="FitAddict Logo" className="h-12 w-12 rounded-xl shadow-lg" />
              <h1 className="text-3xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 bg-clip-text text-transparent">
                FitAddict
              </h1>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-2xl bg-white text-violet-600 font-bold border border-violet-100 shadow-md hover:scale-105 transition-transform text-sm cursor-pointer"
              style={{ boxShadow: "0 2px 12px #a855f733" }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/users")}
          className="mb-6 -ml-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8 mb-8 bg-gradient-to-br from-white to-violet-50/50 border-violet-100 shadow-lg">
          <div className="flex items-start gap-6">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 rounded-full opacity-75 blur" />
              <Avatar className="h-24 w-24 relative ring-4 ring-white">
                <AvatarImage src={profileImageUrl(trainerId || "0")} alt={trainer?.name || `Trainer #${trainerId}`} />
                <AvatarFallback className="text-2xl">{(trainer?.name || `T${trainerId}`).charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white bg-gray-400 shadow-lg" />
            </div>

            <div className="flex-1">
              <h2 className="text-3xl mb-3 text-gray-900">{trainer?.name || `Trainer #${trainerId}`}</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl text-gray-900">{membersCount}</p>
                    <p className="text-xs text-gray-500">Members</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                    <Video className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-2xl text-gray-900">{trainer?.videosCount ?? videosCount}</p>
                    <p className="text-xs text-gray-500">Videos</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{usagePeriod}</p>
                    <p className="text-xs text-gray-500">Usage Period</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{resetDays}</p>
                    <p className="text-xs text-gray-500">Until Reset</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {error ? (
          <div className="w-full bg-white/70 border border-violet-100 rounded-2xl px-5 py-4 text-sm text-gray-600 shadow-sm mb-4">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h3 className="text-2xl mb-2 text-gray-900">Members</h3>
                <p className="text-gray-600">Click on a member to view their detailed profile and workout progress</p>
              </div>

              {enrichedTrainees.length > 0 ? (
                <div className="grid gap-4">
                  {enrichedTrainees.map((t) => (
                    <Card
                      key={t.id}
                      className="group p-5 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white border-l-4 border-l-transparent hover:border-l-orange-500"
                      onClick={() => router.push(`/admin/trainers/${trainerId}/trainees/${t.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="relative shrink-0">
                            <Avatar className="h-14 w-14 ring-2 ring-gray-100 group-hover:ring-orange-200 transition-all">
                              <AvatarImage src={t.profileImage} alt={t.name} />
                              <AvatarFallback>{t.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${t.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-lg mb-1 group-hover:text-orange-600 transition-colors text-gray-900">{t.name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                {t.currentStreak} day streak
                              </span>
                              <span className="text-gray-300">•</span>
                              <span>{t.averageScore}% avg score</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white border-0 shadow-md group-hover:shadow-lg transition-shadow">
                          View Profile
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white">
                  <div className="max-w-sm mx-auto">
                    <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                    <h4 className="text-lg mb-2 text-gray-900">No members yet</h4>
                    <p className="text-gray-500 text-sm">This trainer hasn't been assigned any members yet.</p>
                  </div>
                </Card>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <div className="mb-6">
                  <h3 className="text-2xl mb-2 text-gray-900">Quick Info</h3>
                  <p className="text-gray-600">Overview and statistics</p>
                </div>

                <div className="space-y-4">
                  <Card className="p-6 bg-gradient-to-br from-orange-50 to-pink-50 border-orange-100">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-200">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg mb-2 text-gray-900">Video Library</h4>
                    <p className="text-3xl mb-1 text-gray-900">{trainer?.videosCount ?? videosCount}</p>
                    <p className="text-sm text-gray-600">workout videos available</p>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-violet-50 to-blue-50 border-violet-100">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-200">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg mb-2 text-gray-900">Active Members</h4>
                    <p className="text-3xl mb-1 text-gray-900">{onlineCount}</p>
                    <p className="text-sm text-gray-600">members currently online</p>
                  </Card>

                  {/* <Card className="p-6 bg-white border-gray-200">
                    <h4 className="text-sm mb-4 text-gray-500 uppercase tracking-wider">How It Works</h4>
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">1</div>
                        <p>Select a member from the list to view their profile</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">2</div>
                        <p>Track their workout progress and statistics</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 mt-0.5">3</div>
                        <p>Monitor workout sessions and completion</p>
                      </div>
                    </div>
                  </Card> */}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

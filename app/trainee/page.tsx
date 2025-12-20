"use client";
import React, { useEffect, useState } from "react";
import DashboardHeader from '../components/DashboardHeader';
import { Card } from '../trainer/ui/card';
import { Badge } from '../trainer/ui/badge';
import { Button } from '../trainer/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../trainer/ui/avatar';
import { Clock, Flame, Play, RotateCw, Star, TrendingUp, Zap, Trophy, Users, Video } from 'lucide-react';
import { useRouter } from "next/navigation";
import { getMyTrainer, getTrainerVideos, getMyWorkoutSessions, pingUser, type WorkoutSession } from "@/api/trainee";
import { PROFILE_IMAGE_URL } from "@/api/trainer";

// Dummy data for visual stats (restoring UI fidelity)
const dummyTraineeStats = {
  dailyStreak: [
    { day: "Mon", date: "1", completed: true, isCurrent: false },
    { day: "Tue", date: "2", completed: true, isCurrent: false },
    { day: "Wed", date: "3", completed: false, isCurrent: true },
    { day: "Thu", date: "4", completed: false, isCurrent: false },
    { day: "Fri", date: "5", completed: false, isCurrent: false },
    { day: "Sat", date: "6", completed: false, isCurrent: false },
    { day: "Sun", date: "7", completed: false, isCurrent: false },
  ],
  stats: {
    currentStreak: 3,
    averageScore: 85,
    bestStreak: 7,
    totalWorkouts: 24,
    totalDuration: "12h 30m",
    progress: { completed: 8, total: 12 },
  },
};

interface VideoData {
  id: string;
  name: string;
  s3_url: string;
  thumbnail?: string;
  status: string;
  description?: string;
  duration?: string;
  calories?: number;
  level?: number | string;
  averageScore?: number;
  difficulty?: string;
  score?: number;
  statusBtn?: string;
  durationSeconds?: number;
}

interface TrainerData {
  id: string;
  name: string;
  picture: string;
  members: number;
  videos: number;
  email?: string;
}

export default function TraineeDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [trainer, setTrainer] = useState<TrainerData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(dummyTraineeStats.stats);
  const [dailyStreak, setDailyStreak] = useState(dummyTraineeStats.dailyStreak);

  const toPercent = (value: number) => {
    if (!Number.isFinite(value)) return 0;
    // Backend might return 0..1 or 0..100
    const v = value <= 1 ? value * 100 : value;
    return Math.max(0, Math.min(100, Math.round(v)));
  };

  const formatDurationHhMm = (totalSeconds: number) => {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const isoLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
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
      if (diffDays === 1) {
        cur += 1;
      } else {
        best = Math.max(best, cur);
        cur = 1;
      }
    }
    best = Math.max(best, cur);

    // current streak: consecutive days ending today
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

  // Initialize User
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      pingUser(token);

      try {
        const trainerData = await getMyTrainer(token);
        setTrainer({
          id: trainerData.id,
          name: trainerData.name || "My Trainer",
          picture: trainerData.profile_image || trainerData.picture,
          members: trainerData.members || 0,
          videos: trainerData.videos || 0
        });

        if (trainerData.id) {
          const vids = await getTrainerVideos(token, trainerData.id);
          const processedVideos = Array.isArray(vids) ? vids.map((v: any) => {
            let durationStr = "00:00";
            if (typeof v.duration === 'number') {
              const m = Math.floor(v.duration / 60);
              const s = v.duration % 60;
              durationStr = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            } else if (v.duration) {
              durationStr = v.duration;
            }

            // Extract Calories
            let calories = v.calories || v.kcal || 0;
            if (!calories && v.description) {
              const match = v.description.match(/(\d+)\s*(?:kcal|cal)/i) ||
                v.description.match(/(?:calories|cal)[:\s]*(\d+)/i);
              if (match) calories = parseInt(match[1]);
            }

            return {
              ...v,
              name: v.name || v.title || "Untitled Workout",
              calories: calories,
              level: v.level || v.difficulty || "General",
              status: v.status || "Not Started",
              score: v.score || 0,
              duration: durationStr,
              durationSeconds: typeof v.duration === 'number' ? v.duration : 0
            };
          }) : [];
          setVideos(processedVideos);

          // Workout sessions (real stats)
          let sessions: WorkoutSession[] = [];
          try {
            sessions = await getMyWorkoutSessions(token);
          } catch (e) {
            sessions = [];
          }

          const totalWorkoutsFromVideos = processedVideos.length;
          const completedCount = processedVideos.filter((v: any) => v.status === 'Pass').length;

          const totalDurationSecondsFromSessions = sessions.reduce(
            (sum, s) => sum + (Number(s.duration_seconds) || 0),
            0
          );
          const avgAccuracyPercent = sessions.length > 0
            ? Math.round(
              sessions.reduce((sum, s) => sum + toPercent(Number(s.average_accuracy) || 0), 0) / sessions.length
            )
            : 0;

          // Derive streaks & weekly calendar from sessions
          const dateSet = new Set<string>();
          sessions.forEach((s) => {
            const raw = s.completed_at || s.created_at;
            if (!raw) return;
            const d = new Date(raw);
            if (!Number.isNaN(d.getTime())) dateSet.add(isoLocalDate(d));
          });
          const { current: currentStreak, best: bestStreak } = computeStreaks(dateSet);

          // Build current week calendar based on sessions
          const today = new Date();
          const currentDay = today.getDay(); // 0=Sun
          const diff = currentDay === 0 ? -6 : 1 - currentDay;
          const monday = new Date(today);
          monday.setDate(today.getDate() + diff);
          const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          const currentWeekData = days.map((dayName, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            const key = isoLocalDate(date);
            const isToday = isoLocalDate(date) === isoLocalDate(today);
            return {
              day: dayName,
              date: String(date.getDate()),
              completed: dateSet.has(key),
              isCurrent: isToday,
            };
          });
          setDailyStreak(currentWeekData);

          setStats({
            currentStreak,
            bestStreak,
            averageScore: avgAccuracyPercent,
            totalWorkouts: sessions.length > 0 ? sessions.length : totalWorkoutsFromVideos,
            totalDuration: sessions.length > 0 ? formatDurationHhMm(totalDurationSecondsFromSessions) : formatDurationHhMm(
              processedVideos.reduce((acc: number, v: any) => acc + (v.durationSeconds || 0), 0)
            ),
            // progress = assigned videos progress (keep existing behavior)
            progress: { completed: completedCount, total: totalWorkoutsFromVideos }
          });
        }
      } catch (e) {
        console.log("No trainer assigned");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) pingUser(token);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const videosByLevel: { [key: string]: VideoData[] } = {};
  videos.forEach(v => {
    const lvl = String(v.level || "General");
    if (!videosByLevel[lvl]) videosByLevel[lvl] = [];
    videosByLevel[lvl].push(v);
  });
  const sortedLevels = Object.keys(videosByLevel).sort();


  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_BACKEND_URL || "/api/backend";
  const getVideoUrl = (v: VideoData) => {
    if (v.s3_url) {
      if (v.s3_url.startsWith("http")) return v.s3_url;
      return `${API_BASE}/static/${v.s3_url.replace(/^.*[\\\/]/, "")}`;
    }
    return "/workout1.jpg";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-orange-50">
      <DashboardHeader role="trainee" user={user} />
      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-10">
          <h2 className="text-4xl mb-2">My Dashboard</h2>
          <p className="text-gray-600 text-lg">Track your progress and workouts</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Trainer Card */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-l-4 border-l-violet-500 rounded-2xl shadow hover:shadow-lg transition-all duration-300">
                <h3 className="text-sm text-gray-600 mb-3">My Trainer</h3>
                {trainer ? (
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12 relative ring-2 ring-white">
                        <AvatarImage src={trainer.picture || `${PROFILE_IMAGE_URL}/${trainer.id}`} alt={trainer.name} referrerPolicy="no-referrer" />
                        <AvatarFallback>{trainer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 shadow-lg" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold">{trainer.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {trainer.members}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {trainer.videos} Videos</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No trainer assigned.
                    <br />Waiting for an invite.
                  </div>
                )}
              </Card>

              {/* Daily Streak (Visual Only) */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-orange-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Flame className="h-4 w-4 text-orange-500" />
                  </div>
                  <h3 className="text-sm">Daily Streak</h3>
                </div>
                <div className="flex items-center justify-between gap-1">
                  {dailyStreak.map((day, index) => (
                    <div key={index} className="flex flex-col items-center gap-1.5">
                      <p className="text-xs text-gray-600">{day.day[0]}</p>
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 ${day.completed ? 'bg-green-500 text-white shadow-md shadow-green-200' :
                          day.isCurrent ? 'bg-gray-800 text-white shadow-md' :
                            'bg-gray-300 text-white'
                          }`}
                      >
                        <span className="text-xs">{day.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Stats (Visual Only) */}
              <Card className="p-4 bg-white/80 backdrop-blur-sm border-violet-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-violet-600" />
                  </div>
                  <h3 className="text-sm">Quick Stats</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Flame className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Streak</p>
                        <p className="text-sm">{stats.currentStreak}d</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Star className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Avg Score</p>
                        <p className="text-sm">{stats.averageScore}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Progress</p>
                        <p className="text-sm">{stats.progress.completed}/{stats.progress.total}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="text-sm">{stats.totalDuration}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-gray-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Workouts</p>
                        <p className="text-sm">{stats.totalWorkouts}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-2xl mb-2">My Workouts ({videos.length})</h3>
              <p className="text-gray-600">Your personalized workout videos</p>
            </div>

            {videos.length === 0 && (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No videos assigned yet.</p>
              </div>
            )}

            {sortedLevels.map(level => (
              <div key={level} className="mb-8">
                <h4 className="mb-4 text-xl font-semibold text-gray-700">Level: {level} ({videosByLevel[level].length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {videosByLevel[level].map(v => (
                    <Card key={v.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-300 hover:border-violet-200">
                      <div className="relative h-48 bg-white overflow-hidden flex items-center justify-center">
                        {v.s3_url && (v.s3_url.endsWith(".mp4") || v.s3_url.endsWith(".mov")) ? (
                          <video
                            src={getVideoUrl(v)}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            muted
                            onMouseOver={(e: any) => e.currentTarget.play()}
                            onMouseOut={(e: any) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          />
                        ) : (
                          <img
                            src={getVideoUrl(v)}
                            alt={v.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
                        <Badge className={`absolute top-3 right-3 text-white border-0 shadow-lg px-3 py-1 rounded-full ${v.status === 'Pass' ? 'bg-emerald-500' :
                          v.status === 'Try Again' ? 'bg-orange-500' : 'bg-gray-400'
                          }`}>
                          {v.status}
                        </Badge>
                      </div>
                      <div className="p-5">
                        <h5 className="mb-3 truncate text-lg font-medium group-hover:text-violet-600 transition-colors">{v.name}</h5>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span>{v.duration || "00:00"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <span>{v.calories || 0} Kcal</span>
                          </div>
                        </div>
                        {v.score ? (
                          <div className="text-sm text-gray-600 mb-3">
                            My score: <strong className="text-gray-900">{v.score}%</strong>
                          </div>
                        ) : null}

                        <Button
                          variant="default"
                          className="w-full h-12 flex flex-row items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-base shadow-none border-0 hover:shadow-xl hover:scale-[1.02] transition-transform rounded-xl"
                          onClick={() => router.push(`/workout/${v.id}`)}
                        >
                          <Play className="h-5 w-5 fill-white" />
                          <span className="relative top-[1px]">Play</span>
                        </Button>
                        {v.status !== 'Not Started' && (
                          <Button variant="default" className="mt-2 w-full text-sm h-8 bg-gray-100 text-gray-600 hover:bg-gray-200 border-0 shadow-none">
                            <RotateCw className="h-4 w-4 mr-2" /> Replay
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main >
    </div >
  );
}
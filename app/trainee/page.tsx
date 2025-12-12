"use client";
import React, { useEffect, useState } from "react";
import DashboardHeader from '../components/DashboardHeader';
import { Card } from '../trainer/ui/card';
import { Badge } from '../trainer/ui/badge';
import { Button } from '../trainer/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../trainer/ui/avatar';
import { Clock, Flame, Play, RotateCw, Star, TrendingUp, Zap, Trophy, Users, Video } from 'lucide-react';
import { useRouter } from "next/navigation";
import { getMyTrainer, getTrainerVideos, pingUser } from "@/api/trainee";
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
          try {
            const vids = await getTrainerVideos(token, trainerData.id);
            setVideos(Array.isArray(vids) ? vids.map((v: any) => {
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
                level: v.level || v.difficulty || "General",
                status: v.status || "Not Started",
                score: v.score || 0,
                duration: durationStr
              };
            }) : []);
          } catch (err) {
            console.error("Failed to fetch videos", err);
          }
        }
      } catch (e) {
        console.log("No trainer assigned or error fetching trainer");
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

  // Poll videos if trainer exists
  useEffect(() => {
    if (!trainer?.id) return;
    const interval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (token && trainer.id) {
        try {
          const vids = await getTrainerVideos(token, trainer.id);
          setVideos(Array.isArray(vids) ? vids.map((v: any) => {
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
              level: v.level || v.difficulty || "General",
              status: v.status || "Not Started",
              score: v.score || 0,
              duration: durationStr
            };
          }) : []);
        } catch { }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [trainer?.id]);

  // Group videos by Level/Difficulty
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
                  {dummyTraineeStats.dailyStreak.map((day, index) => (
                    <div key={index} className="flex flex-col items-center gap-1.5">
                      <p className="text-xs text-gray-600">{day.day[0]}</p>
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200 ${day.completed ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-200' :
                          day.isCurrent ? 'bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-md' :
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
                        <p className="text-sm">{dummyTraineeStats.stats.currentStreak}d</p>
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
                        <p className="text-sm">{dummyTraineeStats.stats.averageScore}%</p>
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
                        <p className="text-sm">{dummyTraineeStats.stats.progress.completed}/{dummyTraineeStats.stats.progress.total}</p>
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
                        <p className="text-sm">{dummyTraineeStats.stats.totalDuration}</p>
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
                        <p className="text-sm">{dummyTraineeStats.stats.totalWorkouts}</p>
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
                      <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                        {v.s3_url?.endsWith(".mp4") ? (
                          <video
                            src={getVideoUrl(v)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            muted
                            onMouseOver={(e: any) => e.currentTarget.play()}
                            onMouseOut={(e: any) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          />
                        ) : (
                          <img
                            src={getVideoUrl(v)}
                            alt={v.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
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
                            <span>{v.calories || 0}</span>
                          </div>
                        </div>
                        {v.score ? (
                          <div className="text-sm text-gray-600 mb-3">
                            My score: <strong className="text-gray-900">{v.score}%</strong>
                          </div>
                        ) : null}

                        <Button
                          variant="default"
                          className="w-full gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-semibold text-base shadow-none border-0 hover:shadow-xl hover:scale-[1.02] transition-transform"
                          onClick={() => router.push(`/workout/${v.id}`)}
                        >
                          <Play className="h-5 w-5 fill-white" />
                          Play
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
      </main>
    </div>
  );
} 
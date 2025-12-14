"use client";
import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import VideoCard from "@/app/components/VideoCard";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import DashboardHeader from "@/app/components/DashboardHeader";
import Link from "next/link";
import {
  Users,
  Video,
  Calendar,
  Upload,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getVideos, getTrainees, getTrainers, getTrainerDetail, deleteVideo, deleteTrainee, PROFILE_IMAGE_URL, pingUser } from "@/api/trainer";
import InviteTrainee from "@/app/components/InviteTrainee";

interface Trainee {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  is_online?: boolean | string | number;
  stats?: { currentStreak: number; averageScore: number };
}

interface VideoData {
  id: string;
  name: string;
  s3_url: string;
  thumbnail?: string;
  status: string;
  description?: string;
  duration?: string;
  calories?: number;
  level?: number;
  averageScore?: number;
  rejected?: boolean;
  approved?: boolean;
}

export default function TrainerPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>({ name: "", email: "", picture: "", is_online: false });
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVideosData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      let vids = await getVideos(token);
      vids = Array.isArray(vids)
        ? vids.map((v: any) => {
          // Logic to fix s3_url if needed, similar to previous implementation
          let url = v.s3_url || "";
          const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_BACKEND_URL || "/api/backend";
          if (url && url.startsWith("/static/")) {
            url = `${API_BASE}${url}`;
          } else if (url && !/^https?:\/+/.test(url)) {
            url = `${API_BASE}/static/${url.replace(/^.*[\\\/]/, "")}`;
          }

          let status = "";
          if (v.description?.includes("draft:true")) status = "Draft";
          else if (v.rejected) status = "Rejected";
          else if (v.approved) status = "Active";
          else status = "Verifying";

          let kcal = undefined;
          const match = v.description?.match(/kcal:(\d+)/);
          if (match) kcal = Number(match[1]);


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
            name: v.title || v.name || "Untitled Video",
            s3_url: url,
            thumbnail: url,
            status,
            calories: kcal,
            duration: durationStr,
            level: v.difficulty || v.level || 1
          };
        })
        : [];
      setVideos(vids);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTraineesData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const data = await getTrainees(token);
      const mappedData = Array.isArray(data)
        ? data.map((t: any) => ({ ...t, id: t.id || t._id }))
        : [];
      setTrainees(mappedData);
    } catch (e) {
      console.error(e);
    }
  };

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
        const detail = await getTrainerDetail(token, myProfile.id);
        setProfile({
          id: myProfile.id,
          name: myProfile.name,
          email: myProfile.email,
          picture: `${PROFILE_IMAGE_URL}/${myProfile.id}`,
          is_online: detail.is_online
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await deleteVideo(token, videoId);
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== videoId));
      } else {
        alert("Failed to delete video");
      }
    } catch (e) {
      alert("Error deleting video");
    }
  };

  const handleDeleteTrainee = async (trainee: Trainee) => {
    if (!confirm(`Remove ${trainee.name} from your team?`)) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await deleteTrainee(token, trainee.id);
      if (res.ok || res.status === 204) {
        setTrainees((prev) => prev.filter((t) => t.id !== trainee.id));
      } else {
        alert("Failed to remove trainee");
      }
    } catch (e) {
      alert("Error removing trainee");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Initial fetch and ping
    fetchProfileData();
    fetchVideosData();
    fetchTraineesData();
    if (token) pingUser(token);

    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token) pingUser(token);

      // Re-fetch data including online status
      fetchProfileData();
      fetchVideosData();
      fetchTraineesData();
    }, 5000); // 5 seconds poll

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-white to-orange-50">
      <DashboardHeader role="trainer" user={profile} />
      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-10">
          <div className="mb-6">
            <h2 className="text-4xl mb-2">Trainer Dashboard</h2>
            <p className="text-gray-600 text-lg">Manage your members and workout videos</p>
          </div>
          <Card className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 bg-linear-to-r from-orange-500 via-pink-500 to-violet-600 rounded-full opacity-75 blur"></div>
                <Avatar className="h-20 w-20 relative ring-2 ring-white">
                  <AvatarImage
                    src={profile.picture || undefined}
                    alt={profile.name || "Trainer"}
                    referrerPolicy="no-referrer"
                  />
                  <AvatarFallback className="text-xl">{(profile.name || "T").charAt(0)}</AvatarFallback>
                </Avatar>
                <div
                  className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white shadow-lg ${profile.is_online ? 'bg-green-500' : 'bg-gray-400'}`}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl mb-4">{profile.name || "Trainer"}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl">{trainees.length}</p>
                      <p className="text-xs text-gray-600">Members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                      <Video className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-2xl">{videos.length}</p>
                      <p className="text-xs text-gray-600">Videos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm">Active</p>
                      <p className="text-xs text-gray-600">Status</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl">-</p>
                      <p className="text-xs text-gray-600">Rank</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="mb-6">
                <h3 className="text-2xl mb-2">Members ({trainees.length})</h3>
                <p className="text-gray-600 text-sm">Quick access</p>
              </div>

              <Card className="mb-4 p-4 bg-white bg-violet-50 rounded-xl shadow border border-violet-200">
                <InviteTrainee onSuccess={() => fetchTraineesData()} />
              </Card>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {trainees.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">No members yet</div>
                ) : (
                  trainees.map((trainee) => (
                    <Card
                      key={trainee.id}
                      className="group p-3 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-orange-500 bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10 ring-2 ring-gray-100 group-hover:ring-orange-200 transition-all">
                            <AvatarImage
                              src={trainee.profile_image || `${PROFILE_IMAGE_URL}/${trainee.id}`}
                              alt={trainee.name || "Member"}
                              referrerPolicy="no-referrer"
                            />
                            <AvatarFallback className="text-sm">{(trainee.name || "M").charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${trainee.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0" onClick={() => router.push(`/trainer/trainees/${trainee.id}`)}>
                          <p className="text-sm truncate group-hover:text-orange-600 transition-colors">{trainee.name || "Unknown Member"}</p>
                          <p className="text-xs text-gray-500 truncate">{trainee.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent flex items-center justify-center"
                          onClick={(e: any) => { e.stopPropagation(); handleDeleteTrainee(trainee); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl mb-2">Video Library ({videos.length})</h3>
                <Link href="/trainer/videos" className="text-sm text-violet-600 font-semibold hover:underline">
                  Manage / See All
                </Link>
                <p className="text-gray-600">Manage your workout videos</p>
              </div>
              <Link href="/uploadvideo" className="flex items-center justify-center h-9 px-4 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#FF6A00] via-[#FF3CAC] to-[#784BA0] text-white border-0 shadow-none transition-all duration-200 hover:brightness-105 focus:ring-2 focus:ring-pink-200">
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Link>
            </div>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onDelete={handleDeleteVideo}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-16 text-center bg-linear-to-br from-gray-50 to-white">
                <div className="w-24 h-24 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>
                <h4 className="text-xl mb-2 text-gray-900">No videos yet</h4>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Upload your first workout video to start building your video library
                </p>
                <Link href="/uploadvideo" className="flex items-center justify-center h-11 px-6 text-base font-semibold rounded-lg text-white bg-linear-to-r from-orange-500 via-pink-500 to-violet-600 hover:shadow-xl inline-flex">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload First Video
                </Link>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

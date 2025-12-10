"use client";
import React, { useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";


import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import DashboardHeader from "@/app/components/DashboardHeader";
import Link from "next/link";
import { Users, Video, Calendar, Plus, Upload, Clock, Flame, TrendingUp } from "lucide-react";

const mockTrainees = [
  { 
    id: "1",
    name: "John Doe",
    profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
    isOnline: true,
    stats: { currentStreak: 5, averageScore: 92 }
  },
  {
    id: "3",
    name: "P FitAddict",
    profileImage: "https://randomuser.me/api/portraits/men/43.jpg",
    isOnline: true,
    stats: { currentStreak: 12, averageScore: 92 }
  },
  {
    id: "2",
    name: "Few FitAddict",
    profileImage: "https://randomuser.me/api/portraits/women/65.jpg",
    isOnline: false,
    stats: { currentStreak: 5, averageScore: 75 }
  }
];

const mockVideos = [
  {
    id: "v1",
    name: "HIIT Cardio",
    thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    status: "Active",
    duration: "30:00",
    calories: 350,
    level: 2,
    averageScore: 88
  },
  { 
    id: "v2",
    name: "Yoga Flow",
    thumbnail: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400",
    status: "Draft",
    duration: "45:00",
    calories: 200,
    level: 1,
    averageScore: null
  }
];

export default function TrainerPage() {
  const [role, setRole] = useState<"trainer" | "admin" | "trainee">("trainer");

  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-white to-orange-50">
      {/* Header */}
      <DashboardHeader role={role} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Hero Section */}
        <div className="mb-10">
          <div className="mb-6">
            <h2 className="text-4xl mb-2">Trainer Dashboard</h2>
            <p className="text-gray-600 text-lg">Manage your members and workout videos</p>
          </div>
          {/* Trainer Profile Card */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 bg-linear-to-r from-orange-500 via-pink-500 to-violet-600 rounded-full opacity-75 blur"></div>
                <Avatar className="h-20 w-20 relative ring-2 ring-white">
                  <AvatarImage src="https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400" alt="Panithan FitAddict" />
                  <AvatarFallback className="text-xl">P</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white bg-green-500 shadow-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl mb-4">Panithan FitAddict</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl">{mockTrainees.length}</p>
                      <p className="text-xs text-gray-600">Members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                      <Video className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-2xl">{mockVideos.length}</p>
                      <p className="text-xs text-gray-600">Videos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm">Aug 01 - Sep 01</p>
                      <p className="text-xs text-gray-600">Usage Period</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl">27 days</p>
                      <p className="text-xs text-gray-600">Until Reset</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members Section - Compact */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="mb-6">
                <h3 className="text-2xl mb-2">Members ({mockTrainees.length})</h3>
                <p className="text-gray-600 text-sm">Quick access</p>
              </div>
              {/* Invite Section - Compact */}
              <Card className="mb-4 p-4 bg-white bg-violet-50 rounded-xl shadow border border-violet-200">
                <form className="flex flex-col gap-3 items-stretch">
                  <Input 
                    placeholder="member@email.com" 
                    type="email"
                    className="h-11 text-base border border-gray-200 bg-white rounded-lg shadow-none focus:ring-2 focus:ring-pink-200 w-full px-4"
                  />
                  <Button
                    type="submit"
                    className="flex items-center justify-center h-11 w-full text-base font-semibold rounded-lg bg-gradient-to-r from-[#FF6A00] via-[#FF3CAC] to-[#784BA0] text-white shadow-none border-0 transition-all duration-200 hover:brightness-105 focus:ring-2 focus:ring-pink-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Invite Member
                  </Button>
                </form>
              </Card>
              {/* Member List - Compact */}
              <>
                {mockTrainees.length > 0 ? (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {mockTrainees.map((trainee) => (
                      <Card
                        key={trainee.id}
                        className="group p-3 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-orange-500 bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <Avatar className="h-10 w-10 ring-2 ring-gray-100 group-hover:ring-orange-200 transition-all">
                              <AvatarImage src={trainee.profileImage} alt={trainee.name} />
                              <AvatarFallback className="text-sm">{trainee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${trainee.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate group-hover:text-orange-600 transition-colors">{trainee.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span>{trainee.stats.currentStreak}d</span>
                              <span>•</span>
                              <span>{trainee.stats.averageScore}%</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : null}
              </>
            </div>
          </div>
          {/* Videos Section - Expanded */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl mb-2">Video Library ({mockVideos.length})</h3>
                <p className="text-gray-600">Manage your workout videos</p>
              </div>
              <Button 
                asChild
              >
                <Link href="/uploadvideo" className="flex items-center justify-center h-9 px-4 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#FF6A00] via-[#FF3CAC] to-[#784BA0] text-white border-0 shadow-none transition-all duration-200 hover:brightness-105 focus:ring-2 focus:ring-pink-200">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Video
                </Link>
              </Button>
            </div>
            {mockVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                {mockVideos.map((video) => (
                  <Card key={video.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-gray-300 rounded-2xl">
                    <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                      <img 
                        src={video.thumbnail} 
                        alt={video.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-0 shadow-lg px-3 py-1 rounded-full">
                        Active
                      </Badge>
                    </div>
                    <div className="p-5">
                      <h4 className="text-lg mb-3 truncate group-hover:text-violet-600 transition-colors">{video.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span>{video.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span>{video.calories} kcal</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Level {video.level}
                        </Badge>
                      </div>
                      {video.averageScore !== null ? (
                        <div className="text-sm text-gray-600">
                          Avg Score: <strong className="text-gray-900">{video.averageScore}%</strong>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">
                          No scores yet
                        </div>
                      )}
                    </div>
                  </Card>
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
                <Button 
                  asChild
                  className="bg-linear-to-r from-orange-500 via-pink-500 to-violet-600 hover:shadow-xl"
                  size="lg"
                >
                  <Link href="/uploadvideo" className="flex items-center justify-center h-11 px-6 text-base font-semibold rounded-lg text-white">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload First Video
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

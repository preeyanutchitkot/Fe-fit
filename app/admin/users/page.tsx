"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminTrainers,
  inviteTrainer,
  profileImageUrl,
  type AdminTrainer,
} from "@/app/lib/adminUsersApi";

import { Card } from "@/app/trainer/ui/card";
import { Input } from "@/app/trainer/ui/input";
import { Button } from "@/app/trainer/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/trainer/ui/avatar";
import { Badge } from "@/app/trainer/ui/badge";
import { Calendar, Mail, Search, Sparkles, Users, Video } from "lucide-react";

type TrainerVM = {
  id: string;
  name: string;
  profileImage: string;
  isOnline: boolean;
  membersCount: number;
  videosCount: number;
  usagePeriod: string;
  resetDays: number;
};

export default function AdminUsersPage() {
  const router = useRouter();

  const [rawTrainers, setRawTrainers] = useState<AdminTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string>("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    if (!token) router.replace("/admin/login");
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const t1 = await getAdminTrainers();
      setRawTrainers(t1);
    } catch (e: any) {
      setError(e?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const trainers = useMemo<TrainerVM[]>(() => {
    return rawTrainers.map((t) => {
      const name = (t.name || t.email || "—").trim() || "—";
      return {
        id: String(t.id),
        name,
        profileImage: profileImageUrl(t.id),
        isOnline: Boolean(t.online),
        membersCount: Number(t.membersCount || 0),
        videosCount: Number(t.videosCount || 0),
        usagePeriod: "—",
        resetDays: 0,
      };
    });
  }, [rawTrainers]);

  const filteredTrainers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trainers;
    return trainers.filter((t) => t.name.toLowerCase().includes(q));
  }, [search, trainers]);

  const stats = useMemo(() => {
    const totalMembers = trainers.reduce((sum, t) => sum + (t.membersCount || 0), 0);
    const totalVideos = trainers.reduce((sum, t) => sum + (t.videosCount || 0), 0);
    const activeTrainers = trainers.length;
    const onlineCount = trainers.filter((t) => t.isOnline).length;
    return { totalMembers, totalVideos, activeTrainers, onlineCount };
  }, [trainers]);

  const onInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;

    setInviting(true);
    setInviteStatus("Sending...");
    try {
      await inviteTrainer(email);
      setInviteStatus("Invitation sent");
      setInviteEmail("");
      await load();
    } catch (e: any) {
      setInviteStatus(e?.message || "Invite failed");
    } finally {
      setInviting(false);
    }
  };

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
        <div className="mb-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-4xl mb-2 text-gray-900">Manage Users</h2>
              <p className="text-gray-600 text-lg">Manage your trainers and track their progress</p>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{stats.onlineCount} Online</span>
              </div>
              <span className="text-gray-300">•</span>
              <span>{trainers.length} Total Trainers</span>
            </div>
          </div>

          {error ? (
            <div className="w-full bg-white/70 border border-violet-100 rounded-2xl px-5 py-4 text-sm text-gray-600 shadow-sm mb-4">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
              <Input
                placeholder="Search trainers by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-12 border-gray-200 bg-white shadow-sm hover:shadow-md focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
              />
            </div>

            <div className="flex gap-3 flex-1">
              <div className="relative flex-1 group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
                <Input
                  placeholder="trainer@email.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviting}
                  className="pl-11 h-12 border-gray-200 bg-white shadow-sm hover:shadow-md focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all duration-200"
                />
              </div>
              <Button
                onClick={onInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="h-12 px-6 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 hover:shadow-xl hover:shadow-violet-300/50 hover:scale-105 transition-all duration-200 whitespace-nowrap group rounded-xl"
              >
                <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                {inviting ? "Inviting..." : "Invite"}
              </Button>
            </div>
          </div>

          {inviteStatus ? <p className="mt-3 text-sm text-gray-500">{inviteStatus}</p> : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 border border-orange-100 bg-gradient-to-br from-orange-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 mb-1">Total Members</p>
                <p className="text-3xl text-gray-900">{stats.totalMembers}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <Users className="h-7 w-7 text-orange-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border border-pink-100 bg-gradient-to-br from-pink-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600 mb-1">Total Videos</p>
                <p className="text-3xl text-gray-900">{stats.totalVideos}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                <Video className="h-7 w-7 text-pink-500" />
              </div>
            </div>
          </Card>

          <Card className="p-5 border border-violet-100 bg-gradient-to-br from-violet-50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-violet-600 mb-1">Active Trainers</p>
                <p className="text-3xl text-gray-900">{stats.activeTrainers}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <Calendar className="h-7 w-7 text-violet-500" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-5">
          <h3 className="text-xl mb-1 text-gray-900">Trainers</h3>
          <p className="text-gray-500">Click on a trainer to view their members</p>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : (
          <div className="grid gap-4">
            {filteredTrainers.map((trainer) => (
              <Card
                key={trainer.id}
                className="group p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-violet-500 bg-white/80 backdrop-blur-sm"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/admin/trainers/${trainer.id}`)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/admin/trainers/${trainer.id}`);
                  }
                }}
              >
                <div className="flex items-center gap-6">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 rounded-full opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                    <Avatar className="h-20 w-20 relative ring-2 ring-white">
                      <AvatarImage
                        src={trainer.profileImage}
                        alt={trainer.name}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <AvatarFallback className="text-xl">{trainer.name.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-3 border-white ${
                        trainer.isOnline ? "bg-green-500" : "bg-gray-400"
                      } shadow-lg`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl mb-2 truncate text-gray-900 group-hover:text-violet-600 transition-colors">
                      {trainer.name}
                    </h4>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-orange-600" />
                        </div>
                        <span>
                          <strong className="text-gray-900">{trainer.membersCount}</strong> Members
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                          <Video className="h-4 w-4 text-pink-600" />
                        </div>
                        <span>
                          <strong className="text-gray-900">{trainer.videosCount}</strong> Videos
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-violet-600" />
                        </div>
                        <span>{trainer.usagePeriod}</span>
                      </div>
                    </div>
                  </div>

                  <Badge className="px-4 py-2 border border-violet-200 text-violet-600 group-hover:bg-violet-50 transition-colors shrink-0 bg-transparent rounded-xl">
                    Resets in {trainer.resetDays}d
                  </Badge>
                </div>
              </Card>
            ))}

            {filteredTrainers.length === 0 ? <div className="text-gray-500">No trainers</div> : null}
          </div>
        )}
      </main>
    </div>
  );
}

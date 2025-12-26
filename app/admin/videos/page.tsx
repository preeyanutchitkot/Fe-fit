"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/trainer/ui/button";
import { Card } from "@/app/trainer/ui/card";
import { Input } from "@/app/trainer/ui/input";
import { Badge } from "@/app/trainer/ui/badge";
import { Calendar, CheckCircle2, ChevronLeft, MailX, Play, RefreshCcw, Search } from "lucide-react";
import {
  approveVideo,
  ensureVideoUrl,
  listPendingVideos,
  rejectVideo,
  type PendingVideo,
} from "@/app/lib/adminVideosApi";

type SortBy = "created" | "title" | "trainer";

type Row = PendingVideo & {
  _src: string;
  _title: string;
  _trainerId: string;
  _trainerName: string;
  _created: number;
  _difficulty: string;
  _createdLabel: string;
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

export default function AdminVideosPage() {
  const router = useRouter();

  const previewBodyRef = useRef<HTMLDivElement | null>(null);
  const rejectBodyRef = useRef<HTMLDivElement | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("created");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [preview, setPreview] = useState<null | { title: string; src: string }>(null);
  const [rejecting, setRejecting] = useState<null | { id: number | string; title: string }>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    if (!token) router.replace("/admin/login");
  }, [router]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    router.replace("/admin/login");
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listPendingVideos();
      const mapped: Row[] = (Array.isArray(data) ? data : []).map((v: any) => {
        const title = String(v.title || "");
        const trainerId = v.trainer_id != null ? String(v.trainer_id) : "";
        const trainerName = String(v.trainer_name || "");
        const difficulty = String(v.difficulty || "Unspecified").trim();
        const createdAt = v.created_at ? new Date(v.created_at).getTime() : 0;
        return {
          ...v,
          _src: ensureVideoUrl(v.s3_url),
          _title: title.toLowerCase(),
          _trainerId: trainerId,
          _trainerName: trainerName.toLowerCase(),
          _created: Number.isFinite(createdAt) ? createdAt : 0,
          _difficulty: difficulty,
          _createdLabel: fmtDate(v.created_at),
        };
      });
      setRows(mapped);
    } catch (e: any) {
      setError(e?.message || "Failed to load pending videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const levelOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r._difficulty).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const list = useMemo(() => {
    let arr = [...rows];

    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      arr = arr.filter(
        (v) => v._title.includes(qq) || v._trainerId.includes(qq) || (v._trainerName && v._trainerName.includes(qq))
      );
    }

    if (level !== "all") arr = arr.filter((v) => v._difficulty === level);

    arr.sort((a, b) => {
      let av: any;
      let bv: any;
      if (sortBy === "title") {
        av = a._title;
        bv = b._title;
      } else if (sortBy === "trainer") {
        av = a._trainerName || a._trainerId;
        bv = b._trainerName || b._trainerId;
      } else {
        av = a._created;
        bv = b._created;
      }

      if (av < bv) return order === "asc" ? -1 : 1;
      if (av > bv) return order === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [rows, q, level, sortBy, order]);

  const onApprove = async (id: number | string) => {
    try {
      await approveVideo(id);
      await load();
    } catch (e: any) {
      alert(e?.message || "Approve failed");
    }
  };

  const onConfirmReject = async () => {
    if (!rejecting) return;
    try {
      await rejectVideo(rejecting.id, reason);
      setRejecting(null);
      setReason("");
      await load();
    } catch (e: any) {
      alert(e?.message || "Reject failed");
    }
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

            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/admin")}
                className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-violet-600 font-bold border border-violet-100 shadow-md hover:scale-105 transition-transform text-sm cursor-pointer"
                style={{ boxShadow: "0 2px 12px #a855f733" }}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={logout}
                className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-violet-600 font-bold border border-violet-100 shadow-md hover:scale-105 transition-transform text-sm cursor-pointer"
                style={{ boxShadow: "0 2px 12px #a855f733" }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-4xl mb-2 text-gray-900">Pending Videos</h2>
              <p className="text-gray-600 text-lg">Review and approve trainer uploaded videos</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="text-gray-300 hidden lg:inline">•</span>
              <span>{rows.length} Pending</span>
              <Button
                onClick={load}
                className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-violet-600 font-bold border border-violet-100 shadow-md hover:scale-105 transition-transform text-sm cursor-pointer"
                style={{ boxShadow: "0 2px 12px #a855f733" }}
              >
                <RefreshCcw className="h-4 w-4" />
                Reload
              </Button>
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
                placeholder="Search by title or trainer..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-11 h-12 border-gray-200 bg-white shadow-sm hover:shadow-md focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
              />
            </div>

            <div className="flex gap-3 flex-1">
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="h-12 w-full border border-gray-200 bg-white shadow-sm hover:shadow-md rounded-xl px-4 text-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
              >
                <option value="all">All levels</option>
                {levelOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="h-12 w-full border border-gray-200 bg-white shadow-sm hover:shadow-md rounded-xl px-4 text-gray-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
              >
                <option value="created">Sort by created</option>
                <option value="title">Sort by title</option>
                <option value="trainer">Sort by trainer</option>
              </select>

              <Button
                onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
                className="h-12 px-5 inline-flex items-center justify-center rounded-xl bg-white text-violet-600 font-bold border border-violet-100 shadow-md hover:scale-105 transition-transform text-sm cursor-pointer whitespace-nowrap"
                style={{ boxShadow: "0 2px 12px #a855f733" }}
              >
                {order === "asc" ? "Asc" : "Desc"}
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="text-gray-500">ไม่มีวิดีโอรอตรวจ</div>
        ) : (
          <div className="grid gap-4">
            {list.map((v) => (
              <Card
                key={String(v.id)}
                className="p-6 bg-white/80 backdrop-blur-sm border border-violet-100 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-xl text-gray-900 truncate">{v.title || "Untitled"}</h3>
                      <Badge className="px-3 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
                        {v._difficulty}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                      <div className="inline-flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-violet-600" />
                        <span>{v._createdLabel}</span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <span className="font-semibold text-gray-900">Trainer:</span>
                        <span className="truncate">{v.trainer_name || v.trainer_id || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
                    <Button
                      onClick={() => setPreview({ title: v.title || "Video", src: v._src })}
                      className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-violet-600 font-bold border border-violet-100 shadow-md hover:scale-105 transition-transform text-sm cursor-pointer"
                      style={{ boxShadow: "0 2px 12px #a855f733" }}
                    >
                      <Play className="h-4 w-4" />
                      Preview
                    </Button>

                    <Button
                      onClick={() => onApprove(v.id)}
                      className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white font-bold shadow-md hover:shadow-xl hover:shadow-violet-300/50 hover:scale-105 transition-all duration-200 text-sm cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>

                    <Button
                      onClick={() => setRejecting({ id: v.id, title: v.title || "Video" })}
                      className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-rose-600 font-bold border border-rose-100 shadow-md hover:scale-105 transition-transform text-sm cursor-pointer"
                      style={{ boxShadow: "0 2px 12px #fb718533" }}
                    >
                      <MailX className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {preview ? (
        <>
          <div
            ref={previewBodyRef}
            className="fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setPreview(null)} />
            <div className="relative min-h-full flex items-start justify-center">
              <div className="w-full max-w-4xl my-8 bg-white rounded-2xl shadow-xl border border-violet-100 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-violet-100 shrink-0">
                  <div className="font-bold text-gray-900 truncate">{preview.title}</div>
                  <Button
                    onClick={() => setPreview(null)}
                    className="h-9 px-4 rounded-xl bg-white text-violet-600 font-bold border border-violet-100 shadow-md"
                    style={{ boxShadow: "0 2px 12px #a855f733" }}
                  >
                    Close
                  </Button>
                </div>
                <div className="p-4 flex-1 overflow-auto">
                  {preview.src ? (
                    <video
                      src={preview.src}
                      controls
                      className="w-full max-h-[75vh] rounded-xl object-contain touch-pan-y"
                      onWheel={(e) => {
                        const scroller = previewBodyRef.current;
                        if (!scroller) return;
                        scroller.scrollTop += e.deltaY;
                        if (scroller.scrollHeight > scroller.clientHeight) e.preventDefault();
                      }}
                    />
                  ) : (
                    <div className="text-gray-500">No preview available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {rejecting ? (
        <>
          <div
            ref={rejectBodyRef}
            className="fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setRejecting(null)} />
            <div className="relative min-h-full flex items-start justify-center">
              <div className="w-full max-w-lg my-8 bg-white rounded-2xl shadow-xl border border-violet-100 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-violet-100 shrink-0">
                  <div className="font-bold text-gray-900 truncate">Reject: {rejecting.title}</div>
                  <Button
                    onClick={() => setRejecting(null)}
                    className="h-9 px-4 rounded-xl bg-white text-violet-600 font-bold border border-violet-100 shadow-md"
                    style={{ boxShadow: "0 2px 12px #a855f733" }}
                  >
                    Close
                  </Button>
                </div>
                <div className="p-5 flex-1 overflow-auto">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="ใส่เหตุผล/คำแนะนำ เช่น เสียงเบาเกินไป, มุมกล้องไม่เห็นท่าชัด ฯลฯ"
                    className="w-full h-32 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-700 shadow-sm focus:border-violet-400 focus:ring-2 focus:ring-violet-200 transition-all duration-200"
                  />

                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={onConfirmReject}
                      className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-rose-600 font-bold border border-rose-100 shadow-md hover:scale-105 transition-transform text-sm cursor-pointer"
                      style={{ boxShadow: "0 2px 12px #fb718533" }}
                    >
                      Confirm reject
                    </Button>
                    <Button
                      onClick={() => setRejecting(null)}
                      className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-violet-600 font-bold border border-violet-100 shadow-md hover:scale-105 transition-transform text-sm cursor-pointer"
                      style={{ boxShadow: "0 2px 12px #a855f733" }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

"use client";
import React, { useRef, useState, useEffect } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { useRouter, useSearchParams } from "next/navigation";
import Head from "next/head";
import { uploadVideo, updateVideo, updateVideoFile, getVideo, resubmitVideo, updateVideoFormData } from "@/api/trainer";
import KeypointOverlay from "../components/KeypointOverlay";
import JointSelector from "../components/JointSelector";

const exerciseNames = [
  "Squat", "Lunge", "Glute Bridge", "Calf Raise", "Wall Sit",
  "Side Lunge", "Push-up", "Tricep Dips", "Arm Circles", "Pike Push-up",
  "Shadow Boxing", "Plank", "Crunches", "Sit-up", "Leg Raise",
  "Russian Twist", "Bicycle Crunches", "Superman", "Jumping Jacks", "Mountain Climbers"
];

export default function UploadVideoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  // New refs for KeypointOverlay
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [submittingDraft, setSubmittingDraft] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileURL, setFileURL] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("1");
  const [exerciseFamily, setExerciseFamily] = useState("");
  const [selectedJoints, setSelectedJoints] = useState<string[]>([]);
  const [kcal, setKcal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(true);
  const [originalVideo, setOriginalVideo] = useState<any>(null);
  const [levelOpen, setLevelOpen] = useState(false);
  const [exerciseFamilyOpen, setExerciseFamilyOpen] = useState(false);

  // Edit mode logic
  const editId = searchParams.get("editId");
  const isEdit = Boolean(editId);

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (!isEdit || !editId) return;

    // Fetch from backend
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        setIsLoading(true);
        const v = await getVideo(token, editId);

        setName(v.title || "");
        setLevel(String(v.difficulty || "1"));

        // Extract kcal from description if needed, or use v.kcal if backend sends it separately
        let extractedKcal = "";
        if (v.kcal !== undefined && v.kcal !== null) {
          extractedKcal = v.kcal;
        } else if (typeof v.description === "string") {
          const match = v.description.match(/kcal:(\d+)/);
          if (match) extractedKcal = match[1];
        }
        setKcal(extractedKcal);

        // Extract exercise family
        let extractedExercise = v.exercise_family || "";
        if (!extractedExercise) {
          const exMatch = typeof v.description === "string" ? v.description.match(/exercise:([^;]+)/) : null;
          if (exMatch) extractedExercise = exMatch[1];
        }
        setExerciseFamily(extractedExercise);

        // Extract joints
        let extractedJoints: string[] = [];

        if (v.important_joints) {
          if (Array.isArray(v.important_joints)) {
            // Check if it's string[] or object[]
            if (v.important_joints.length > 0 && typeof v.important_joints[0] === 'object') {
              extractedJoints = v.important_joints.map((j: any) => j.jointName);
            } else {
              extractedJoints = v.important_joints;
            }
          } else if (typeof v.important_joints === 'string') {
            // Handle potential JSON string or comma-separated string
            try {
              const parsed = JSON.parse(v.important_joints);
              if (Array.isArray(parsed)) {
                if (parsed.length > 0 && typeof parsed[0] === 'object') {
                  extractedJoints = parsed.map((j: any) => j.jointName);
                } else {
                  extractedJoints = parsed;
                }
              } else {
                extractedJoints = v.important_joints.split(",");
              }
            } catch {
              extractedJoints = v.important_joints.split(",");
            }
          }
        }

        // Fallback to description (only if nothing found in column)
        if (extractedJoints.length === 0) {
          const jointsMatch = typeof v.description === "string" ? v.description.match(/joints:([^;]+)/) : null;
          if (jointsMatch) {
            extractedJoints = jointsMatch[1].split(",");
          }
        }
        setSelectedJoints(extractedJoints);

        // Handle URL
        const url = v.s3_url
          ? (/^https?:\/\//i.test(v.s3_url)
            ? v.s3_url
            : `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}/static/${v.s3_url.replace(/^.*[\\\/]/, "")}`)
          : "";
        setFileURL(url);
        setOriginalVideo(v);
      } catch (e) {
        console.error("Failed to fetch video details", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isEdit, editId]);

  const onPick = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFileURL(URL.createObjectURL(f));
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    setFileURL(URL.createObjectURL(f));
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleSaveDraft = async () => {
    if (!file && !isEdit) { // Require file for new drafts
      if (!file || !name) {
        alert("กรุณาเลือกไฟล์และกรอกชื่อวิดีโอ");
        return;
      }
    } else if (isEdit && !name) { // For edit, file is optional but name is required
      alert("กรุณากรอกชื่อวิดีโอ");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No authentication token found");
      return;
    }

    setSubmittingDraft(true);
    setIsLoading(true);

    try {
      // Construct payload with Schema: { jointName: string, weight: number }[]
      const structuredJoints = selectedJoints.map(j => ({
        jointName: j,
        weight: 1.0
      }));

      if (isEdit && editId) {
        const payload: any = {
          title: name,
          difficulty: level,
          exercise_family: exerciseFamily,
          important_joints: structuredJoints, // Send as object array
          description: `kcal:${kcal || 0};draft:true`,
        };
        await updateVideo(token, editId, payload);
        // If file changed
        if (file) {
          const fd = new FormData();
          fd.append("file", file);
          await updateVideoFile(token, editId, fd);
        }
      } else {
        // Create new draft
        const formData = new FormData();
        formData.append("title", name);
        formData.append("difficulty", level);
        formData.append("exercise_family", exerciseFamily);
        formData.append("important_joints", JSON.stringify(structuredJoints)); // Send as JSON string
        formData.append("description", `kcal:${kcal || 0};draft:true`);
        formData.append("approved", "false");
        formData.append("segments", "[]");
        if (file) formData.append("file", file);

        await uploadVideo(token, formData);
      }

      alert("บันทึก draft สำเร็จ!");
      router.push("/trainer");
    } catch (e: any) {
      console.error("Draft error:", e);
      alert("Save draft failed: " + (e.message || "Unknown error"));
    } finally {
      setSubmittingDraft(false);
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!file || !name) {
      alert("กรุณาเลือกไฟล์และกรอกชื่อวิดีโอ");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No authentication token found");
      return;
    }

    setSubmitting(true);

    try {
      // Construct payload with Schema: { jointName: string, weight: number }[]
      const structuredJoints = selectedJoints.map(j => ({
        jointName: j,
        weight: 1.0
      }));

      const formData = new FormData();
      formData.append("title", name);
      formData.append("difficulty", level);
      formData.append("exercise_family", exerciseFamily);
      formData.append("important_joints", JSON.stringify(structuredJoints));
      formData.append("description", `kcal:${kcal || 0};verifying:true`); // REMOVED redundant legacy fields
      formData.append("approved", "false");
      formData.append("segments", "[]");
      formData.append("file", file);

      await uploadVideo(token, formData);

      alert("กำลังตรวจสอบ (verifying)... คลิปจะเข้าสู่สถานะ Pending");
      router.push("/trainer");
    } catch (e: any) {
      console.error("Upload error:", e);
      alert("Upload failed: " + (e.message || "Unknown error"));
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name) {
      alert("กรุณากรอกชื่อวิดีโอ");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      alert("No authentication token found");
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    try {
      // Construct payload with Schema: { jointName: string, weight: number }[]
      const structuredJoints = selectedJoints.map(j => ({
        jointName: j,
        weight: 1.0
      }));

      // 1) Update metadata using FormData
      const formData = new FormData();
      formData.append("title", name);
      formData.append("difficulty", level);
      formData.append("exercise_family", exerciseFamily);
      formData.append("important_joints", JSON.stringify(structuredJoints));
      formData.append("description", `kcal:${kcal};verifying:true`);

      console.log("DEBUG: handleUpdate FormData Payload");
      await updateVideoFormData(token, editId!, formData);

      // 2) If file new -> update file
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        await updateVideoFile(token, editId!, fd);
      }

      // 3) Resubmit if rejected
      if (originalVideo?.rejected) {
        await resubmitVideo(token, editId!);
        alert('อัปเดตและส่งให้แอดมินตรวจสอบอีกครั้งแล้ว (กลับสู่คิว Verifying/Pending)');
      } else {
        alert('อัปเดตเรียบร้อย');
      }
      router.push('/trainer');

    } catch (e: any) {
      console.error("Update error:", e);
      alert("Update failed: " + (e.message || e));
    } finally {
      setSubmitting(false);
    }
  }

  const handleDiscard = () => {
    if (window.confirm('Discard changes and go back to Trainer page?')) router.push('/trainer');
  };

  const levelOptions = [
    { value: "1", label: "Level 1" },
    { value: "2", label: "Level 2" },
    { value: "3", label: "Level 3" },
  ];
  const levelRef = useRef<HTMLDivElement>(null);
  const exerciseFamilyRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (levelRef.current && !levelRef.current.contains(e.target as Node)) {
        setLevelOpen(false);
      }
      if (exerciseFamilyRef.current && !exerciseFamilyRef.current.contains(e.target as Node)) {
        setExerciseFamilyOpen(false);
      }
    }
    if (levelOpen || exerciseFamilyOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [levelOpen, exerciseFamilyOpen]);

  // Header User logic
  const [user, setUser] = useState<{ name: string, picture?: string } | undefined>(undefined);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const userObj = JSON.parse(userData);
        setUser({
          name: userObj.name,
          picture: userObj.picture
        });
      }
    } catch { }
  }, []);

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>
      <div
        className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] font-sans relative"
        style={{ fontFamily: '"Google Sans Flex", Arial, sans-serif' }}
      >
        {(isLoading || submitting || submittingDraft) && (
          <div className="fixed inset-0 w-screen h-screen bg-black/35 z-[9999] flex items-center justify-center">
            <div className="bg-white px-12 py-8 rounded-2xl shadow-2xl flex flex-col items-center">
              <div className="text-[22px] font-bold text-purple-500 mb-3">
                Processing Keypoints...
              </div>
              <div className="text-[15px] text-gray-700 mb-2">
                Please wait while keypoints are being extracted and saved.
              </div>
              <div className="mt-2">
                <svg className="animate-spin" width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="#a855f7" strokeWidth="6" strokeDasharray="100" strokeDashoffset="60" />
                </svg>
              </div>
            </div>
          </div>
        )}
        <DashboardHeader role="trainer" user={user} />
        <div className="max-w-[1200px] mx-auto mt-3 mb-2 flex items-center">
          <button
            onClick={() => router.push("/trainer")}
            className="flex items-center gap-2 bg-transparent text-gray-900 font-semibold border-none rounded-full px-2 py-1 text-[1.15rem] hover:bg-gray-100 transition cursor-pointer"
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" stroke="#a855f7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[1.18rem] font-semibold" style={{ background: "linear-gradient(90deg,#a855f7 0%, #ff4d8b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Back
            </span>
          </button>
        </div>
        <div className="max-w-[1200px] mx-auto px-4 pb-10">
          <div className="bg-white rounded-2xl shadow-md p-6 mt-2">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="border-2 border-dashed border-gray-300 rounded-2xl py-9 px-5 text-center text-gray-500 bg-[#f8fafc]"
            >
              <div className="text-lg font-bold text-gray-900 mb-1">
                {isEdit ? "Replace video (optional)" : "Select video to upload"}
              </div>
              <div className="mb-4">Or drag and drop it here</div>
              <button
                onClick={onPick}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold border-none rounded-lg px-5 py-2.5 cursor-pointer"
              >
                Select video
              </button>
              <input ref={fileRef} type="file" accept="video/*" onChange={onFileChange} style={{ display: "none" }} />
              {file && (
                <div className="mt-3 text-gray-700">
                  Selected: <b>{file.name}</b> ({Math.round(file.size / 1024 / 1024)} MB)
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            {[
              { title: "Size and duration", desc: "Maximum size: 30 GB, video duration: 60 minutes" },
              { title: "File formats", desc: "Recommended: .mp4 (others supported)" },
              { title: "Video resolutions", desc: "Better: 1080p/1440p/4K" },
              { title: "Aspect ratios", desc: "Recommended: 16:9" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-md p-3.5">
                <div className="font-bold text-gray-900 mb-1.5">{item.title}</div>
                <div className="text-[13px] text-gray-500 leading-tight">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1.1fr_1fr] gap-5 mt-6">
            <div className="bg-white rounded-2xl shadow-md p-5">
              <div className="flex justify-between items-center">
                <div className="text-xl font-extrabold text-gray-900">
                  {isEdit ? "Edit details" : "Details"}
                </div>
                <button
                  onClick={() => setPreview((p) => !p)}
                  className="border border-gray-200 bg-white text-purple-500 rounded-full px-3.5 py-2 font-bold cursor-pointer"
                >
                  Preview
                </button>
              </div>
              <div className="mt-4">
                <label className="block font-bold mb-1.5">Name *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Pushups – Beginner Form"
                  className="w-[97%] px-4 py-2.5 rounded-xl border-2 border-gray-300 outline-none"
                />
              </div>

              {/* Exercise Family Dropdown */}
              <div className="mt-3.5">
                <label className="block font-bold mb-1.5">Exercise Family</label>
                <div ref={exerciseFamilyRef} className="relative w-[97%]">
                  <button
                    type="button"
                    className="w-full flex justify-between items-center px-4 py-2.5 rounded-xl border-2 border-gray-300 bg-gray-50 shadow transition-all focus:outline-none"
                    onClick={() => setExerciseFamilyOpen(!exerciseFamilyOpen)}
                  >
                    <span className={exerciseFamily ? "text-gray-900" : "text-gray-400"}>
                      {exerciseFamily || "Select Exercise Family"}
                    </span>
                    <svg className="ml-2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {exerciseFamilyOpen && (
                    <div className="absolute left-0 top-full mt-2 w-full max-h-60 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-20">
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-500 italic block border-b border-gray-50"
                        onClick={() => {
                          setExerciseFamily("");
                          setExerciseFamilyOpen(false);
                        }}
                      >
                        None
                      </button>
                      {exerciseNames.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          className={`w-full text-left px-4 py-2 hover:bg-violet-50 hover:text-violet-700 transition-colors block ${exerciseFamily === ex ? "bg-violet-50 text-violet-700 font-semibold" : ""}`}
                          onClick={() => {
                            setExerciseFamily(ex);
                            setExerciseFamilyOpen(false);
                          }}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3.5 flex items-end gap-4">
                <div>
                  <label className="block font-bold mb-1.5">Kcalories *</label>
                  <input
                    type="number"
                    min="0"
                    value={kcal}
                    onChange={(e) => setKcal(e.target.value)}
                    placeholder="e.g., 60"
                    className="w-36 px-4 py-2.5 rounded-xl border-2 border-gray-300 outline-none"
                  />
                </div>
                <div ref={levelRef} className="relative w-36">
                  <label className="block font-bold mb-1.5">Level</label>
                  <button
                    type="button"
                    className="w-full flex justify-between items-center px-4 py-2.5 rounded-xl border-2 border-gray-300 bg-gray-50 shadow transition-all focus:outline-none"
                    onClick={() => setLevelOpen((o) => !o)}
                  >
                    {levelOptions.find(o => o.value === level)?.label}
                    <svg className="ml-2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {levelOpen && (
                    <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-10">
                      {levelOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`w-full text-left px-4 py-2 rounded-xl hover:bg-gray-100 ${level === opt.value ? "bg-gray-100 font-semibold" : ""
                            }`}
                          onClick={() => {
                            setLevel(opt.value);
                            setLevelOpen(false);
                          }}
                        >
                          {opt.label}
                          {level === opt.value && (
                            <svg className="inline-block float-right mt-1 text-purple-500" width="18" height="18" viewBox="0 0 20 20" fill="none">
                              <path d="M5 10l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <JointSelector selectedJoints={selectedJoints} onChange={setSelectedJoints} />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    const status = isEdit && !originalVideo?.approved ? 'verifying' : 'active';
                    if (window.confirm(isEdit ? "Update and submit?" : "ต้องรอ admin อนุมัติคลิปก่อนจึงจะเป็น Active\nกดยืนยันเพื่อส่งคลิปเข้าสู่สถานะ Pending")) {
                      isEdit ? handleUpdate() : handleCreate();
                    }
                  }}
                  disabled={submitting}
                  className={`bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold border-none rounded-lg px-4 py-2 cursor-pointer inline-flex items-center gap-2 ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {submitting ? (isEdit ? "Updating..." : "Uploading...") : (isEdit ? "Public" : "Public")}
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={submittingDraft}
                  className={`bg-gray-200 text-gray-900 font-bold border-none rounded-lg px-4 py-2 cursor-pointer ${submittingDraft ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {submittingDraft ? "Saving..." : "Save draft"}
                </button>
                <button
                  onClick={handleDiscard}
                  disabled={submitting}
                  className="bg-white text-gray-500 font-bold border border-gray-200 rounded-lg px-4 py-2 cursor-pointer"
                >
                  Discard
                </button>
              </div>
              {originalVideo?.rejected && (
                <div className="mt-3 p-3.5 rounded-lg bg-red-200 text-red-800 text-[14px] leading-tight font-medium">
                  <div className="font-bold mb-1">วิดีโอนี้ถูก Reject</div>
                  {originalVideo.reject_reason && <div className="mb-1.5">เหตุผล: {originalVideo.reject_reason}</div>}
                  <div>แก้ไขรายละเอียดหรืออัปโหลดไฟล์ใหม่ได้ แล้วกด Update เพื่อส่งให้แอดมินตรวจสอบอีกครั้ง</div>
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-md p-4 min-h-[300px] flex items-center justify-center relative overflow-hidden">
              {!fileURL || !preview ? (
                <div className="w-full h-80 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
                  {preview ? "No video selected" : "Preview area"}
                </div>
              ) : (
                <div className="relative w-full h-full max-h-80 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={fileURL}
                    controls
                    autoPlay
                    muted
                    loop
                    crossOrigin={fileURL.startsWith("blob:") ? "anonymous" : undefined}
                    className="w-full h-full max-h-80 object-contain rounded-xl bg-white block"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                  {fileURL.startsWith("blob:") && (
                    <KeypointOverlay
                      videoRef={videoRef}
                      isPlaying={isPlaying}
                      mirrorKeypoints={false}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div >
    </>
  );
}

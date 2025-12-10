"use client";
import React, { useRef, useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function UploadVideoPage() {
  const [submittingDraft, setSubmittingDraft] = useState(false);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileURL, setFileURL] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState("1");
  const [kcal, setKcal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(true);
  const [originalVideo, setOriginalVideo] = useState<any>(null);
  const [levelOpen, setLevelOpen] = useState(false);

  // Simulate edit mode (replace with your logic)
  const isEdit = false;

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
    if (!file || !name) {
      alert("กรุณาเลือกไฟล์และกรอกชื่อวิดีโอ");
      return;
    }
    setSubmittingDraft(true);
    setIsLoading(true);
    setTimeout(() => {
      setSubmittingDraft(false);
      setIsLoading(false);
      alert("บันทึก draft สำเร็จ! ");
      router.push("/dashboard");
    }, 1500);
  };

  const handleCreate = async () => {
    if (!file || !name) {
      alert("กรุณาเลือกไฟล์และกรอกชื่อวิดีโอ");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      alert("กำลังตรวจสอบ (verifying)... คลิปจะเข้าสู่สถานะ Pending");
      router.push("/dashboard");
    }, 1500);
  };

  const handleDiscard = () => {
    if (window.confirm('Discard changes and go back to Trainer page?')) router.push('/dashboard');
  };

  const levelOptions = [
    { value: "1", label: "Level 1" },
    { value: "2", label: "Level 2" },
    { value: "3", label: "Level 3" },
  ];
  const levelRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (levelRef.current && !levelRef.current.contains(e.target as Node)) {
        setLevelOpen(false);
      }
    }
    if (levelOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [levelOpen]);

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>
      <div
        className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] font-sans relative"
        style={{ fontFamily: '"Google Sans Flex", Arial, sans-serif' }}
      >
        {isLoading && (
          <div className="fixed inset-0 w-screen h-screen bg-black/35 z-[9999] flex items-center justify-center">
            <div className="bg-white px-12 py-8 rounded-2xl shadow-2xl flex flex-col items-center">
              <div className="text-[22px] font-bold text-purple-500 mb-3">
                Processing Keypoints...
              </div>
              <div className="text-[15px] text-gray-700 mb-2">
                Please wait while keypoints are being extracted and saved.
              </div>
              <div className="mt-2">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="#a855f7" strokeWidth="6" strokeDasharray="100" strokeDashoffset="60" />
                </svg>
              </div>
            </div>
          </div>
        )}
        <DashboardHeader role="trainer" />
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
                          className={`w-full text-left px-4 py-2 rounded-xl hover:bg-gray-100 ${
                            level === opt.value ? "bg-gray-100 font-semibold" : ""
                          }`}
                          onClick={() => {
                            setLevel(opt.value);
                            setLevelOpen(false);
                          }}
                        >
                          {opt.label}
                          {level === opt.value && (
                            <svg className="inline-block float-right mt-1 text-purple-500" width="18" height="18" viewBox="0 0 20 20" fill="none">
                              <path d="M5 10l4 4 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                {isEdit ? (
                  <button
                    onClick={handleCreate}
                    disabled={submitting}
                    className={`bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold border-none rounded-lg px-4 py-2 cursor-pointer ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {submitting ? "Updating..." : "Update"}
                  </button>
                ) : (
                  <button
                    onClick={handleCreate}
                    disabled={submitting}
                    className={`bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold border-none rounded-lg px-4 py-2 cursor-pointer inline-flex items-center gap-2 ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {submitting ? "Uploading..." : "Public"}
                  </button>
                )}
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
            <div className="bg-white rounded-2xl shadow-md p-4 min-h-[300px] flex items-center justify-center">
              {!fileURL || !preview ? (
                <div className="w-full h-80 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
                  {preview ? "No video selected" : "Preview area"}
                </div>
              ) : (
                <video
                  src={fileURL}
                  controls
                  className="w-full h-full max-h-80 object-contain rounded-xl bg-white block"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

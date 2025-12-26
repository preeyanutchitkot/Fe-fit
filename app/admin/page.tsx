"use client";

import Link from "next/link";
import React from "react";
import AdminShell from "@/app/admin/components/AdminShell";

export default function AdminHomePage() {
  return (
    <AdminShell
      active="dashboard"
      title={
        <>
          Admin <span>Dashboard</span>
        </>
      }
      subtitle="เลือกเมนูที่ต้องการจัดการผู้ใช้ และตรวจสอบวิดีโอ"
    >
      <div className="hero-buttons" style={{ justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/admin/users" className="fitaddict-btn" style={{ textDecoration: "none" }}>
          Users
        </Link>
        <Link href="/admin/videos" className="fitaddict-btn" style={{ textDecoration: "none" }}>
          Videos
        </Link>
      </div>
    </AdminShell>
  );
}

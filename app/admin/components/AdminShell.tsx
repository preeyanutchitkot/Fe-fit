"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ActiveTab = "dashboard" | "users" | "videos";

export default function AdminShell({
  active,
  title,
  subtitle,
  children,
}: {
  active: ActiveTab;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
    if (!token) router.replace("/admin/login");
  }, [router]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    router.replace("/admin/login");
  };

  return (
    <div className="fitaddict-bg">
      <header className="fitaddict-navbar">
        <div className="fitaddict-logo">FitAddict</div>
        <nav>
          <ul className="fitaddict-navlinks">
            <li>
              <Link className={active === "dashboard" ? "active" : ""} href="/admin">
                Dashboard
              </Link>
            </li>
            <li>
              <Link className={active === "users" ? "active" : ""} href="/admin/users">
                Users
              </Link>
            </li>
            <li>
              <Link className={active === "videos" ? "active" : ""} href="/admin/videos">
                Videos
              </Link>
            </li>
          </ul>
        </nav>
        <button onClick={logout} className="fitaddict-btn">
          Logout
        </button>
      </header>

      <main className="fitaddict-main">
        <section className="fitaddict-hero">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
          {children}
        </section>
      </main>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export default function AdminLogin() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "Login failed");
      }

      // รองรับชื่อ field token หลายแบบ เผื่อ backend ส่ง access_token
      const token = data?.token || data?.access_token;
      if (!token) throw new Error("Missing token in response");

      localStorage.setItem("admin_token", token);
      router.replace("/admin");
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fitaddict-bg">
      <nav className="fitaddict-navbar">
        <div className="fitaddict-logo">FitAddict</div>
        <ul className="fitaddict-navlinks">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/login">Sign In</Link>
          </li>
        </ul>
      </nav>

      <main className="fitaddict-main">
        <section className="fitaddict-hero">
          <h1>
            Admin <span>Login</span>
          </h1>
          <p>Sign in to manage users and videos</p>

          {error ? <div className="au-alert">{error}</div> : null}

          <form onSubmit={handleSubmit} style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ display: "grid", gap: "0.65rem", textAlign: "left" }}>
              <label style={{ fontWeight: 800, color: "#64748b" }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="au-input"
                placeholder="admin"
              />

              <label style={{ fontWeight: 800, color: "#64748b", marginTop: "0.35rem" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="au-input"
                placeholder="••••••••"
              />

              <button type="submit" disabled={loading} className="fitaddict-btn" style={{ width: "100%" }}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
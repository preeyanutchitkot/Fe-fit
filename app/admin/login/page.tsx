"use client";
import React, { useState } from "react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // --- เชื่อมต่อ backend ---
    /*
    try {
      const res = await fetch("http://localhost:8000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("admin_token", data.token);
        window.location.href = "/admin";
      } else {
        setError(data.detail || "Login failed");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
    */
    // --- END เชื่อมต่อ backend ---
    setTimeout(() => {
      setLoading(false);
      setError("(Demo only) Backend not connected.");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center relative border border-indigo-100">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-md">
          <img src="/Logo_FitAddicttest.png" alt="FitAddict Logo" className="w-12 h-12 object-contain rounded-xl" />
        </div>
        <h2 className="text-center font-extrabold text-2xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-purple-500 bg-clip-text text-transparent mt-10 mb-8 tracking-wide">Admin Login</h2>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-6 flex flex-col gap-1">
            <label className="font-bold text-indigo-500 text-base mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-lg border border-indigo-300 text-base bg-indigo-50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="mb-6 flex flex-col gap-1">
            <label className="font-bold text-indigo-500 text-base mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full h-12 px-4 rounded-lg border border-indigo-300 text-base bg-indigo-50 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {error && (
            <div className="text-red-500 font-semibold text-center mb-4 text-sm">{typeof error === "string" ? error : (error.message || "เกิดข้อผิดพลาด")}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white font-extrabold text-lg shadow-md transition hover:scale-[1.02] active:scale-100 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

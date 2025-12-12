"use client";
import React, { useState } from "react";
import GoogleAuthButton from '@/Auth/GoogleAuthButton';
import { loginWithGoogle } from "@/api/login";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Google login handler เชื่อมหลังบ้าน
  // Google OAuth handler
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError("");
    try {
      const token = credentialResponse.credential;
      const { response, data } = await loginWithGoogle(token);

      if (!response.ok) {
        setError(data.detail || "เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      const role = data.user.role;
      if (role === "admin") {
        window.location.href = "/admin";
      } else if (role === "trainer") {
        window.location.href = "/trainer";
      } else if (role === "trainee") {
        window.location.href = "/trainee";
      } else {
        window.location.href = "/"; // Fallback
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google login error");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
        <img
          src="/Logo_FitAddicttest.png"
          alt="FitAddict Logo"
          className="w-16 h-16 object-contain mb-6 rounded-xl shadow-md"
        />
        <h2 className="font-bold text-2xl text-gray-800 mb-2">Sign In</h2>
        <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
          Sign in with your Google account to access FitAddict’s powerful features
        </p>
        {/* ...existing code... */}
        <div className="w-full mb-4">
          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
          />
        </div>
        {/* ...existing code... */}
        <div className="flex items-center w-full my-4">
          <span className="flex-1 h-px bg-gray-200" />
          <span className="mx-3 text-xs text-gray-400">Secure & Fast</span>
          <span className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
          <img src="/Vector.png" alt="secure" className="w-4 h-4" />
          <span>Secure authentication powered by Google</span>
        </div>
        {error && (
          <div className="w-full text-center text-red-500 text-sm mt-2">{error}</div>
        )}
      </div>
    </div>
  );
}

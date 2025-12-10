"use client";
import React, { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Dummy Google login handler for demo
  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Success: redirect or show message
    }, 1200);
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
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-indigo-600 font-semibold text-base shadow-sm transition disabled:opacity-60 mb-4"
        >
          <img src="/googlelogo.png" alt="Google" className="w-5 h-5" />
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </button>
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

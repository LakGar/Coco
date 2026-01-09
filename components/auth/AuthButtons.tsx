"use client";
import { useState } from "react";
import { signInWithGoogle, signInWithApple } from "@/utils/supabase/auth";

export default function AuthButtons() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading("google");
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign in error:", error);
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading("apple");
      await signInWithApple();
    } catch (error) {
      console.error("Apple sign in error:", error);
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleGoogleSignIn}
        disabled={loading !== null}
        className="flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === "google" ? (
          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continue with Google
      </button>

      <button
        onClick={handleAppleSignIn}
        disabled={loading !== null}
        className="flex items-center justify-center gap-3 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading === "apple" ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.16c-.15-2.05.91-3.83 2.42-5.03 1.52-1.21 3.55-1.85 5.44-1.64-.46 2.94-2.07 5.25-4.39 6.66-1.88-1.15-3.24-2.98-3.47-4.99z" />
          </svg>
        )}
        Continue with Apple
      </button>
    </div>
  );
}


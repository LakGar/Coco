"use client";
import { AuthComponent } from "@/components/ui/sign-up";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// A simple placeholder logo for demonstration
const CustomLogo = () => (
  <div className="bg-blue-500 text-white rounded-md p-1.5">
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  </div>
);

export default function CustomAuthDemo() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");
    if (errorParam) {
      setError(errorParam);
    }
    if (messageParam) {
      setMessage(decodeURIComponent(messageParam));
    }
  }, [searchParams]);

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg">
            <p className="font-semibold">Verification Error</p>
            <p className="text-sm mt-1">
              {message || "The verification link has expired or is invalid."}
            </p>
            <p className="text-xs mt-2">
              Please request a new verification code.
            </p>
          </div>
        </div>
      )}
      <AuthComponent logo={<CustomLogo />} brandName="COCO" />
    </div>
  );
}

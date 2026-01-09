"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUserDisplayName, uploadUserAvatar } from "@/app/actions/onboarding";
import { AvatarUpload } from "@/components/onboarding/avatar-upload";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDisplayNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await updateUserDisplayName(displayName);
      if (result.success) {
        setStep(3); // Move to avatar step
      } else {
        setError(result.error || "Failed to save display name");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // If avatar is selected, upload it
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);
        const result = await uploadUserAvatar(formData);
        if (!result.success) {
          setError(result.error || "Failed to upload avatar");
          setLoading(false);
          return;
        }
      }
      // Move to completion step
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="space-y-8">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <h1 className="text-3xl font-light text-gray-900">
                Welcome to COCO
              </h1>
              <p className="text-gray-600">
                Let's get you set up. This will only take a minute.
              </p>
              <button
                onClick={() => setStep(2)}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Display Name */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-light text-gray-900">
                  What should we call you?
                </h1>
                <p className="text-gray-600">
                  This is how your name will appear in the app.
                </p>
              </div>

              <form onSubmit={handleDisplayNameSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                    required
                    minLength={1}
                    maxLength={100}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !displayName.trim()}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? "Saving..." : "Continue"}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Avatar Upload */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-light text-gray-900">
                  Add a profile picture
                </h1>
                <p className="text-gray-600">
                  Upload a photo to personalize your profile. This is optional.
                </p>
              </div>

              <form onSubmit={handleAvatarSubmit} className="space-y-6">
                <div className="flex justify-center">
                  <AvatarUpload
                    onAvatarSelected={setAvatarFile}
                    initialAvatarUrl={null}
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? "Saving..." : "Continue"}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-light text-gray-900">
                  You're all set!
                </h1>
                <p className="text-gray-600">
                  Welcome to COCO. You can start using the app now.
                </p>
              </div>
              <button
                onClick={handleComplete}
                className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


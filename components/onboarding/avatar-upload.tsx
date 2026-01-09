"use client";

import { useState, useRef } from "react";
import { Upload, X, User } from "lucide-react";
import Image from "next/image";

interface AvatarUploadProps {
  onAvatarSelected: (file: File | null) => void;
  initialAvatarUrl?: string | null;
}

export function AvatarUpload({
  onAvatarSelected,
  initialAvatarUrl,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(
    initialAvatarUrl || null
  );
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      alert("Please select a JPEG, PNG, or WebP image");
      return;
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    onAvatarSelected(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    onAvatarSelected(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {preview ? (
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg">
            <Image
              src={preview}
              alt="Avatar preview"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
              aria-label="Remove avatar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleClick}
            className="w-32 h-32 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
          >
            <User className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        {!preview && (
          <button
            type="button"
            onClick={handleClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Photo
          </button>
        )}
        {preview && (
          <button
            type="button"
            onClick={handleClick}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Change Photo
          </button>
        )}
        <p className="text-xs text-gray-500 text-center max-w-xs">
          JPEG, PNG, or WebP. Max 5MB
        </p>
      </div>
    </div>
  );
}


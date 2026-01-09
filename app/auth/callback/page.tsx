"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're in an embedded context (iframe, Gmail in-app browser, etc.)
    const checkEmbedded = () => {
      try {
        // Check if we're in an iframe
        if (window.self !== window.top) {
          return true;
        }
        // Check for Gmail's in-app browser indicators
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes("wv") || userAgent.includes("webview")) {
          return true;
        }
        return false;
      } catch (e) {
        // If we can't access window.top, we're likely in an iframe
        return true;
      }
    };

    const embedded = checkEmbedded();
    setIsEmbedded(embedded);

    // If not embedded, try to exchange the code client-side first
    // This handles cases where PKCE verifier might be missing
    if (!embedded) {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      const next = searchParams.get("next");

      // If we have a code, try to exchange it client-side
      if (code && !error) {
        // Import Supabase client dynamically
        import("@/utils/supabase/auth").then(({ verifyEmailCode }) => {
          // Extract email from URL or try to get from session
          // For magic links, we need to handle this differently
          // Redirect to route handler which can handle server-side
          const callbackUrl = new URL("/auth/callback", window.location.origin);
          callbackUrl.searchParams.set("code", code);
          if (next) callbackUrl.searchParams.set("next", next);
          window.location.href = callbackUrl.toString();
        }).catch(() => {
          // Fallback: redirect to route handler
          const callbackUrl = new URL("/auth/callback", window.location.origin);
          if (code) callbackUrl.searchParams.set("code", code);
          if (error) callbackUrl.searchParams.set("error", error);
          if (errorDescription) callbackUrl.searchParams.set("error_description", errorDescription);
          if (next) callbackUrl.searchParams.set("next", next);
          window.location.href = callbackUrl.toString();
        });
      } else {
        // Build the callback URL
        const callbackUrl = new URL("/auth/callback", window.location.origin);
        if (code) callbackUrl.searchParams.set("code", code);
        if (error) callbackUrl.searchParams.set("error", error);
        if (errorDescription) callbackUrl.searchParams.set("error_description", errorDescription);
        if (next) callbackUrl.searchParams.set("next", next);

        // Redirect to the route handler
        window.location.href = callbackUrl.toString();
      }
    }
  }, [searchParams]);

  const handleOpenInNewWindow = () => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    const next = searchParams.get("next");

    // Build the callback URL
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (code) callbackUrl.searchParams.set("code", code);
    if (error) callbackUrl.searchParams.set("error", error);
    if (errorDescription) callbackUrl.searchParams.set("error_description", errorDescription);
    if (next) callbackUrl.searchParams.set("next", next);

    // Try to open in new window
    window.open(callbackUrl.toString(), "_blank");
  };

  if (!isEmbedded) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Completing verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Open in Browser</h1>
          <p className="text-sm text-muted-foreground">
            This link needs to open in your default browser to complete verification.
            Gmail's in-app browser doesn't support this authentication flow.
          </p>
        </div>

        <div className="space-y-4">
          <Button onClick={handleOpenInNewWindow} className="w-full" size="lg">
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Window
          </Button>

          <div className="text-left space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Alternative:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Copy the link from your email</li>
              <li>Open your default browser</li>
              <li>Paste and open the link there</li>
            </ol>
          </div>

          <div className="text-left space-y-2 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Or disable Gmail's in-app browser:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open Gmail app settings</li>
              <li>Go to your account settings</li>
              <li>Uncheck "Open web links in Gmail"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}


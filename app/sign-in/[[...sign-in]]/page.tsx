"use client";

import React, { useRef, useId, useEffect, CSSProperties } from "react";
import {
  animate,
  useMotionValue,
  AnimationPlaybackControls,
  motion,
} from "framer-motion";
import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

// Type definitions
interface ResponsiveImage {
  src: string;
  alt?: string;
  srcSet?: string;
}

interface AnimationConfig {
  preview?: boolean;
  scale: number;
  speed: number;
}

interface NoiseConfig {
  opacity: number;
  scale: number;
}

interface ShadowOverlayProps {
  type?: "preset" | "custom";
  presetIndex?: number;
  customImage?: ResponsiveImage;
  sizing?: "fill" | "stretch";
  color?: string;
  animation?: AnimationConfig;
  noise?: NoiseConfig;
  style?: CSSProperties;
  className?: string;
}

function mapRange(
  value: number,
  fromLow: number,
  fromHigh: number,
  toLow: number,
  toHigh: number
): number {
  if (fromLow === fromHigh) {
    return toLow;
  }
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

const useInstanceId = (): string => {
  const id = useId();
  const cleanId = id.replace(/:/g, "");
  const instanceId = `shadowoverlay-${cleanId}`;
  return instanceId;
};

export default function SignInPage({
  sizing = "fill",
  color = "rgba(101, 67, 33, 1)",
  animation = { scale: 100, speed: 90 },
  noise = { opacity: 0.1, scale: 1.2 },
  style,
  className,
}: ShadowOverlayProps) {
  const id = useInstanceId();
  const animationEnabled = animation && animation.scale > 0;
  const feColorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
  const hueRotateMotionValue = useMotionValue(180);
  const hueRotateAnimation = useRef<AnimationPlaybackControls | null>(null);

  const displacementScale = animation
    ? mapRange(animation.scale, 1, 100, 20, 100)
    : 0;
  const animationDuration = animation
    ? mapRange(animation.speed, 1, 100, 1000, 50)
    : 1;

  useEffect(() => {
    if (feColorMatrixRef.current && animationEnabled) {
      if (hueRotateAnimation.current) {
        hueRotateAnimation.current.stop();
      }
      hueRotateMotionValue.set(0);
      hueRotateAnimation.current = animate(hueRotateMotionValue, 360, {
        duration: animationDuration / 25,
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 0,
        ease: "linear",
        delay: 0,
        onUpdate: (value: number) => {
          if (feColorMatrixRef.current) {
            feColorMatrixRef.current.setAttribute("values", String(value));
          }
        },
      });

      return () => {
        if (hueRotateAnimation.current) {
          hueRotateAnimation.current.stop();
        }
      };
    }
  }, [animationEnabled, animationDuration, hueRotateMotionValue]);

  // Hide Clerk branding - only target footer/branding elements
  useEffect(() => {
    const hideClerkBranding = () => {
      // Only target specific Clerk footer/branding selectors
      const selectors = [
        '[data-clerk-element="footer"]',
        '[class*="cl-footer"]',
        '[class*="cl-poweredBy"]',
        '[class*="cl-securedBy"]',
        '[class*="cl-badge"]',
        'footer[class*="cl-"]',
      ];

      selectors.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            (el as HTMLElement).style.display = "none";
          });
        } catch (e) {
          // Ignore selector errors
        }
      });

      // Only search within Clerk components, not all divs
      const clerkRoot =
        document.querySelector('[data-clerk-element="root"]') ||
        document.querySelector('[class*="cl-rootBox"]');

      if (clerkRoot) {
        // Only search within the Clerk component for branding text
        const clerkDivs = clerkRoot.querySelectorAll("div, footer, span");
        clerkDivs.forEach((el) => {
          const text = el.textContent?.trim() || "";
          // Only hide if it's clearly a branding element (small text, footer-like)
          if (
            (text === "Secured by" ||
              text === "Development mode" ||
              text.includes("Powered by Clerk")) &&
            (el.closest('[class*="cl-footer"]') ||
              el.closest("footer") ||
              el.getAttribute("class")?.includes("cl-"))
          ) {
            (el as HTMLElement).style.display = "none";
          }
        });
      }
    };

    // Run after a short delay to let Clerk render, then check periodically
    const timeout = setTimeout(hideClerkBranding, 100);
    const interval = setInterval(hideClerkBranding, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "100vh",
        ...style,
      }}
    >
      {/* Logo in top left */}
      <div
        className="fixed top-6 left-6 z-50"
        style={{ position: "fixed", zIndex: 9999 }}
      >
        <div className="relative w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-sm rounded-full p-1.5">
          <Image
            src="/logo.png"
            alt="COCO Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: -displacementScale,
          filter: animationEnabled ? `url(#${id}) blur(4px)` : "none",
        }}
      >
        {animationEnabled && (
          <svg style={{ position: "absolute" }}>
            <defs>
              <filter id={id}>
                <feTurbulence
                  result="undulation"
                  numOctaves="2"
                  baseFrequency={`${mapRange(
                    animation.scale,
                    0,
                    100,
                    0.001,
                    0.0005
                  )},${mapRange(animation.scale, 0, 100, 0.004, 0.002)}`}
                  seed="0"
                  type="turbulence"
                />
                <feColorMatrix
                  ref={feColorMatrixRef}
                  in="undulation"
                  type="hueRotate"
                  values="180"
                />
                <feColorMatrix
                  in="dist"
                  result="circulation"
                  type="matrix"
                  values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="circulation"
                  scale={displacementScale}
                  result="dist"
                />
                <feDisplacementMap
                  in="dist"
                  in2="undulation"
                  scale={displacementScale}
                  result="output"
                />
              </filter>
            </defs>
          </svg>
        )}
        <div
          style={{
            backgroundColor: color,
            maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
            maskSize: sizing === "stretch" ? "100% 100%" : "cover",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            width: "100%",
            height: "100%",
          }}
        />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 min-h-screen">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-transparent shadow-none",
                headerTitle: "text-white text-2xl font-light",
                headerSubtitle: "text-white/80 text-sm font-light",
                socialButtonsBlockButton:
                  "bg-white/25 text-white border-white/40 hover:bg-white/40 hover:text-white",
                formButtonPrimary:
                  "bg-white/25 text-white hover:bg-white hover:text-black",
                formFieldInput:
                  "bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-white/60",
                formFieldLabel: "text-white/90",
                footerActionLink: "text-white hover:text-white/80",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-white hover:text-white/80",
                formResendCodeLink: "text-white hover:text-white/80",
                otpCodeFieldInput: "bg-white/10 border-white/30 text-white",
                dividerLine: "bg-white/20",
                dividerText: "text-white/60",
                formFieldSuccessText: "text-white/80",
                formFieldErrorText: "text-red-200",
                alertText: "text-white",
                footer: "hidden !important",
                footerPages: "hidden !important",
                socialButtons: "hidden !important",
                footerAction: "hidden !important",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
          />
          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-black/80 text-sm mb-2">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-black hover:text-black/80 underline font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
      {noise && noise.opacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
            backgroundSize: noise.scale * 200,
            backgroundRepeat: "repeat",
            opacity: noise.opacity / 2,
          }}
        />
      )}
    </div>
  );
}

"use client";

import { Button } from "@student-management-system/ui/components/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { SiteLogo } from "@/components/site-logo";

function Hexagon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 115"
      fill="currentColor"
      aria-hidden="true"
    >
      <polygon points="50 0, 100 28.75, 100 86.25, 50 115, 0 86.25, 0 28.75" />
    </svg>
  );
}

export default function Hero() {
  const router = useRouter();
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-br from-background px-4 pb-8 pt-4 sm:px-4 sm:pb-8 sm:pt-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
      {/* Decorative hexagons */}
      <Hexagon className="absolute top-12 right-1/4 h-28 w-28 text-blue-500/10 sm:h-36 sm:w-36 md:h-44 md:w-44" />
      <Hexagon className="absolute top-1/3 left-1/4 h-20 w-20 text-blue-400/[0.12] sm:h-28 sm:w-28" />
      <Hexagon className="absolute right-1/3 bottom-1/3 hidden h-16 w-16 text-blue-500/[0.08] md:block" />
      <Hexagon className="absolute bottom-1/4 left-1/3 h-12 w-12 text-blue-400/[0.12] sm:h-16 sm:w-16" />
      <Hexagon className="absolute top-1/2 left-1/2 hidden h-10 w-10 text-blue-500/[0.06] lg:block" />
      <Hexagon className="absolute bottom-16 right-1/4 h-24 w-24 text-blue-400/[0.10] sm:h-32 sm:w-32" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col">
        {/* Header with Logo */}
        <SiteLogo className="h-8 sm:h-10 md:h-12" priority />

        {/* Main Content */}
        <div className="grid flex-1 grid-cols-1 items-center gap-8 py-6 sm:py-8 lg:grid-cols-2 lg:gap-8 lg:py-0 xl:gap-10">
          {/* Left Section */}
          <div className="flex flex-col space-y-5 text-center sm:space-y-6 lg:space-y-8 lg:text-left">
            {/* Main Heading */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="mx-auto max-w-xl text-balance text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl lg:mx-0 lg:max-w-md lg:text-6xl">
                Shape Your Child's Future
              </h1>
              <div className="mx-auto h-1 w-16 rounded-full bg-primary sm:h-1.5 sm:w-24 lg:mx-0" />
            </div>

            {/* Description */}
            <p className="mx-auto max-w-xl text-pretty text-sm text-muted-foreground sm:text-base md:text-lg lg:mx-0 lg:max-w-lg">
              Our robotics classes are designed to help you discover the
              potential of this exciting field with the guidance of our
              experienced instructors.
            </p>

            {/* Role Selection - visible on lg+ inline with content */}
            <div className="hidden space-y-3 pt-1 lg:block lg:pt-2">
              <p className="text-sm font-semibold text-foreground">
                Select Your Role to Continue
              </p>
              <div className="flex items-start justify-start gap-4">
                <Button
                  onClick={() => router.push("/login?role=parent")}
                  variant="blue"
                  size="md"
                >
                  Parent
                </Button>
                <Button
                  onClick={() => router.push("/login?role=teacher")}
                  variant="white"
                  size="md"
                >
                  Teacher
                </Button>
              </div>
            </div>
          </div>

          {/* Right Section - Hero visual */}
          <div className="flex justify-center lg:justify-end">
            <Image
              src="/hero-image.png"
              alt="Students learning robotics"
              width={634}
              height={569}
              className="h-auto w-full max-w-xs rounded-lg sm:max-w-md md:max-w-lg lg:max-w-none"
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 50vw"
            />
          </div>
        </div>

        {/* Bottom Role Selection - visible on small screens only */}
        <div className="shrink-0 space-y-3 pb-2 text-center sm:pb-4 lg:hidden">
          <p className="text-sm font-semibold text-foreground">
            Select Your Role to Continue
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              className="w-full sm:w-auto"
              onClick={() => router.push("/login?role=parent")}
              variant="blue"
              size="md"
            >
              Parent
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={() => router.push("/login?role=teacher")}
              variant="white"
              size="md"
            >
              Teacher
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@student-management-system/ui/components/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SiteLogo } from "@/components/site-logo";

export default function Hero() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-background sm:px-4 sm:pb-8 sm:pt-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        {/* Header with Logo */}
        <SiteLogo className="h-8 sm:h-10 md:h-12" priority />

        {/* Main Content */}
        <div className="grid flex-1 grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-8 xl:gap-10">
          {/* Left Section */}
          <div className="flex flex-col space-y-6 text-center lg:space-y-8 lg:text-left">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="mx-auto max-w-xl text-balance text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:mx-0 lg:max-w-md lg:text-6xl">
                Shape Your Child's Future
              </h1>
              <div className="mx-auto h-1.5 w-24 rounded-full bg-primary lg:mx-0" />
            </div>

            {/* Description */}
            <p className="mx-auto max-w-xl text-pretty text-base text-muted-foreground sm:text-lg lg:mx-0 lg:max-w-lg">
              Our robotics classes are designed to help you discover the
              potential of this exciting field with the guidance of our
              experienced instructors.
            </p>

            {/* Role Selection */}
            <div className="space-y-3 pt-1 lg:pt-2">
              <p className="text-sm font-semibold text-foreground">
                Select Your Role to Continue
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4 lg:items-start lg:justify-start">
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
              className="h-auto w-full max-w-md rounded-lg sm:max-w-lg lg:max-w-none"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* <div className="grid grid-cols-2 gap-4 h-full"> */}
            {/* Large Image Placeholder */}
            {/* <div className="col-span-2 row-span-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg overflow-hidden border border-primary/20">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Hero Image</p>
                  </div>
                </div>
              </div> */}

            {/* Top Right Placeholder */}
            {/* <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg overflow-hidden border border-primary/20">
                <div className="w-full h-32 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Image 1</p>
                </div>
              </div> */}

            {/* Bottom Right - Stats Box */}
            {/* <div className="space-y-2">
                <div className="bg-primary text-white rounded-lg p-4 text-center">
                  <p className="text-sm font-bold">Otomatics</p>
                </div>
                <div className="bg-primary text-white rounded-lg p-4 text-center">
                  <p className="text-xs font-bold">
                    14+
                    <br />
                    Years Experience
                  </p>
                </div>
                <div className="bg-primary text-white rounded-lg p-4 text-center">
                  <p className="text-sm font-bold">
                    20
                    <br />
                    Our Hiatus
                  </p>
                </div>
              </div> */}
            {/* </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@student-management-system/ui/components/button";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted px-[56] py-[40]">
      {/* Header with Logo */}
      <div className="w-93 h-17.75 relative pt-[40]">
        <Image
          src="/logo.svg"
          alt="Otomatics Logo"
          fill
          className="object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="px-12 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Section */}
          <div className="space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="max-w-md text-5xl md:text-6xl font-bold text-foreground leading-tight">
                Shape Your Child's Future
              </h1>
              <div className="h-1.5 w-24 rounded-full bg-primary" />
            </div>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-lg">
              Our robotics classes are designed to help you discover the
              potential of this exciting field with the guidance of our
              experienced instructors..
            </p>

            {/* Role Selection */}
            <div className="space-y-4 pt-4">
              <p className="text-sm font-semibold text-foreground">
                Select Your Role to Continue
              </p>
              <div className="flex gap-4">
                <Button variant="blue" size={"md"}>
                  Parent
                </Button>
                <Button variant="white" size={"md"}>
                  Teacher
                </Button>
              </div>
            </div>
          </div>

          {/* Right Section - Image Placeholder */}
          <div className="hidden lg:block">
            <Image
              src="/hero-image.png"
              alt="Hero Image"
              width={634}
              height={569}
              className="rounded-lg"
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

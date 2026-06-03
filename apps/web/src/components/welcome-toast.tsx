"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { notify } from "@/utils/notify";

export function WelcomeToast() {
  const searchParams = useSearchParams();
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current) {
      return;
    }
    if (searchParams.get("t") !== "1") {
      return;
    }

    hasShown.current = true;

    notify.success("You've been successfully logged in");

    const url = new URL(window.location.href);
    url.searchParams.delete("t");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [searchParams]);

  return null;
}

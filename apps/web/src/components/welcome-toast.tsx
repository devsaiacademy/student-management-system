"use client";

import { gooeyToast } from "goey-toast";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

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

    gooeyToast.success("Success", {
      showTimestamp: false,
      borderColor: "#E0E0E0",
      borderWidth: 1.5,
      description: "You've been successfully logged in",
      timing: {
        displayDuration: 5000,
      },
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("t");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [searchParams]);

  return null;
}

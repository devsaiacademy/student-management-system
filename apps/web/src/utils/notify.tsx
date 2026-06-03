import { type GoeyToastOptions, gooeyToast } from "goey-toast";
import type { ReactNode } from "react";

// House style for every toast: the header is always the status word
// (Success / Error / Warning) and the caller-supplied message renders as a
// single, centered, full-width line beneath it.
const BASE_OPTIONS: GoeyToastOptions = {
  showTimestamp: false,
};

const SUCCESS_DURATION = 4000;
const ERROR_DURATION = 5000;
const WARNING_DURATION = 4000;

// Overrides a caller may pass; the message owns the description slot, so it is
// intentionally not overridable here.
type NotifyOptions = Omit<GoeyToastOptions, "description">;

function buildOptions(
  message: ReactNode,
  duration: number,
  options?: NotifyOptions
): GoeyToastOptions {
  return {
    ...BASE_OPTIONS,
    timing: { displayDuration: duration },
    ...options,
    description: <div className="w-full text-center">{message}</div>,
  };
}

export const notify = {
  success: (message: ReactNode, options?: NotifyOptions) =>
    gooeyToast.success(
      "Success",
      buildOptions(message, SUCCESS_DURATION, options)
    ),
  error: (message: ReactNode, options?: NotifyOptions) =>
    gooeyToast.error("Error", buildOptions(message, ERROR_DURATION, options)),
  warning: (message: ReactNode, options?: NotifyOptions) =>
    gooeyToast.warning(
      "Warning",
      buildOptions(message, WARNING_DURATION, options)
    ),
};

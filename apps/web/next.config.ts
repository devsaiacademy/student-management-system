import { resolve } from "node:path";

import { config } from "dotenv";
import type { NextConfig } from "next";

// The monorepo keeps a single .env at the repo root. Next only auto-loads
// .env files colocated with the Next app, so we explicitly load the root one
// here — before the config object is evaluated — so that NEXT_PUBLIC_* vars
// are present in process.env at build time for client inlining.
config({ path: resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;

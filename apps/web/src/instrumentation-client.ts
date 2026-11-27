import { init } from "@sentry/nextjs";

import { sentryOptions } from "./sentry.shared";

init(sentryOptions);

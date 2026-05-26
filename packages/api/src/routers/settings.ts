import { db } from "@student-management-system/db";
import { appSettings } from "@student-management-system/db/schema/app-settings";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, protectedProcedure, router } from "../index";
import { SETTINGS_KEYS } from "../lib/settings-keys";

async function readBool(key: string): Promise<boolean> {
  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);
  return row?.value === true;
}

async function writeBool(key: string, value: boolean) {
  await db
    .insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } });
}

export const settingsRouter = router({
  getPartialPaymentsEnabled: protectedProcedure.query(() =>
    readBool(SETTINGS_KEYS.partialPaymentsEnabled)
  ),

  setPartialPaymentsEnabled: adminProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      await writeBool(SETTINGS_KEYS.partialPaymentsEnabled, input.enabled);
      return { enabled: input.enabled };
    }),
});

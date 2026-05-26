// Settings keys are typed once here so router and consumers share one source of truth.
export const SETTINGS_KEYS = {
  partialPaymentsEnabled: "payments.partial.enabled",
} as const;

export type SettingsValue = {
  [SETTINGS_KEYS.partialPaymentsEnabled]: boolean;
};

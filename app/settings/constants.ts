export const SETTINGS_TABS = [
  { label: 'Profile', value: 'profile' },
  { label: 'APIs', value: 'api' },
  { label: 'Stocks', value: 'stocks' },
] as const;

export type SettingsTabValue = (typeof SETTINGS_TABS)[number]['value'];
export type SettingsTabLabel = (typeof SETTINGS_TABS)[number]['label'];

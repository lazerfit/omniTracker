export const SETTINGS_TABS = [
  { label: 'Profile', value: 'profile' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'APIs', value: 'api' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Data', value: 'data' },
] as const;

export type SettingsTabValue = (typeof SETTINGS_TABS)[number]['value'];
export type SettingsTabLabel = (typeof SETTINGS_TABS)[number]['label'];

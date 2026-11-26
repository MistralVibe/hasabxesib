import { create } from 'zustand';
import { Settings } from '@/domain/types';
import { DEFAULT_SETTINGS, getSettings, setSetting } from '@/db/repositories';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => void;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,
  load: () => {
    set({ settings: getSettings(), loaded: true });
  },
  update: (key, value) => {
    setSetting(key, value);
    set({ settings: { ...get().settings, [key]: value } });
  },
}));

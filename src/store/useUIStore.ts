import { create } from 'zustand';

interface UIStore {
    deviceMode: 'none' | 'android' | 'ios';
    setDeviceMode: (mode: 'none' | 'android' | 'ios') => void;
}

export const useUIStore = create<UIStore>((set) => ({
    deviceMode: 'none',
    setDeviceMode: (mode) => set({ deviceMode: mode }),
}));

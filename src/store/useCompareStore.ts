import { create } from 'zustand';
import type { LottieJSON } from '../engine/lottie-schema';

export type CompareViewMode = 'split';

interface CompareState {
    lottieA: LottieJSON | null;
    lottieB: LottieJSON | null;
    fileNameA: string;
    fileNameB: string;

    // UI State
    viewMode: CompareViewMode;

    // Actions
    setLottieA: (lottie: LottieJSON | null, fileName?: string) => void;
    setLottieB: (lottie: LottieJSON | null, fileName?: string) => void;
    setViewMode: (mode: CompareViewMode) => void;
    reset: () => void;
}

export const useCompareStore = create<CompareState>((set) => ({
    lottieA: null,
    lottieB: null,
    fileNameA: 'File A.json',
    fileNameB: 'File B.json',
    viewMode: 'split',

    setLottieA: (lottie, fileName) => set((state) => ({
        lottieA: lottie,
        fileNameA: fileName ?? state.fileNameA
    })),
    setLottieB: (lottie, fileName) => set((state) => ({
        lottieB: lottie,
        fileNameB: fileName ?? state.fileNameB
    })),
    setViewMode: (mode) => set({ viewMode: mode }),
    reset: () => set({
        lottieA: null,
        lottieB: null,
        fileNameA: 'File A.json',
        fileNameB: 'File B.json',
        viewMode: 'split'
    })
}));

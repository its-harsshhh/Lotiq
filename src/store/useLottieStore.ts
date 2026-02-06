import { create } from 'zustand';
import { produce } from 'immer';
import type { LottieJSON } from '../engine/lottie-schema';

interface LottieState {
    lottie: LottieJSON | null;
    fileName: string;
    history: LottieJSON[];
    historyIndex: number;

    // Actions
    loadLottie: (json: LottieJSON, fileName: string) => void;
    updateLottie: (recipe: (draft: LottieJSON) => void, skipHistory?: boolean) => void;
    commit: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
    hasExportedThisSession: boolean;
    markExported: () => void;
}

const MAX_HISTORY = 40;

export const useLottieStore = create<LottieState>((set, get) => ({
    lottie: null,
    fileName: 'animation.json',
    history: [],
    historyIndex: -1,

    loadLottie: (json, fileName) => {
        set({
            lottie: json,
            fileName,
            history: [json],
            historyIndex: 0
        });
    },

    updateLottie: (recipe, skipHistory = false) => {
        set(produce((state: LottieState) => {
            if (!state.lottie) return;

            // Create new state based on recipe
            const nextLottie = produce(state.lottie, recipe);

            // If no change, do nothing
            if (nextLottie === state.lottie) return;

            state.lottie = nextLottie;

            if (!skipHistory) {
                // Slice history if we were in the past
                const newHistory = state.history.slice(0, state.historyIndex + 1);

                // Push new state
                newHistory.push(nextLottie);

                // Cap history length
                if (newHistory.length > MAX_HISTORY) {
                    newHistory.shift();
                }

                state.history = newHistory;
                state.historyIndex = newHistory.length - 1;
            }
        }));
    },

    commit: () => {
        set(produce((state: LottieState) => {
            if (!state.lottie) return;

            // Check if current state is ahead of history
            const currentHistoryItem = state.history[state.historyIndex];
            if (state.lottie !== currentHistoryItem) {
                // Slice history if we were in the past
                const newHistory = state.history.slice(0, state.historyIndex + 1);

                // Push new state
                newHistory.push(state.lottie);

                // Cap history length
                if (newHistory.length > MAX_HISTORY) {
                    newHistory.shift();
                }

                state.history = newHistory;
                state.historyIndex = newHistory.length - 1;
            }
        }));
    },

    undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
            set({
                lottie: history[historyIndex - 1],
                historyIndex: historyIndex - 1
            });
        }
    },

    redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
            set({
                lottie: history[historyIndex + 1],
                historyIndex: historyIndex + 1
            });
        }
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    hasExportedThisSession: false,
    markExported: () => set({ hasExportedThisSession: true }),
}));

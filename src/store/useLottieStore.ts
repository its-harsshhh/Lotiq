import { create } from 'zustand';
import { produce } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import type { LottieJSON } from '../engine/lottie-schema';

export interface Page {
    id: string;
    name: string;
    lottie: LottieJSON | null;
    fileName: string;
    history: LottieJSON[];
    historyIndex: number;
}

interface LottieState {
    // Current Active View (Mapped to Active Page)
    lottie: LottieJSON | null;
    fileName: string;
    history: LottieJSON[];
    historyIndex: number;

    // Multi-Page State
    pages: Page[];
    activePageId: string;

    // Export State
    isExporting: boolean;
    exportProgress: number; // 0 to 1
    exportStatus: string;

    // Social Settings State
    socialSettings: {
        enabled: boolean;
        preset: 'square' | 'portrait' | 'vertical';
        resolution: '720p' | '1080p' | '4k';
        bgColor: string;
        padding: number;
        fps: 24 | 30 | 60;
        format: 'webm' | 'mp4';
    };
    setSocialSettings: (settings: Partial<LottieState['socialSettings']>) => void;
    toggleSocialPreview: () => void;

    // Social Export Modal State
    isSocialModalOpen: boolean;
    setSocialModalOpen: (open: boolean) => void;

    // Device Preview State
    devicePreviewEnabled: boolean;
    toggleDevicePreview: () => void;

    // Actions
    setLottie: (data: LottieJSON | null) => void;
    setFileName: (name: string) => void;

    // Page Actions
    addPage: () => void;
    removePage: (id: string) => void;
    renamePage: (id: string, name: string) => void;
    setActivePage: (id: string) => void;

    // Export Actions
    setIsExporting: (isExporting: boolean) => void;
    setExportProgress: (progress: number) => void;
    setExportStatus: (status: string) => void;

    // Lottie Actions
    renameLottie: (name: string) => void;
    loadLottie: (json: LottieJSON, fileName: string) => void;
    updateLottie: (recipe: (draft: LottieJSON) => void, skipHistory?: boolean) => void;
    commit: () => void;
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    hasExportedThisSession: boolean;
    markExported: () => void;

    // Editor UI State
    isEditorMode: boolean;
    setEditorMode: (active: boolean) => void;
}

const MAX_HISTORY = 40;

const createNewPage = (name: string): Page => ({
    id: uuidv4(),
    name,
    lottie: null,
    fileName: 'animation.json',
    history: [],
    historyIndex: -1
});

export const useLottieStore = create<LottieState>((set, get) => {
    // Initialize with one default page
    const defaultPage = createNewPage('Page 1');

    return {
        // Initial State maps to the default page
        lottie: null,
        fileName: 'animation.json',
        history: [],
        historyIndex: -1,

        // Export State
        isExporting: false,
        exportProgress: 0,
        exportStatus: '',

        // Simple setters
        setLottie: (data) => set({ lottie: data }),
        setFileName: (name) => set({ fileName: name }),

        isEditorMode: false,
        setEditorMode: (active) => set({ isEditorMode: active }),

        pages: [defaultPage],
        activePageId: defaultPage.id,

        // --- Page Actions ---

        addPage: () => {
            set(produce((state: LottieState) => {
                const newPage = createNewPage(`Page ${state.pages.length + 1}`);
                state.pages.push(newPage);

                // Switch to new page
                state.activePageId = newPage.id;
                state.lottie = newPage.lottie;
                state.fileName = newPage.fileName;
                state.history = newPage.history;
                state.historyIndex = newPage.historyIndex;
            }));
        },

        removePage: (id: string) => {
            set(produce((state: LottieState) => {
                if (state.pages.length <= 1) return; // Prevent deleting last page

                const pageIndex = state.pages.findIndex(p => p.id === id);
                if (pageIndex === -1) return;

                state.pages.splice(pageIndex, 1);

                // If we deleted the active page, switch to another
                if (state.activePageId === id) {
                    const newActiveIndex = Math.max(0, pageIndex - 1);
                    const newActivePage = state.pages[newActiveIndex];

                    state.activePageId = newActivePage.id;
                    state.lottie = newActivePage.lottie;
                    state.fileName = newActivePage.fileName;
                    state.history = newActivePage.history;
                    state.historyIndex = newActivePage.historyIndex;
                }
            }));
        },

        renamePage: (id: string, name: string) => {
            set(produce((state: LottieState) => {
                const page = state.pages.find(p => p.id === id);
                if (page) {
                    page.name = name;
                }
            }));
        },

        setActivePage: (id: string) => {
            set(produce((state: LottieState) => {
                const page = state.pages.find(p => p.id === id);
                if (page) {
                    state.activePageId = page.id;
                    state.lottie = page.lottie;
                    state.fileName = page.fileName;
                    state.history = page.history;
                    state.historyIndex = page.historyIndex;
                }
            }));
        },

        // --- Lottie Actions (Synced to Active Page) ---

        renameLottie: (name: string) => {
            set(produce((state: LottieState) => {
                state.fileName = name;
                const page = state.pages.find(p => p.id === state.activePageId);
                if (page) {
                    page.fileName = name;
                }
            }));
        },

        loadLottie: (json, fileName) => {
            set(produce((state: LottieState) => {
                // Update Workspace
                state.lottie = json;
                state.fileName = fileName;
                state.fileName = fileName;
                state.history = [json];
                state.historyIndex = 0;

                state.isEditorMode = true; // Switch to editor view if not already

                // Sync to Active Page
                const page = state.pages.find(p => p.id === state.activePageId);
                if (page) {
                    page.lottie = json;
                    page.fileName = fileName;
                    page.history = [json];
                    page.historyIndex = 0;
                }
            }));
        },

        updateLottie: (recipe, skipHistory = false) => {
            set(produce((state: LottieState) => {
                if (!state.lottie) return;

                const nextLottie = produce(state.lottie, recipe);
                if (nextLottie === state.lottie) return;

                // Update Workspace
                state.lottie = nextLottie;
                state.hasExportedThisSession = false; // Reset export status on change

                // Update History
                if (!skipHistory) {
                    const newHistory = state.history.slice(0, state.historyIndex + 1);
                    newHistory.push(nextLottie);
                    if (newHistory.length > MAX_HISTORY) newHistory.shift();

                    state.history = newHistory;
                    state.historyIndex = newHistory.length - 1;
                }

                // Sync to Active Page
                const page = state.pages.find(p => p.id === state.activePageId);
                if (page) {
                    page.lottie = state.lottie;
                    page.history = state.history;
                    page.historyIndex = state.historyIndex;
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

                    // Sync to Active Page
                    const page = state.pages.find(p => p.id === state.activePageId);
                    if (page) {
                        page.history = state.history;
                        page.historyIndex = state.historyIndex;
                        page.lottie = state.lottie;
                    }
                }
            }));
        },

        undo: () => {
            set(produce((state: LottieState) => {
                if (state.historyIndex > 0) {
                    state.historyIndex--;
                    state.lottie = state.history[state.historyIndex];

                    // Sync
                    const page = state.pages.find(p => p.id === state.activePageId);
                    if (page) {
                        page.historyIndex = state.historyIndex;
                        page.lottie = state.lottie;
                    }
                }
            }));
        },

        redo: () => {
            set(produce((state: LottieState) => {
                if (state.historyIndex < state.history.length - 1) {
                    state.historyIndex++;
                    state.lottie = state.history[state.historyIndex];

                    // Sync
                    const page = state.pages.find(p => p.id === state.activePageId);
                    if (page) {
                        page.historyIndex = state.historyIndex;
                        page.lottie = state.lottie;
                    }
                }
            }));
        },

        canUndo: () => get().historyIndex > 0,
        canRedo: () => get().historyIndex < get().history.length - 1,

        hasExportedThisSession: false,
        markExported: () => set({ hasExportedThisSession: true }),

        // Export Actions
        setIsExporting: (isExporting) => set({ isExporting }),
        setExportProgress: (exportProgress) => set({ exportProgress }),
        setExportStatus: (exportStatus) => set({ exportStatus }),

        // Social Preview State
        socialSettings: {
            enabled: false,
            preset: 'portrait',
            resolution: '1080p',
            bgColor: '#F3F4F6',
            padding: 20,
            fps: 30,
            format: 'webm'
        },
        setSocialSettings: (settings) => set(produce((state: LottieState) => {
            state.socialSettings = { ...state.socialSettings, ...settings };
        })),
        toggleSocialPreview: () => set(produce((state: LottieState) => {
            state.socialSettings.enabled = !state.socialSettings.enabled;
            // Mutually exclusive
            if (state.socialSettings.enabled) {
                state.devicePreviewEnabled = false;
            }
        })),

        // Device Preview State
        devicePreviewEnabled: false,
        toggleDevicePreview: () => set(produce((state: LottieState) => {
            state.devicePreviewEnabled = !state.devicePreviewEnabled;
            // Mutually exclusive
            if (state.devicePreviewEnabled) {
                state.socialSettings.enabled = false;
            }
        })),

        // Social Export Modal
        isSocialModalOpen: false,
        setSocialModalOpen: (open) => set({ isSocialModalOpen: open }),
    };
});

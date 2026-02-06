import { create } from 'zustand';

interface PlaybackState {
    isPlaying: boolean;
    progress: number; // 0 to 1
    currentFrame: number;
    totalFrames: number;
    speed: number;

    // Actions
    togglePlay: () => void;
    setPlaying: (playing: boolean) => void;
    setProgress: (progress: number) => void;
    setFrame: (frame: number) => void;
    setSpeed: (speed: number) => void;
    setDuration: (frames: number) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
    isPlaying: true,
    progress: 0,
    currentFrame: 0,
    totalFrames: 0,
    speed: 1,

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setPlaying: (isPlaying) => set({ isPlaying }),
    setProgress: (progress) => set({ progress }),
    setFrame: (currentFrame) => set({ currentFrame }),
    setSpeed: (speed) => set({ speed }),
    setDuration: (totalFrames) => set({ totalFrames }),
}));

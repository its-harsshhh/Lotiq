import { useEffect, useRef } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import { useLottieStore } from '@/store/useLottieStore';
import { usePlaybackStore } from '@/store/usePlaybackStore';

export const Player = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<AnimationItem | null>(null);

    // Stores
    const lottieData = useLottieStore((state) => state.lottie);
    const { isPlaying, speed, progress } = usePlaybackStore();
    const { setProgress, setFrame, setDuration } = usePlaybackStore();


    // 1. Initialize / Re-initialize Animation
    useEffect(() => {
        if (!containerRef.current || !lottieData) return;

        // Cleanup previous instance
        if (animationRef.current) {
            animationRef.current.destroy();
        }

        try {
            // Deep clone to avoid mutation by lottie-web if it happens
            const animationData = JSON.parse(JSON.stringify(lottieData));

            const anim = lottie.loadAnimation({
                container: containerRef.current,
                renderer: 'svg',
                loop: true,
                autoplay: isPlaying, // Use store state
                animationData: animationData,

            });

            animationRef.current = anim;

            // Set initial duration
            // Use ResizeObserver or event listener to ensure frame data is ready
            anim.addEventListener('DOMLoaded', () => {
                setDuration(anim.totalFrames);
                // Apply initial speed
                anim.setSpeed(speed);
            });

            // Sync frame updates to store (throttled logic could act here)
            anim.addEventListener('enterFrame', (e) => {
                const current = e.currentTime; // Frames
                const total = anim.totalFrames;
                if (total > 0) {
                    setFrame(Math.round(current));
                    setProgress(current / total);
                }
            });

            // Sync completion (loop handled by config, but just in case)
            anim.addEventListener('complete', () => {
                // if (!loop) setPlaying(false);
            });

        } catch (error) {
            console.error("Lottie Load Error", error);
        }

        return () => {
            animationRef.current?.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lottieData]); // Re-run when JSON changes (Edit or New Load)

    // 2. Sync Play/Pause
    useEffect(() => {
        if (!animationRef.current) return;
        if (isPlaying) {
            animationRef.current.play();
        } else {
            animationRef.current.pause();
        }
    }, [isPlaying]);

    // 3. Sync Speed
    useEffect(() => {
        if (!animationRef.current) return;
        animationRef.current.setSpeed(speed);
    }, [speed]);

    // 4. Handle Scrub (When user drags slider, we might want to pause and jump)
    // This is tricky: we don't want the enterFrame loop to fight the user's drag.
    // Usually Controls component handles the user interaction and updates store,
    // causing a seek here. But if we are playing, the store updates rapidly.
    // We'll rely on a separate specific "seekTo" action or just use a ref exposed to controls?
    // For MVPI: If !isPlaying, we watch progress.
    useEffect(() => {
        if (animationRef.current && !isPlaying) {
            const frame = progress * animationRef.current.totalFrames;
            animationRef.current.goToAndStop(frame, true);
        }
    }, [progress, isPlaying]);


    return (
        <div className="flex-1 relative bg-secondary/10 flex items-center justify-center overflow-hidden">
            {/* Checkerboard background for transparency */}
            <div className="absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: `
                    linear-gradient(45deg, #ccc 25%, transparent 25%), 
                    linear-gradient(-45deg, #ccc 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #ccc 75%), 
                    linear-gradient(-45deg, transparent 75%, #ccc 75%)
                  `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
            />

            {/* Artboard Container */}
            <div
                className="relative z-10 flex items-center justify-center p-8 w-full h-full"
            >
                <div
                    ref={containerRef}
                    className="relative bg-white/5 shadow-2xl border-2 border-gray-400"
                    style={{
                        aspectRatio: lottieData ? `${lottieData.w} / ${lottieData.h}` : 'auto',
                        width: 'auto',
                        height: 'auto',
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }}
                />
            </div>
        </div>
    );
};

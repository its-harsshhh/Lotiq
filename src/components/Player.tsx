import { useEffect, useRef, useState } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import { useLottieStore } from '@/store/useLottieStore';
import { usePlaybackStore } from '@/store/usePlaybackStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Player = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<AnimationItem | null>(null);
    const [showMockup, setShowMockup] = useState(false);

    // Stores
    const lottieData = useLottieStore((state) => state.lottie);
    const { isPlaying, speed, progress } = usePlaybackStore();
    const { setProgress, setFrame, setDuration } = usePlaybackStore();
    const clearSelectedLayers = useSelectionStore((state) => state.clearSelectedLayers);

    // Clear selection when clicking on canvas background
    const handleCanvasClick = () => {
        clearSelectedLayers();
    };


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
            anim.addEventListener('DOMLoaded', () => {
                setDuration(anim.totalFrames);
                // Apply initial speed
                anim.setSpeed(speed);
            });

            // Sync frame updates to store
            anim.addEventListener('enterFrame', (e) => {
                const current = e.currentTime;
                const total = anim.totalFrames;
                if (total > 0) {
                    setFrame(Math.round(current));
                    setProgress(current / total);
                }
            });

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
    }, [lottieData, showMockup]); // Re-run when JSON changes or mockup toggled

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

    // 4. Handle Scrub
    useEffect(() => {
        if (animationRef.current && !isPlaying) {
            const frame = progress * animationRef.current.totalFrames;
            animationRef.current.goToAndStop(frame, true);
        }
    }, [progress, isPlaying]);


    return (
        <div className="flex-1 relative bg-secondary/10 flex items-center justify-center overflow-hidden" onClick={handleCanvasClick}>
            {/* Mockup Toggle Button - Top Right */}
            <button
                onClick={() => setShowMockup(!showMockup)}
                className={cn(
                    "absolute top-3 right-3 z-20 p-2 rounded-lg border transition-all",
                    "hover:bg-muted/80",
                    showMockup
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-background/80 border-border text-muted-foreground"
                )}
                title={showMockup ? "Hide phone mockup" : "Show phone mockup"}
            >
                <Smartphone className="w-4 h-4" />
            </button>

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
            <div className="relative z-10 flex items-center justify-center p-8 w-full h-full">
                {showMockup ? (
                    // iOS Phone Mockup - wrap the animation container
                    <div key="mockup-view" className="relative flex items-center justify-center">
                        {/* Phone Frame */}
                        <div
                            className="relative bg-[#1a1a1a] rounded-[3rem] p-3 shadow-2xl"
                            style={{
                                boxShadow: '0 0 0 2px #333, 0 25px 50px -12px rgba(0,0,0,0.5)',
                            }}
                        >
                            {/* Dynamic Island */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />

                            {/* Screen */}
                            <div
                                className="relative bg-white rounded-[2.5rem] overflow-hidden flex items-center justify-center"
                                style={{
                                    width: 280,
                                    height: 600,
                                }}
                            >
                                {/* Animation Container - SVG viewBox handles aspect ratio */}
                                <div
                                    ref={containerRef}
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
                        </div>
                    </div>
                ) : (
                    // Simple View (no mockup) - STABLE ref
                    <div
                        key="simple-view"
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
                )}
            </div>
        </div>
    );
};

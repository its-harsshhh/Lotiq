import { useEffect, useRef } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import { useCompareStore } from '@/store/useCompareStore';
import { usePlaybackStore } from '@/store/usePlaybackStore';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

export const ComparePlayer = () => {
    const { lottieA, lottieB, setLottieA, setLottieB } = useCompareStore();
    const { isPlaying, speed, progress, setFrame, setProgress: setStoreProgress, setDuration } = usePlaybackStore();

    const containerARef = useRef<HTMLDivElement>(null);
    const containerBRef = useRef<HTMLDivElement>(null);
    const animARef = useRef<AnimationItem | null>(null);
    const animBRef = useRef<AnimationItem | null>(null);

    // Initial Load & Cleanup
    useEffect(() => {
        let animA: AnimationItem | null = null;
        let animB: AnimationItem | null = null;

        if (lottieA && containerARef.current) {
            animA = lottie.loadAnimation({
                container: containerARef.current,
                renderer: 'svg',
                loop: true,
                autoplay: isPlaying,
                animationData: JSON.parse(JSON.stringify(lottieA)),
                rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
            });
            animARef.current = animA;
        }

        if (lottieB && containerBRef.current) {
            animB = lottie.loadAnimation({
                container: containerBRef.current,
                renderer: 'svg',
                loop: true,
                autoplay: isPlaying,
                animationData: JSON.parse(JSON.stringify(lottieB)),
                rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
            });
            animBRef.current = animB;
        }

        const masterAnim = animA || animB;

        if (masterAnim) {
            masterAnim.addEventListener('DOMLoaded', () => {
                setDuration(masterAnim.totalFrames);
                if (animA) animA.setSpeed(speed);
                if (animB) animB.setSpeed(speed);
            });

            masterAnim.addEventListener('enterFrame', (e: any) => {
                // Keep the store synchronized with the master animation
                const current = e.currentTime;
                const total = masterAnim.totalFrames;
                if (total > 0) {
                    setFrame(Math.round(current));
                    setStoreProgress(current / total);
                }
            });
        }

        return () => {
            animA?.destroy();
            animB?.destroy();
        };
        // Intentionally missing isPlaying, we handle it separately
    }, [lottieA, lottieB]);

    // Handle Play/Pause
    useEffect(() => {
        if (isPlaying) {
            animARef.current?.play();
            animBRef.current?.play();
        } else {
            animARef.current?.pause();
            animBRef.current?.pause();
        }
    }, [isPlaying]);

    // Handle Speed
    useEffect(() => {
        animARef.current?.setSpeed(speed);
        animBRef.current?.setSpeed(speed);
    }, [speed]);

    // Handle Scrubbing
    useEffect(() => {
        if (!isPlaying) {
            if (animARef.current) {
                const total = animARef.current.totalFrames;
                animARef.current.goToAndStop(progress * total, true);
            }
            if (animBRef.current) {
                const total = animBRef.current.totalFrames;
                animBRef.current.goToAndStop(progress * total, true);
            }
        }
    }, [progress, isPlaying]);

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-zinc-950/20">
            {/* Split Mode */}
            <div className="w-full h-full flex flex-col md:flex-row shadow-inner border border-border/40 m-4 rounded-xl overflow-hidden bg-muted/10">
                <div className="flex-1 border-b md:border-b-0 md:border-r border-border/40 relative flex items-center justify-center p-8">
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background/50 px-2 py-1 rounded backdrop-blur border border-border/40">Lottie A</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLottieA(null)}
                            className="h-7 px-2 gap-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors group border border-border/40"
                            title="Replace Lottie A"
                        >
                            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Replace</span>
                        </Button>
                    </div>
                    <div ref={containerARef} className="w-full h-full max-w-[500px] max-h-[500px]" />
                </div>
                <div className="flex-1 relative flex items-center justify-center p-8">
                    <div className="absolute top-4 right-4 flex flex-row-reverse items-center gap-1.5 z-10">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-background/50 px-2 py-1 rounded backdrop-blur border border-border/40">Lottie B</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLottieB(null)}
                            className="h-7 px-2 gap-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors group border border-border/40"
                            title="Replace Lottie B"
                        >
                            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Replace</span>
                        </Button>
                    </div>
                    <div ref={containerBRef} className="w-full h-full max-w-[500px] max-h-[500px]" />
                </div>
            </div>
        </div>
    );
};

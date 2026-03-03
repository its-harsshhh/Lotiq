import { useEffect, useRef, useState } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import { useLottieStore } from '@/store/useLottieStore';
import { usePlaybackStore } from '@/store/usePlaybackStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { useCompareStore } from '@/store/useCompareStore'; // Import Compare Store
import { LayoutTemplate, Smartphone, Sun, Moon, GitCompare } from 'lucide-react'; // Import GitCompare
import { cn } from '@/lib/utils';

export const Player = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<AnimationItem | null>(null);

    // Stores
    const lottieData = useLottieStore((state) => state.lottie);
    const setAppMode = useLottieStore((state) => state.setAppMode);
    const activePageId = useLottieStore((state) => state.activePageId);
    const pages = useLottieStore((state) => state.pages);
    const socialSettings = useLottieStore((state) => state.socialSettings);
    const setSocialSettings = useLottieStore((state) => state.setSocialSettings);
    const toggleSocialPreview = useLottieStore((state) => state.toggleSocialPreview);

    // New Device Preview Store
    const devicePreviewEnabled = useLottieStore((state) => state.devicePreviewEnabled);
    const toggleDevicePreview = useLottieStore((state) => state.toggleDevicePreview);

    const { isPlaying, speed, progress } = usePlaybackStore();
    const { setProgress, setFrame, setDuration } = usePlaybackStore();
    const clearSelectedLayers = useSelectionStore((state) => state.clearSelectedLayers);

    // Clear selection when clicking on canvas background
    const handleCanvasClick = () => {
        clearSelectedLayers();
    };

    // Social Preset Ratios
    const socialPresets = {
        'square': 1,
        'portrait': 4 / 5, // User expects Portrait = 4:5
        'vertical': 9 / 16, // User expects Vertical = 9:16
    };
    const currentAspectRatio = socialPresets[socialSettings.preset];

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
                rendererSettings: {
                    // Use 'meet' to ensure the animation fits perfectly inside the screen 
                    // without getting cropped, regardless of its original aspect ratio.
                    preserveAspectRatio: 'xMidYMid meet'
                }
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
    }, [lottieData, devicePreviewEnabled, socialSettings.enabled]); // Re-run when JSON changes or mockup toggled

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


    // Scale State for Social Preview
    const [socialScale, setSocialScale] = useState(1);
    const socialWrapperRef = useRef<HTMLDivElement>(null);

    // Calculate scale factor for Social Preview to match Device Preview style
    useEffect(() => {
        if (!socialSettings.enabled || !socialWrapperRef.current) return;

        const updateScale = () => {
            const el = socialWrapperRef.current;
            if (!el) return;

            const { width, height } = el.getBoundingClientRect();
            // Safety check
            if (width === 0 || height === 0) return;

            const p = socialSettings.padding; // 0-100
            const availW = width * (1 - p / 100);
            const availH = height * (1 - p / 100);

            // Base Reference: iPhone 14 Pro Layout (matches Device View aspect)
            const BASE_H = 844;
            // 9/19.5 aspect ratio matches Device Preview logic
            const BASE_W = 844 * (9 / 19.5);
            const baseAspect = BASE_W / BASE_H;
            const slotAspect = availW / availH;

            let s = 1;
            if (slotAspect > baseAspect) {
                // Slot is wider, fit by height
                s = availH / BASE_H;
            } else {
                // Slot is narrower, fit by width
                s = availW / BASE_W;
            }
            setSocialScale(s);
        };

        // Initial calc
        updateScale();

        // Observe changes
        const ro = new ResizeObserver(updateScale);
        ro.observe(socialWrapperRef.current);

        return () => ro.disconnect();
    }, [socialSettings.enabled, socialSettings.padding, socialSettings.preset]); // Re-run mostly on layout changes

    const setLottieA = useCompareStore((state) => state.setLottieA);
    const fileName = useLottieStore((state) => state.fileName);

    return (
        <div className="flex-1 relative bg-secondary/10 flex items-center justify-center overflow-hidden" onClick={handleCanvasClick}>

            {/* Toggles - Top Left (Compare) */}
            {activePageId === pages[0]?.id && (
                <div className="absolute top-3 left-3 z-20">
                    <button
                        onClick={() => {
                            if (lottieData) {
                                setLottieA(lottieData, fileName);
                            }
                            setAppMode('compare');
                        }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                            "hover:bg-muted/80 bg-background/80 border-border text-muted-foreground hover:text-foreground shadow-sm"
                        )}
                        title="Compare with another Lottie"
                    >
                        <GitCompare className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-semibold">Compare</span>
                    </button>
                </div>
            )}

            {/* Toggles - Top Right */}
            <div className="absolute top-3 right-3 z-20 flex gap-2">
                {/* Screen Background Toggle */}
                {(devicePreviewEnabled || socialSettings.enabled) && (
                    <button
                        onClick={() => {
                            const isDark = socialSettings.phoneScreenBg !== 'white';
                            setSocialSettings({ phoneScreenBg: isDark ? 'white' : 'black' });
                        }}
                        className={cn(
                            "p-2 rounded-lg border transition-all",
                            "hover:bg-muted/80 bg-background/80 border-border text-muted-foreground"
                        )}
                        title={socialSettings.phoneScreenBg === 'white' ? "Switch to dark screen" : "Switch to light screen"}
                    >
                        {socialSettings.phoneScreenBg === 'white' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                )}

                {/* Device Preview Toggle */}
                <button
                    onClick={toggleDevicePreview}
                    className={cn(
                        "p-2 rounded-lg border transition-all",
                        "hover:bg-muted/80",
                        devicePreviewEnabled
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background/80 border-border text-muted-foreground"
                    )}
                    title={devicePreviewEnabled ? "Hide device frame" : "Show device frame"}
                >
                    <Smartphone className="w-4 h-4" />
                </button>

                {/* Social Preview Toggle */}
                <button
                    onClick={toggleSocialPreview}
                    className={cn(
                        "p-2 rounded-lg border transition-all",
                        "hover:bg-muted/80",
                        socialSettings.enabled
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background/80 border-border text-muted-foreground"
                    )}
                    title={socialSettings.enabled ? "Hide social preview" : "Show social preview"}
                >
                    <LayoutTemplate className="w-4 h-4" />
                </button>
            </div>

            {/* Modern Dot Pattern Background */}
            <div className="absolute inset-0 z-0 bg-secondary/5" />
            <div
                className="absolute inset-0 z-0 opacity-20 dark:opacity-10"
                style={{
                    backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                    color: 'var(--foreground)' // Uses current text color which adapts to theme
                }}
            />

            {/* Artboard Container */}
            <div className="relative z-10 flex items-center justify-center p-8 w-full h-full">

                {socialSettings.enabled ? (
                    // --- SOCIAL PREVIEW MODE ---
                    // Render phone INSIDE the post container
                    <div
                        key="social-view"
                        ref={socialWrapperRef}
                        className="relative shadow-xl flex items-center justify-center transition-all duration-300 ring-1 ring-black/5"
                        style={{
                            background: socialSettings.bgColor,
                            aspectRatio: `${currentAspectRatio}`,
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '90%',
                            maxHeight: '90%'
                        }}
                    >
                        {/* Phone Frame - Scaled using Transform to match Device Preview perfectly */}
                        <div
                            className="flex items-center justify-center"
                            style={{
                                width: '100%',
                                height: '100%',
                                // Use flex to center the transformed element if needed, 
                                // but the transform origin center handles it.
                            }}
                        >
                            <div
                                // Match Device Preview Classes EXACTLY
                                className="relative bg-[#1a1a1a] rounded-[3rem] p-3 shadow-2xl transition-all duration-300 ring-1 ring-white/10 shrink-0"
                                style={{
                                    // Fixed Base Dimensions
                                    height: 844,
                                    width: 844 * (9 / 19.5),
                                    // Scale it to fit
                                    transform: `scale(${socialScale})`,
                                    // Box Shadow from Device Preview
                                    boxShadow: '0 0 0 2px #333, 0 25px 50px -12px rgba(0,0,0,0.5)',
                                }}
                            >
                                {/* Dynamic Island - Matches Device Preview (top-4 w-28 h-7) */}
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />

                                {/* Screen - Matches Device Preview (rounded-[2.5rem]) */}
                                <div
                                    className={cn(
                                        "relative rounded-[2.5rem] overflow-hidden w-full h-full flex items-center justify-center",
                                        socialSettings.phoneScreenBg === 'white' ? 'bg-white' : socialSettings.phoneScreenBg === 'transparent' ? 'bg-transparent/0' : 'bg-black'
                                    )}
                                >
                                    {/* Animation Container */}
                                    <div ref={containerRef} className="w-full h-full" />

                                    {/* Glass Reflection */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                                </div>

                                {/* Home Indicator - Matches Device Preview (bottom-2 w-32 h-1) */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full pointer-events-none" />
                            </div>
                        </div>
                    </div>

                ) : devicePreviewEnabled ? (
                    // --- DEVICE PREVIEW MODE ---
                    // ... (Unchanged)
                    <div key="device-view" className="relative flex items-center justify-center h-full w-full">
                        <div
                            className="relative bg-[#1a1a1a] rounded-[3rem] p-3 shadow-2xl transition-all duration-300 ring-1 ring-white/10"
                            style={{
                                aspectRatio: '9/19.5',
                                height: '90%', // Fill height mostly
                                width: 'auto',
                                boxShadow: '0 0 0 2px #333, 0 25px 50px -12px rgba(0,0,0,0.5)',
                            }}
                        >
                            {/* Dynamic Island */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />

                            {/* Screen */}
                            <div className={cn(
                                "relative rounded-[2.5rem] overflow-hidden w-full h-full flex items-center justify-center",
                                socialSettings.phoneScreenBg === 'white' ? 'bg-white' : socialSettings.phoneScreenBg === 'transparent' ? 'bg-transparent/0' : 'bg-black'
                            )}>
                                <div ref={containerRef} className="w-full h-full" />
                            </div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full pointer-events-none" />
                        </div>
                    </div>
                ) : (
                    // --- DEFAULT PREVIEW MODE ---
                    <div
                        key="simple-view"
                        ref={containerRef}
                        className="relative shadow-2xl rounded-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                        style={{
                            aspectRatio: lottieData ? `${lottieData.w} / ${lottieData.h}` : 'auto',
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            // Add a subtle checkerboard ONLY for the artboard itself if needed, or just let it float
                            // I'll add a subtle background color to show bounds
                            backgroundSize: '20px 20px',
                            backgroundColor: 'var(--background)',
                            backgroundImage: `
                                linear-gradient(45deg, var(--muted) 25%, transparent 25%), 
                                linear-gradient(-45deg, var(--muted) 25%, transparent 25%), 
                                linear-gradient(45deg, transparent 75%, var(--muted) 75%), 
                                linear-gradient(-45deg, transparent 75%, var(--muted) 75%)
                            `,
                            backgroundBlendMode: 'overlay',
                            opacity: 1 // reset opacity
                        }}
                    />
                )}
            </div>
        </div>
    );
};

import { useState, useRef, useEffect } from 'react';
import { useLottieStore } from '@/store/useLottieStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdvancedColorPicker } from '@/components/ui/advanced-color-picker';
import { Smartphone, Download, Loader2 } from 'lucide-react';
import lottie, { type AnimationItem } from 'lottie-web';
import { cn } from '@/lib/utils';

interface SocialExportModalProps {
    open: boolean;
    onClose: () => void;
    onExport: () => void; // Trigger export in parent (ExportPanel)
}

export const SocialExportModal = ({ open, onClose, onExport }: SocialExportModalProps) => {
    const lottieData = useLottieStore((state) => state.lottie);
    const socialSettings = useLottieStore((state) => state.socialSettings);
    const setSocialSettings = useLottieStore((state) => state.setSocialSettings);
    const isExporting = useLottieStore((state) => state.isExporting);
    const exportStatus = useLottieStore((state) => state.exportStatus);
    const exportProgress = useLottieStore((state) => state.exportProgress);

    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<AnimationItem | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.5); // Start smaller, will be recalculated

    const {
        preset,
        resolution,
        bgColor,
        padding
    } = socialSettings;

    // Helper to update specific settings
    const updateSetting = (key: keyof typeof socialSettings, value: any) => {
        setSocialSettings({ [key]: value });
    };

    const socialPresets = {
        'square': 1,
        'portrait': 4 / 5,
        'vertical': 9 / 16,
    };
    const currentAspectRatio = socialPresets[preset];

    // --- 1. Animation Logic (Reused from Player.tsx) ---
    useEffect(() => {
        if (!open || !lottieData) return;

        // Cleanup
        if (animationRef.current) {
            animationRef.current.destroy();
        }

        // Small delay to ensure Dialog DOM is fully mounted
        const timer = setTimeout(() => {
            if (!containerRef.current) return;

            try {
                const anim = lottie.loadAnimation({
                    container: containerRef.current,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    animationData: JSON.parse(JSON.stringify(lottieData)),
                    rendererSettings: {
                        preserveAspectRatio: 'xMidYMid slice' // Always fill screen in preview
                    }
                });
                animationRef.current = anim;
            } catch (error) {
                console.error("Lottie Load Error in Modal", error);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            animationRef.current?.destroy();
        };
    }, [open, lottieData]); // Re-run when opened or data changes

    // --- 2. Scale Logic (Reused from Player.tsx) ---
    useEffect(() => {
        if (!open || !wrapperRef.current) return;

        const updateScale = () => {
            const el = wrapperRef.current;
            if (!el) return;

            const { width, height } = el.getBoundingClientRect();
            if (width === 0 || height === 0) return;

            const p = padding; // 0-100
            const availW = width * (1 - p / 100);
            const availH = height * (1 - p / 100);

            // Base Reference: iPhone 14 Pro Layout
            const BASE_H = 844;
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
            setScale(s);
        };

        // Multiple delays to ensure DOM is fully ready
        const timer1 = setTimeout(updateScale, 50);
        const timer2 = setTimeout(updateScale, 150);
        const timer3 = setTimeout(updateScale, 300);

        // ResizeObserver for dynamic updates
        let ro: ResizeObserver | null = null;
        const setupObserver = setTimeout(() => {
            if (wrapperRef.current) {
                ro = new ResizeObserver(updateScale);
                ro.observe(wrapperRef.current);
            }
        }, 100);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(setupObserver);
            ro?.disconnect();
        };
    }, [open, padding, preset]);


    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="dark max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-950/95 border-zinc-800 text-zinc-100">
                <DialogHeader className="flex-row items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <DialogTitle className="flex items-center gap-2 text-zinc-100">
                        <Smartphone className="w-5 h-5 text-blue-400" />
                        <span>Social Post Export</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT: Preview Area */}
                    <div className="flex-1 bg-black/40 relative flex items-center justify-center p-8 overflow-hidden">
                        {/* Checkerboard */}
                        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
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

                        {/* Post Container */}
                        <div
                            ref={wrapperRef}
                            className="relative shadow-2xl flex items-center justify-center transition-all duration-300 z-10"
                            style={{
                                background: bgColor,
                                aspectRatio: `${currentAspectRatio}`,
                                width: 'auto',
                                height: 'auto',
                                maxWidth: '100%',
                                maxHeight: '100%'
                            }}
                        >
                            {/* Phone Mockup (Scaled) */}
                            <div className="flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
                                <div
                                    className="relative bg-[#1a1a1a] rounded-[3rem] p-3 shadow-2xl transition-all duration-300 ring-1 ring-white/10 shrink-0"
                                    style={{
                                        height: 844,
                                        width: 844 * (9 / 19.5),
                                        transform: `scale(${scale})`,
                                        boxShadow: '0 0 0 2px #333, 0 25px 50px -12px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    {/* Dynamic Island */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />
                                    {/* Screen */}
                                    <div className="relative bg-black rounded-[2.5rem] overflow-hidden w-full h-full flex items-center justify-center">
                                        <div ref={containerRef} className="w-full h-full" />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none" />
                                    </div>
                                    {/* Home Indicator */}
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Settings Panel */}
                    <div className="w-80 border-l border-zinc-800 bg-zinc-900/30 p-6 flex flex-col gap-6 overflow-y-auto">

                        {/* Format */}
                        <div className="space-y-3">
                            <Label className="text-zinc-100">Format</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'square', label: 'Square' },
                                    { id: 'portrait', label: 'Portrait' },
                                    { id: 'vertical', label: 'Vertical' }
                                ].map((opt) => (
                                    <Button
                                        key={opt.id}
                                        variant={preset === opt.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => updateSetting('preset', opt.id)}
                                        className={cn(
                                            "h-9",
                                            preset === opt.id ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900" : "bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-100"
                                        )}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Resolution */}
                        <div className="space-y-3">
                            <Label className="text-zinc-100">Resolution</Label>
                            <Select
                                value={resolution}
                                onValueChange={(val) => updateSetting('resolution', val)}
                            >
                                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="720p">720p (HD)</SelectItem>
                                    <SelectItem value="1080p">1080p (FHD)</SelectItem>
                                    <SelectItem value="4k">4K (UHD)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Padding */}
                        <div className="space-y-3">
                            <Label className="text-zinc-100">Device Size (Padding)</Label>
                            <Select
                                value={String(padding)}
                                onValueChange={(val) => updateSetting('padding', parseInt(val))}
                            >
                                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Full Screen (0%)</SelectItem>
                                    <SelectItem value="10">Tight (10%)</SelectItem>
                                    <SelectItem value="20">Normal (20%)</SelectItem>
                                    <SelectItem value="30">Wide (30%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Framerate */}
                        <div className="space-y-3">
                            <Label className="text-zinc-100">Framerate</Label>
                            <Select
                                value={String(socialSettings.fps)}
                                onValueChange={(val) => updateSetting('fps', parseInt(val))}
                            >
                                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="24">24 FPS</SelectItem>
                                    <SelectItem value="30">30 FPS</SelectItem>
                                    <SelectItem value="60">60 FPS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Video Format */}
                        <div className="space-y-3">
                            <Label className="text-zinc-100">Video Format</Label>
                            <Select
                                value={socialSettings.format}
                                onValueChange={(val) => updateSetting('format', val)}
                            >
                                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="webm">WebM (⚡ Fast)</SelectItem>
                                    <SelectItem value="mp4">MP4 (🐢 Slow - Better Compatibility)</SelectItem>
                                </SelectContent>
                            </Select>
                            {socialSettings.format === 'mp4' && (
                                <p className="text-[10px] text-amber-500">
                                    ⚠️ MP4 requires downloading ~30MB and slow transcoding
                                </p>
                            )}
                        </div>

                        {/* Background */}
                        <div className="space-y-3">
                            <Label className="text-zinc-100">Background</Label>
                            <div className="p-3 border border-zinc-700 rounded-lg bg-zinc-900/50">
                                <AdvancedColorPicker
                                    color={bgColor}
                                    onChange={(val) => updateSetting('bgColor', val)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex flex-row justify-between items-center sm:justify-between">
                    <div className="text-xs text-zinc-500">
                        {isExporting ? (
                            <span className="flex items-center gap-2 text-blue-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {exportStatus} {exportProgress > 0 && `(${Math.round(exportProgress * 100)}%)`}
                            </span>
                        ) : (
                            <span>Prepare your post and click Export</span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose} disabled={isExporting} className="text-zinc-400 hover:text-zinc-100">
                            Cancel
                        </Button>
                        <Button
                            onClick={onExport}
                            disabled={isExporting}
                            className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Video
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

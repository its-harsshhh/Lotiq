
import { useState, useRef, useEffect } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { Rnd } from "react-rnd";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, RotateCcw, Film, Image } from "lucide-react";
import { useLottieStore } from "@/store/useLottieStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import GIF from 'gif.js';

interface CropModalProps {
    open: boolean;
    onClose: () => void;
}

export const CropModal = ({ open, onClose }: CropModalProps) => {
    const lottieData = useLottieStore((state) => state.lottie);
    const fileName = useLottieStore((state) => state.fileName);
    const containerRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<AnimationItem | null>(null);

    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const [previewScale, setPreviewScale] = useState(1);
    const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [croppedJson, setCroppedJson] = useState<any>(null);

    // Initialize dimensions when opening
    useEffect(() => {
        if (open && lottieData) {
            setViewMode('edit');
            const lw = lottieData.w || 500;
            const lh = lottieData.h || 500;

            // Fit to container (approx 600x400 usually in dialog)
            const maxW = 600;
            const maxH = 450;
            const scale = Math.min(maxW / lw, maxH / lh);
            setPreviewScale(scale);

            const displayW = lw * scale;
            const displayH = lh * scale;
            setContainerSize({ w: displayW, h: displayH });

            // Default crop: Center 80%
            const cropW = displayW * 0.8;
            const cropH = displayH * 0.8;
            setCrop({
                x: (displayW - cropW) / 2,
                y: (displayH - cropH) / 2,
                w: cropW,
                h: cropH
            });
        }
    }, [open, lottieData]);

    const getCroppedLottie = () => {
        if (!lottieData) return null;

        const realX = Math.round(crop.x / previewScale);
        const realY = Math.round(crop.y / previewScale);
        const realW = Math.round(crop.w / previewScale);
        const realH = Math.round(crop.h / previewScale);

        // Create new Asset ID
        const newAssetId = `precomp_crop_${Date.now()}`;
        // Deep clone to avoid mutating store state
        const originalLayers = JSON.parse(JSON.stringify(lottieData.layers));

        const newAsset = {
            id: newAssetId,
            layers: originalLayers
        };

        const newLayer = {
            ind: 1,
            nm: "Cropped Content",
            ty: 0, // Precomp
            refId: newAssetId,
            ks: {
                a: { k: [0, 0, 0] },
                p: { k: [-realX, -realY, 0] },
                s: { k: [100, 100, 100] },
                r: { k: 0 },
                o: { k: 100 }
            },
            w: lottieData.w,
            h: lottieData.h,
            ip: lottieData.ip,
            op: lottieData.op,
            st: 0,
            sr: 1
        };

        return {
            ...lottieData,
            w: realW,
            h: realH,
            layers: [newLayer],
            assets: [...(lottieData.assets || []), newAsset]
        };
    };

    // Render Lottie Logic
    useEffect(() => {
        // Only run if open and container is ready
        if (!open || !containerRef.current || !lottieData) return;

        // Cleanup function to destroy previous instance
        const cleanup = () => {
            if (animRef.current) {
                animRef.current.destroy();
                animRef.current = null;
            }
        };

        cleanup();

        const dataToPlay = viewMode === 'preview' ? croppedJson : lottieData;
        if (!dataToPlay) return;

        try {
            animRef.current = lottie.loadAnimation({
                container: containerRef.current,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: JSON.parse(JSON.stringify(dataToPlay))
            });
        } catch (e) {
            console.error("Lottie load failed", e);
        }

        return cleanup;
    }, [open, viewMode, croppedJson, lottieData, containerSize]);


    const handlePreview = () => {
        const json = getCroppedLottie();
        if (json) {
            setCroppedJson(json);
            setViewMode('preview');
        }
    };

    const handleDownload = () => {
        const json = viewMode === 'preview' ? croppedJson : getCroppedLottie();
        if (!json) return;

        const content = JSON.stringify(json, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cropped-${fileName}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Cropped Lottie downloaded!");
        onClose();
    };

    const handleGifDownload = async () => {
        const json = viewMode === 'preview' ? croppedJson : getCroppedLottie();
        if (!json) return;

        const toastId = toast.loading("Generating GIF from cropped animation...");

        try {
            const width = json.w || 500;
            const height = json.h || 500;
            const fps = 30;

            // Create hidden container
            const container = document.createElement('div');
            container.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${width}px;height:${height}px;overflow:hidden;`;
            document.body.appendChild(container);

            // Load animation
            const anim = lottie.loadAnimation({
                container,
                renderer: 'svg',
                loop: false,
                autoplay: false,
                animationData: JSON.parse(JSON.stringify(json)),
            });

            await new Promise(resolve => {
                if (anim.isLoaded) resolve(null);
                else anim.addEventListener('DOMLoaded', resolve);
            });
            await new Promise(r => setTimeout(r, 300));

            // Setup canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;

            // @ts-ignore
            const gif = new GIF({
                workers: 2,
                quality: 10,
                width,
                height,
                workerScript: '/gif.worker.js',
                background: '#ffffff'
            });

            const totalFrames = anim.totalFrames;
            const duration = totalFrames / anim.frameRate;
            const outputFrames = Math.floor(duration * fps);

            // Render frames
            for (let i = 0; i < outputFrames; i++) {
                const frame = (i / fps) * anim.frameRate;
                anim.goToAndStop(frame, true);

                // Rasterize SVG
                const svg = container.querySelector('svg');
                if (svg) {
                    svg.setAttribute('width', String(width));
                    svg.setAttribute('height', String(height));
                    const svgString = new XMLSerializer().serializeToString(svg);
                    const blob = new Blob([svgString], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                        const img = new window.Image();
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = url;
                    });
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    URL.revokeObjectURL(url);
                }

                gif.addFrame(canvas, { copy: true, delay: 1000 / fps });
                if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
            }

            gif.on('finished', (blob: Blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `cropped-${fileName.replace('.json', '')}.gif`;
                link.click();
                URL.revokeObjectURL(url);
                anim.destroy();
                container.remove();
                toast.dismiss(toastId);
                toast.success("GIF exported successfully!");
                onClose();
            });

            gif.render();
        } catch (error) {
            console.error('GIF export error:', error);
            toast.dismiss(toastId);
            toast.error("Failed to export GIF");
        }
    };

    const handleVideoDownload = async () => {
        const json = viewMode === 'preview' ? croppedJson : getCroppedLottie();
        if (!json) return;

        const toastId = toast.loading("Generating Video from cropped animation...");

        try {
            const width = json.w || 500;
            const height = json.h || 500;
            const fps = 30;

            // Create hidden container
            const container = document.createElement('div');
            container.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${width}px;height:${height}px;overflow:hidden;`;
            document.body.appendChild(container);

            // Load animation
            const anim = lottie.loadAnimation({
                container,
                renderer: 'svg',
                loop: false,
                autoplay: false,
                animationData: JSON.parse(JSON.stringify(json)),
            });

            await new Promise(resolve => {
                if (anim.isLoaded) resolve(null);
                else anim.addEventListener('DOMLoaded', resolve);
            });
            await new Promise(r => setTimeout(r, 300));

            // Setup canvas for recording
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;

            // Record using MediaRecorder
            const stream = canvas.captureStream(fps);
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `cropped-${fileName.replace('.json', '')}.webm`;
                link.click();
                URL.revokeObjectURL(url);
                anim.destroy();
                container.remove();
                toast.dismiss(toastId);
                toast.success("Video exported successfully!");
                onClose();
            };

            mediaRecorder.start();

            const totalFrames = anim.totalFrames;
            const duration = totalFrames / anim.frameRate;
            const outputFrames = Math.floor(duration * fps);

            // Render frames
            for (let i = 0; i < outputFrames; i++) {
                const frame = (i / fps) * anim.frameRate;
                anim.goToAndStop(frame, true);

                // Rasterize SVG
                const svg = container.querySelector('svg');
                if (svg) {
                    svg.setAttribute('width', String(width));
                    svg.setAttribute('height', String(height));
                    const svgString = new XMLSerializer().serializeToString(svg);
                    const blob = new Blob([svgString], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                        const img = new window.Image();
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = url;
                    });
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    URL.revokeObjectURL(url);
                }

                await new Promise(r => setTimeout(r, 1000 / fps));
            }

            mediaRecorder.stop();
        } catch (error) {
            console.error('Video export error:', error);
            toast.dismiss(toastId);
            toast.error("Failed to export Video");
        }
    };

    // Custom Handle Styles
    const handleBaseStyle = {
        width: '12px',
        height: '12px',
        background: '#3d88ff', // Blue
        borderRadius: '50%',
        border: '2px solid white',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
        zIndex: 50
    };

    const cornerHandleStyle = {
        ...handleBaseStyle,
        width: '14px',
        height: '14px',
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-950/95 border-zinc-800">
                <DialogHeader className="flex-row items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                    <DialogTitle className="flex items-center gap-2 text-zinc-100">
                        <span>Crop Animation</span>
                        {viewMode === 'preview' && (
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20">
                                Preview Mode
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/40 min-h-[500px] overflow-auto">
                    <div
                        className="relative shadow-2xl bg-zinc-900/50" // Added bg to avoid total black if lottie fails or is transparent
                        style={{
                            width: viewMode === 'preview' ? 'auto' : containerSize.w,
                            height: viewMode === 'preview' ? 'auto' : containerSize.h,
                            maxWidth: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {/* Lottie Container */}
                        <div
                            ref={containerRef}
                            style={{
                                width: viewMode === 'preview' ? (croppedJson?.w * previewScale) : '100%',
                                height: viewMode === 'preview' ? (croppedJson?.h * previewScale) : '100%',
                            }}
                            // Removed opacity-60 to make it clear and playing
                            className="bg-white/5"
                        />

                        {/* Draggable Crop Box - React RND (Only in Edit Mode) */}
                        {viewMode === 'edit' && (
                            <Rnd
                                size={{ width: crop.w, height: crop.h }}
                                position={{ x: crop.x, y: crop.y }}
                                onDragStop={(_e, d) => setCrop(c => ({ ...c, x: d.x, y: d.y }))}
                                onResizeStop={(_e, _direction, ref, _delta, position) => {
                                    setCrop({
                                        w: parseInt(ref.style.width),
                                        h: parseInt(ref.style.height),
                                        ...position,
                                    });
                                }}
                                bounds="parent"
                                className="z-10"
                                resizeHandleStyles={{
                                    topLeft: { ...cornerHandleStyle, left: -6, top: -6 },
                                    topRight: { ...cornerHandleStyle, right: -6, top: -6 },
                                    bottomLeft: { ...cornerHandleStyle, left: -6, bottom: -6 },
                                    bottomRight: { ...cornerHandleStyle, right: -6, bottom: -6 },
                                    top: { ...handleBaseStyle, top: -6, left: '50%', marginLeft: -6, opacity: 0 },
                                    right: { ...handleBaseStyle, right: -6, top: '50%', marginTop: -6, opacity: 0 },
                                    bottom: { ...handleBaseStyle, bottom: -6, left: '50%', marginLeft: -6, opacity: 0 },
                                    left: { ...handleBaseStyle, left: -6, top: '50%', marginTop: -6, opacity: 0 },
                                }}
                            >
                                {/* Dashed Border Box and Overlay */}
                                <div className="w-full h-full border-2 border-dashed border-[#3d88ff] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move group">
                                    {/* Center Label */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#3d88ff] text-white text-[10px] px-1.5 py-0.5 rounded-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {Math.round(crop.w / previewScale)} x {Math.round(crop.h / previewScale)}
                                    </div>
                                </div>
                            </Rnd>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center p-4 border-t border-zinc-800 bg-zinc-900/50">
                    <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-zinc-100">Cancel</Button>

                    <div className="flex gap-2">
                        {viewMode === 'preview' ? (
                            <Button variant="outline" onClick={() => setViewMode('edit')} className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Edit Crop
                            </Button>
                        ) : (
                            <Button variant="secondary" onClick={handlePreview} className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700">
                                <Eye className="w-4 h-4 mr-2" />
                                Preview Crop
                            </Button>
                        )}

                        <Button onClick={handleDownload} className="bg-[#3d88ff] hover:bg-[#3d88ff]/90 text-white">
                            <Download className="w-4 h-4 mr-2" />
                            Lottie
                        </Button>

                        <Button onClick={handleGifDownload} variant="secondary" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Image className="w-4 h-4 mr-2" />
                            GIF
                        </Button>

                        <Button onClick={handleVideoDownload} variant="secondary" className="bg-purple-600 hover:bg-purple-700 text-white">
                            <Film className="w-4 h-4 mr-2" />
                            Video
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};


import { useState, useRef, useEffect } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { Rnd } from "react-rnd";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, RotateCcw } from "lucide-react";
import { useLottieStore } from "@/store/useLottieStore";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
                            {viewMode === 'preview' ? "Download This Crop" : "Download Cropped Lottie"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

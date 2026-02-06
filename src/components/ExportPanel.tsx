import { useState, useEffect } from 'react';
import { useLottieStore } from '@/store/useLottieStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileJson, Film, Image as ImageIcon, Loader2, Package } from 'lucide-react';
import lottie from 'lottie-web';
import GIF from 'gif.js';
import JSZip from 'jszip';
import { toast } from 'sonner';

import { ExportSuccessSupport } from './ExportSuccessSupport';

export const ExportPanel = () => {
    const lottieData = useLottieStore((state) => state.lottie);
    const fileName = useLottieStore((state) => state.fileName);
    const hasExportedThisSession = useLottieStore((state) => state.hasExportedThisSession);
    const markExported = useLottieStore((state) => state.markExported);

    const [activeTab, setActiveTab] = useState<'json' | 'lottie' | 'gif' | 'video'>('json');
    const [isExporting, setIsExporting] = useState(false);
    const [minify, setMinify] = useState(false);
    const [resolution, setResolution] = useState(1);
    const [fps, setFps] = useState(30);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [showSupportForThisExport, setShowSupportForThisExport] = useState(false);
    // const [halo, setHalo] = useState("#000000"); // Future

    // Reset success state on new edits
    useEffect(() => {
        setExportSuccess(false);
        setShowSupportForThisExport(false);
    }, [lottieData, activeTab]);

    const handleSuccess = () => {
        // Only show support if we haven't exported in this session yet
        if (!hasExportedThisSession) {
            setShowSupportForThisExport(true);
            markExported();
        } else {
            setShowSupportForThisExport(false);
        }
        setExportSuccess(true);
    };

    // --- JSON Export ---
    const handleJsonExport = () => {
        if (!lottieData) return;
        let content = JSON.stringify(lottieData, null, 2);
        if (minify) {
            content = JSON.stringify(lottieData);
        }
        downloadBlob(new Blob([content], { type: 'application/json' }), `edited-${fileName}`);
        toast.success("JSON exported successfully");
        handleSuccess();
    };

    // --- .Lottie Export ---
    const handleLottieExport = async () => {
        if (!lottieData) return;
        setIsExporting(true);

        try {
            const zip = new JSZip();
            const animationId = "animation_0";

            // 1. Manifest
            const manifest = {
                version: 1,
                generator: "Lotiq v1.0",
                animations: [
                    {
                        id: animationId,
                        speed: 1,
                        themeColor: "#ffffff",
                        loop: true
                    }
                ]
            };
            zip.file("manifest.json", JSON.stringify(manifest, null, 2));

            // 2. Animation (minified by default usually for .lottie, but sticking to standard)
            const animContent = JSON.stringify(lottieData);
            zip.file(`animations/${animationId}.json`, animContent);

            // 3. Generate Zip
            const content = await zip.generateAsync({ type: "blob" });

            downloadBlob(content, `${fileName.replace('.json', '')}.lottie`);

            toast.success(".LOTTIE exported successfully");
            handleSuccess();
        } catch (e) {
            console.error(".LOTTIE Export Failed", e);
            toast.error("Failed to generate .lottie file");
        } finally {
            setIsExporting(false);
        }
    };

    // --- Media Helpers ---
    const setupHiddenCanvas = (scale: number) => {
        if (!lottieData) return null;
        const width = lottieData.w * scale;
        const height = lottieData.h * scale;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        return { canvas, width, height };
    };

    // --- GIF Export ---
    const handleGifExport = async () => {
        if (!lottieData) return;
        setIsExporting(true);
        const toastId = toast.loading("Generating GIF...");

        try {
            // Check if gif.worker.js exists
            const workerCheck = await fetch('/gif.worker.js');
            if (!workerCheck.ok) {
                throw new Error("GIF worker script not found at /gif.worker.js");
            }

            const { canvas, width, height } = setupHiddenCanvas(resolution)!;

            // Deep clone to prevent "Object not extensible" error since lottie-web mutates the input
            const animationDataClone = JSON.parse(JSON.stringify(lottieData));

            const anim = lottie.loadAnimation({
                container: document.createElement('div'), // wrapper
                renderer: 'canvas',
                loop: false,
                autoplay: false,
                animationData: animationDataClone,
                rendererSettings: {
                    context: canvas.getContext('2d')!,
                    clearCanvas: false, // We clear manually
                    preserveAspectRatio: 'xMidYMid meet'
                }
            });

            // Wait for load, including assets
            await new Promise(resolve => {
                if (anim.isLoaded) resolve(null);
                else anim.addEventListener('DOMLoaded', resolve);
            });
            // Extra safety wait for images if any
            await new Promise(r => setTimeout(r, 500));

            const gif = new GIF({
                workers: 2,
                quality: 10,
                width,
                height,
                workerScript: '/gif.worker.js',
                background: '#ffffff' // Force white background for GIF
            });

            const totalFrames = anim.totalFrames;
            const duration = totalFrames / anim.frameRate; // seconds
            const totalOutputFrames = Math.floor(duration * fps);
            const ctx = canvas.getContext('2d')!;

            for (let i = 0; i < totalOutputFrames; i++) {
                const time = i / fps; // Current time in seconds
                // Convert to frame
                const frame = time * anim.frameRate;

                // 1. Clear and Fill White Background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);

                // 2. Render Frame
                anim.goToAndStop(frame, true);

                // 3. Add to GIF
                gif.addFrame(canvas, { copy: true, delay: 1000 / fps });

                // Allow UI to breathe
                await new Promise(r => setTimeout(r, 0));
            }

            gif.on('finished', (blob) => {
                downloadBlob(blob, `${fileName.replace('.json', '')}.gif`);
                setIsExporting(false);
                anim.destroy();
                toast.dismiss(toastId);
                toast.success("GIF exported successfully");
                handleSuccess();
            });

            gif.on('abort', () => {
                setIsExporting(false);
                toast.dismiss(toastId);
                toast.error("GIF export aborted");
            });

            gif.render();

        } catch (e: any) {
            console.error("GIF Export Failed", e);
            // Try to extract lottie web error
            const msg = e?.message || "Unknown error";
            setIsExporting(false);
            toast.dismiss(toastId);
            toast.error(`GIF export failed: ${msg}`);
        }
    };

    // --- Video Export ---
    const handleVideoExport = async () => {
        if (!lottieData) return;
        setIsExporting(true);
        const toastId = toast.loading("Recording Video...");

        try {
            const { canvas, width, height } = setupHiddenCanvas(resolution)!;
            // We need to append canvas to DOM for CaptureStream to work reliably in some browsers, 
            // but usually strictly hidden works for Chrome.

            // Deep clone to prevent "Object not extensible" error
            const animationDataClone = JSON.parse(JSON.stringify(lottieData));

            const anim = lottie.loadAnimation({
                container: document.createElement('div'), // wrapper
                renderer: 'canvas',
                loop: false,
                autoplay: false,
                animationData: animationDataClone,
                rendererSettings: {
                    context: canvas.getContext('2d')!,
                    clearCanvas: false, // Lottie clears. 
                    preserveAspectRatio: 'xMidYMid meet'
                }
            });

            await new Promise(resolve => {
                if (anim.isLoaded) resolve(null);
                else anim.addEventListener('DOMLoaded', resolve);
            });
            // Extra safety wait for images
            await new Promise(r => setTimeout(r, 500));

            const stream = canvas.captureStream(fps);
            const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                downloadBlob(blob, `${fileName.replace('.json', '')}.webm`);
                setIsExporting(false);
                anim.destroy();

                // Stop rendering loop
                if (renderLoopId) cancelAnimationFrame(renderLoopId);

                toast.dismiss(toastId);
                toast.success("Video exported successfully");
                handleSuccess();
            };

            // Custom Render Loop to ensure background
            const ctx = canvas.getContext('2d')!;
            let renderLoopId: number;

            const renderLoop = () => {
                // We can't easily intercept the internal lottie render loop but 
                // we can try to fill background before next paint if valid.
                // Actually, Lottie clears the canvas. 
                // For video, 'clearCanvas: false' in settings might help if we fill white once,
                // but lottie needs to clear previous frame.
                // Best approach for video: Composite.
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.globalCompositeOperation = 'source-over';

                renderLoopId = requestAnimationFrame(renderLoop);
            };
            renderLoop(); // Start forcing background

            recorder.onerror = (e) => {
                console.error("Recorder Error", e);
                toast.dismiss(toastId);
                toast.error("Video recording failed");
            }

            recorder.start();

            // Play exactly duration
            const durationInMs = (anim.totalFrames / anim.frameRate) * 1000;
            anim.play(); // Realtime playback

            // Wait
            setTimeout(() => {
                recorder.stop();
                anim.stop();
            }, durationInMs + 100); // 100ms buffer

        } catch (e: any) {
            console.error("Video Export Failed", e);
            const msg = e?.message || "Unknown error";
            setIsExporting(false);
            toast.dismiss(toastId);
            toast.error(`Video export failed: ${msg}`);
        }
    };

    const downloadBlob = (blob: Blob, name: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    // Calculate JSON size
    const getJsonSize = () => {
        if (!lottieData) return null;
        const content = minify ? JSON.stringify(lottieData) : JSON.stringify(lottieData, null, 2);
        return formatBytes(new Blob([content]).size);
    };

    // Calculate Estimated Size
    const getEstimatedSize = () => {
        if (!lottieData) return null;

        const duration = (lottieData.op - lottieData.ip) / lottieData.fr;
        const width = lottieData.w * resolution;
        const height = lottieData.h * resolution;
        const pixels = width * height;
        const outFrames = duration * fps;

        let estimatedBytes = 0;

        if (activeTab === 'gif') {
            // GIF Heuristic: 1 byte per pixel, ~30% compression (conservative)
            estimatedBytes = pixels * outFrames * 0.35;
        } else if (activeTab === 'video') {
            // WebM Bitrate Heuristic
            let bitrate = 2500000; // 2.5 Mbps default
            if (pixels <= 480 * 360) bitrate = 1000000;
            else if (pixels >= 1920 * 1080) bitrate = 5000000;

            // bits -> bytes
            estimatedBytes = (bitrate * duration) / 8;
        }

        return formatBytes(estimatedBytes);
    };

    const getExportLabel = () => {
        if (!lottieData) return '';
        const dims = `${Math.round(lottieData.w * resolution)}x${Math.round(lottieData.h * resolution)}`;
        const size = getEstimatedSize();
        return `(${dims} • ~${size})`;
    };

    if (!lottieData) return null;

    return (
        <div className="p-4 border-t border-border mt-auto bg-muted/30">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Export</h3>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
                {(['json', 'lottie', 'gif', 'video'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${activeTab === tab
                            ? "bg-background shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'json' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Minify JSON</Label>
                            <input
                                type="checkbox"
                                checked={minify}
                                onChange={(e) => setMinify(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                        </div>
                        <Button className="w-full" onClick={handleJsonExport}>
                            <FileJson className="mr-2 size-4" />
                            Export JSON <span className="ml-1 opacity-60 text-[10px]">({getJsonSize()})</span>
                        </Button>
                    </div>
                )}

                {activeTab === 'lottie' && (
                    <div className="space-y-4">
                        <p className="text-[10px] text-muted-foreground text-center px-4">
                            Exports a compressed .lottie file containing the animation and manifest.
                            Supported by all modern Lottie players.
                        </p>
                        <Button className="w-full" onClick={handleLottieExport} disabled={isExporting}>
                            {isExporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Package className="mr-2 size-4" />}
                            {isExporting ? "Processing..." : "Export .LOTTIE"}
                        </Button>
                    </div>
                )}

                {(activeTab === 'gif' || activeTab === 'video') && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground uppercase">Resolution</Label>
                                <select
                                    className="w-full text-xs h-8 bg-background border px-2 rounded-md"
                                    value={resolution}
                                    onChange={(e) => setResolution(parseFloat(e.target.value))}
                                >
                                    <option value={0.5}>0.5x</option>
                                    <option value={1}>1x</option>
                                    <option value={1.5}>1.5x</option>
                                    <option value={2}>2x</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground uppercase">Framerate</Label>
                                <select
                                    className="w-full text-xs h-8 bg-background border px-2 rounded-md"
                                    value={fps}
                                    onChange={(e) => setFps(parseInt(e.target.value))}
                                >
                                    <option value={24}>24 FPS</option>
                                    <option value={30}>30 FPS</option>
                                    <option value={60}>60 FPS</option>
                                </select>
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            onClick={activeTab === 'gif' ? handleGifExport : handleVideoExport}
                            disabled={isExporting}
                        >
                            {isExporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : (
                                activeTab === 'gif' ? <ImageIcon className="mr-2 size-4" /> : <Film className="mr-2 size-4" />
                            )}
                            {isExporting
                                ? 'Processing...'
                                : <>Export {activeTab.toUpperCase()} <span className="ml-1 opacity-60 text-[10px]">{getExportLabel()}</span></>
                            }
                        </Button>

                        {/* Note about background processing */}
                        {isExporting && (
                            <p className="text-[10px] text-muted-foreground text-center animate-pulse">
                                This may take a moment. Please wait.
                            </p>
                        )}
                    </div>
                )}

                {exportSuccess && <ExportSuccessSupport showSupport={showSupportForThisExport} />}
            </div>
        </div>
    );
};

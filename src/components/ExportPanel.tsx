import { useState, useEffect } from 'react';
import { useLottieStore } from '@/store/useLottieStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileJson, Film, Image as ImageIcon, Loader2, Package } from 'lucide-react';
import lottie from 'lottie-web';
import GIF from 'gif.js';
import JSZip from 'jszip';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { toast } from 'sonner';

import { ExportSuccessSupport } from './ExportSuccessSupport';

export const ExportPanel = () => {
    const lottieData = useLottieStore((state) => state.lottie);
    const fileName = useLottieStore((state) => state.fileName);
    const hasExportedThisSession = useLottieStore((state) => state.hasExportedThisSession);
    const markExported = useLottieStore((state) => state.markExported);

    const isExporting = useLottieStore((state) => state.isExporting);
    const setIsExporting = useLottieStore((state) => state.setIsExporting);
    const setExportProgress = useLottieStore((state) => state.setExportProgress);
    const setExportStatus = useLottieStore((state) => state.setExportStatus);

    const [activeTab, setActiveTab] = useState<'json' | 'lottie' | 'gif' | 'video'>('json');
    // const [isExporting, setIsExporting] = useState(false); // Removed local state
    const [minify, setMinify] = useState(false);
    const [resolution, setResolution] = useState(1); // Scale for GIF
    const [videoQuality, setVideoQuality] = useState<'144p' | '360p' | '480p' | '720p' | '1080p'>('720p');
    const [videoFormat, setVideoFormat] = useState<'webm' | 'mp4'>('webm'); // WebM is instant, MP4 is slow
    const [fps, setFps] = useState(30);

    // Quality presets (height in pixels)
    const qualityPresets = {
        '144p': 144,
        '360p': 360,
        '480p': 480,
        '720p': 720,
        '1080p': 1080
    };

    // Calculate scale for video based on quality preset
    const getVideoScale = () => {
        if (!lottieData) return 1;
        const targetHeight = qualityPresets[videoQuality];
        return targetHeight / lottieData.h;
    };
    const [exportSuccess, setExportSuccess] = useState(false);
    const [showSupportForThisExport, setShowSupportForThisExport] = useState(false);

    // FFmpeg ref
    const ffmpegRef = useState(new FFmpeg())[0];

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

    // --- GIF Export (using SVG renderer + rasterization) ---
    const handleGifExport = async () => {
        if (!lottieData) return;
        setIsExporting(true);
        const toastId = toast.loading("Generating GIF...");

        // Elements to cleanup
        let container: HTMLDivElement | null = null;
        let anim: any = null;

        try {
            // Check if gif.worker.js exists
            const workerCheck = await fetch('/gif.worker.js');
            if (!workerCheck.ok) {
                throw new Error("GIF worker script not found at /gif.worker.js");
            }

            const { canvas, width, height } = setupHiddenCanvas(resolution)!;
            const ctx = canvas.getContext('2d')!;

            // Deep clone to prevent mutation
            const animationDataClone = JSON.parse(JSON.stringify(lottieData));

            // Create a visible container for SVG renderer (must be in DOM with dimensions)
            container = document.createElement('div');
            container.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${width}px;height:${height}px;overflow:hidden;pointer-events:none;`;
            document.body.appendChild(container);

            // Use SVG renderer (same as Player component - WORKS)
            anim = lottie.loadAnimation({
                container: container,
                renderer: 'svg',  // SVG renderer works correctly!
                loop: false,
                autoplay: false,
                animationData: animationDataClone,
            });

            // Wait for load
            await new Promise(resolve => {
                if (anim.isLoaded) resolve(null);
                else anim.addEventListener('DOMLoaded', resolve);
            });
            await new Promise(r => setTimeout(r, 500));

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
            const totalOutputFrames = Math.floor(duration * fps);

            // Helper to rasterize SVG to canvas
            const rasterizeSvgToCanvas = (): Promise<void> => {
                return new Promise((resolve, reject) => {
                    const svgElement = container!.querySelector('svg');
                    if (!svgElement) {
                        reject(new Error('SVG element not found'));
                        return;
                    }

                    // Set SVG dimensions explicitly
                    svgElement.setAttribute('width', String(width));
                    svgElement.setAttribute('height', String(height));

                    const svgString = new XMLSerializer().serializeToString(svgElement);
                    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(blob);

                    const img = new Image();
                    img.onload = () => {
                        // Clear and draw white background
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, width, height);
                        // Draw the SVG
                        ctx.drawImage(img, 0, 0, width, height);
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(url);
                        reject(new Error('Failed to load SVG image'));
                    };
                    img.src = url;
                });
            };

            for (let i = 0; i < totalOutputFrames; i++) {
                const time = i / fps;
                const frame = time * anim.frameRate;

                // 1. Go to frame
                anim.goToAndStop(frame, true);

                // 2. Rasterize SVG to canvas
                await rasterizeSvgToCanvas();

                // 3. Add to GIF
                gif.addFrame(canvas, { copy: true, delay: 1000 / fps });

                // 4. Update progress (0-50% for rendering, 50-100% for encoding)
                setExportProgress((i / totalOutputFrames) * 0.5);

                // Allow UI to breathe
                if (i % 5 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            // GIF.js handles the encoding phase - we'll set 50% here
            setExportProgress(0.5);

            gif.on('finished', (blob) => {
                downloadBlob(blob, `${fileName.replace('.json', '')}.gif`);
                setExportProgress(1); // Set progress to 100%
                setIsExporting(false);
                if (anim) anim.destroy();
                if (container && container.parentNode) container.parentNode.removeChild(container);
                toast.dismiss(toastId);
                toast.success("GIF exported successfully");
                handleSuccess();
            });

            gif.on('abort', () => {
                setIsExporting(false);
                if (anim) anim.destroy();
                if (container && container.parentNode) container.parentNode.removeChild(container);
                toast.dismiss(toastId);
                toast.error("GIF export aborted");
            });

            gif.render();

        } catch (e: any) {
            console.error("GIF Export Failed", e);
            const msg = e?.message || "Unknown error";
            setIsExporting(false);
            if (anim) anim.destroy();
            if (container && container.parentNode) container.parentNode.removeChild(container);
            toast.dismiss(toastId);
            toast.error(`GIF export failed: ${msg}`);
        }
    };

    // --- FFmpeg Helper ---
    const loadFfmpeg = async () => {
        const ffmpeg = ffmpegRef;

        // Use jsdelivr CDN (often faster than unpkg)
        const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';

        // Progress Listener for transcoding
        ffmpeg.on('progress', ({ progress }) => {
            // Progress during transcoding: map 0.5-1.0 (second half)
            const mappedProgress = 0.5 + (progress * 0.5);
            setExportProgress(Math.max(0.5, Math.min(1, mappedProgress)));
        });

        // Log for debugging
        ffmpeg.on('log', ({ message }) => {
            console.log('[FFmpeg]', message);
        });

        try {
            setExportStatus("Downloading FFmpeg (first time only)...");

            // Fetch with timeout for better error handling
            const fetchWithTimeout = async (url: string, type: string, timeoutMs = 60000) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                try {
                    const response = await fetch(url, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${url}: ${response.status}`);
                    }

                    const blob = await response.blob();
                    return URL.createObjectURL(new Blob([blob], { type }));
                } catch (e: any) {
                    clearTimeout(timeoutId);
                    if (e.name === 'AbortError') {
                        throw new Error('FFmpeg download timed out. Please try again.');
                    }
                    throw e;
                }
            };

            const coreURL = await fetchWithTimeout(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
            setExportStatus("Downloading FFmpeg WASM...");
            const wasmURL = await fetchWithTimeout(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

            setExportStatus("Initializing FFmpeg...");
            await ffmpeg.load({ coreURL, wasmURL });

        } catch (error: any) {
            console.error('FFmpeg load error:', error);
            throw new Error(`Failed to load FFmpeg: ${error.message}`);
        }
    };

    const transcodeWebmToMp4 = async (webmBlob: Blob): Promise<Blob> => {
        const ffmpeg = ffmpegRef;
        if (!ffmpeg.loaded) {
            setExportStatus("Loading FFmpeg Core...");
            await loadFfmpeg();
        }

        const inputName = 'input.webm';
        const outputName = 'output.mp4';

        setExportStatus("Writing file...");
        await ffmpeg.writeFile(inputName, await fetchFile(webmBlob));

        // Transcode
        setExportStatus("Transcoding to MP4...");
        // -c:v libx264 is standard. 
        // -preset ultrafast for speed.
        // -pix_fmt yuv420p for compatibility.
        await ffmpeg.exec(['-i', inputName, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', outputName]);

        setExportStatus("Finalizing...");
        const data = await ffmpeg.readFile(outputName);
        return new Blob([(data as Uint8Array).buffer as ArrayBuffer], { type: 'video/mp4' });
    };


    // --- Video Export (WebM/MP4) - Using SVG renderer + rasterization ---
    const handleVideoExport = async () => {
        if (!lottieData) return;
        setIsExporting(true);
        setExportProgress(0);
        setExportStatus("Initializing...");

        // Elements to cleanup
        let container: HTMLDivElement | null = null;
        let anim: any = null;

        try {
            setExportStatus("Setting up Canvas...");
            const videoScale = getVideoScale();
            const { canvas, width, height } = setupHiddenCanvas(videoScale)!;
            const ctx = canvas.getContext('2d')!;

            // Deep clone
            const animationDataClone = JSON.parse(JSON.stringify(lottieData));

            // Create container with proper dimensions for SVG renderer
            container = document.createElement('div');
            container.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${width}px;height:${height}px;overflow:hidden;pointer-events:none;`;
            document.body.appendChild(container);

            // Use SVG renderer (same as Player component - WORKS)
            anim = lottie.loadAnimation({
                container: container,
                renderer: 'svg',  // SVG renderer works correctly!
                loop: false,
                autoplay: false,
                animationData: animationDataClone,
            });

            setExportStatus("Loading Animation...");
            await new Promise(resolve => {
                if (anim.isLoaded) resolve(null);
                else anim.addEventListener('DOMLoaded', resolve);
            });
            await new Promise(r => setTimeout(r, 500));

            setExportStatus("Rendering Frames...");

            // Frame-by-frame rendering
            const totalFrames = anim.totalFrames;
            const duration = totalFrames / anim.frameRate;
            const totalOutputFrames = Math.ceil(duration * fps);

            // Helper to rasterize SVG to canvas
            const rasterizeSvgToCanvas = (): Promise<void> => {
                return new Promise((resolve, reject) => {
                    const svgElement = container!.querySelector('svg');
                    if (!svgElement) {
                        reject(new Error('SVG element not found'));
                        return;
                    }

                    svgElement.setAttribute('width', String(width));
                    svgElement.setAttribute('height', String(height));

                    const svgString = new XMLSerializer().serializeToString(svgElement);
                    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(blob);

                    const img = new Image();
                    img.onload = () => {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, width, height);
                        ctx.drawImage(img, 0, 0, width, height);
                        URL.revokeObjectURL(url);
                        resolve();
                    };
                    img.onerror = () => {
                        URL.revokeObjectURL(url);
                        reject(new Error('Failed to load SVG image'));
                    };
                    img.src = url;
                });
            };

            // Collect all frames as data URLs
            const frames: string[] = [];

            for (let i = 0; i < totalOutputFrames; i++) {
                const time = i / fps;
                const frame = time * anim.frameRate;

                anim.goToAndStop(frame, true);
                await rasterizeSvgToCanvas();

                frames.push(canvas.toDataURL('image/webp', 0.95));

                const progress = (i / totalOutputFrames) * 0.5;
                setExportProgress(progress);

                if (i % 5 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            anim.destroy();
            if (container && container.parentNode) container.parentNode.removeChild(container);
            container = null;
            anim = null;
            setExportStatus("Encoding Video...");

            // Use canvas-based video encoding with MediaRecorder
            // Create a visible canvas temporarily for MediaRecorder to work
            const videoCanvas = document.createElement('canvas');
            videoCanvas.width = width;
            videoCanvas.height = height;
            // Make it visible but off-screen
            videoCanvas.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1;';
            document.body.appendChild(videoCanvas);
            const videoCtx = videoCanvas.getContext('2d')!;

            const stream = videoCanvas.captureStream(fps);
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm',
                videoBitsPerSecond: 2500000
            });
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            const recordingComplete = new Promise<Blob>((resolve, reject) => {
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'video/webm' });
                    resolve(blob);
                };
                recorder.onerror = (e) => reject(e);
            });

            recorder.start();

            // Draw each frame to the video canvas
            const frameDelay = 1000 / fps;
            for (let i = 0; i < frames.length; i++) {
                // Load the frame image
                const img = new Image();
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = reject;
                    img.src = frames[i];
                });

                // Draw to video canvas
                videoCtx.drawImage(img, 0, 0);

                // Update progress (50-100% for encoding phase)
                const progress = 0.5 + (i / frames.length) * 0.5;
                setExportProgress(progress);

                // Wait for frame duration
                await new Promise(r => setTimeout(r, frameDelay));
            }

            recorder.stop();
            setExportStatus("Finalizing...");
            const webmBlob = await recordingComplete;

            // Cleanup
            document.body.removeChild(videoCanvas);

            if (videoFormat === 'webm') {
                downloadBlob(webmBlob, `${fileName.replace('.json', '')}.webm`);
                toast.success("WebM exported successfully");
            } else {
                const mp4Blob = await transcodeWebmToMp4(webmBlob);
                downloadBlob(mp4Blob, `${fileName.replace('.json', '')}.mp4`);
                toast.success("MP4 exported successfully");
            }

            setExportProgress(1);
            handleSuccess();

        } catch (e: any) {
            console.error("Video Export Failed", e);
            toast.error(`Video export failed: ${e?.message || "Unknown error"}`);
        } finally {
            setIsExporting(false);
            setExportStatus("Completed");
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
                            {activeTab === 'gif' ? (
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
                            ) : (
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-muted-foreground uppercase">Quality</Label>
                                    <select
                                        className="w-full text-xs h-8 bg-background border px-2 rounded-md"
                                        value={videoQuality}
                                        onChange={(e) => setVideoQuality(e.target.value as any)}
                                    >
                                        <option value="144p">144p (Fastest)</option>
                                        <option value="360p">360p</option>
                                        <option value="480p">480p</option>
                                        <option value="720p">720p (HD)</option>
                                        <option value="1080p">1080p (Full HD)</option>
                                    </select>
                                </div>
                            )}
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

                        {/* Format selector for video only */}
                        {activeTab === 'video' && (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-muted-foreground uppercase">Format</Label>
                                <select
                                    className="w-full text-xs h-8 bg-background border px-2 rounded-md"
                                    value={videoFormat}
                                    onChange={(e) => setVideoFormat(e.target.value as any)}
                                >
                                    <option value="webm">WebM (⚡ Fast - Recommended)</option>
                                    <option value="mp4">MP4 (🐢 Slow - Better Compatibility)</option>
                                </select>
                                {videoFormat === 'mp4' && (
                                    <p className="text-[9px] text-orange-500">
                                        ⚠️ MP4 requires downloading ~30MB and slow transcoding
                                    </p>
                                )}
                            </div>
                        )}

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
                                : <>Export {activeTab === 'video' ? videoFormat.toUpperCase() : activeTab.toUpperCase()} <span className="ml-1 opacity-60 text-[10px]">{getExportLabel()}</span></>
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

import { useState, useEffect } from 'react';
import { useLottieStore } from '@/store/useLottieStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import lottie from 'lottie-web';
import GIF from 'gif.js';
import JSZip from 'jszip';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { ChevronDown, ChevronRight, FileJson, Film, Image as ImageIcon, Loader2, Package, Upload } from 'lucide-react';
import { ExportSuccessSupport } from './ExportSuccessSupport';
import { SocialExportModal } from './SocialExportModal';

export const ExportPanel = () => {
    const lottieData = useLottieStore((state) => state.lottie);
    const fileName = useLottieStore((state) => state.fileName);
    const hasExportedThisSession = useLottieStore((state) => state.hasExportedThisSession);
    const markExported = useLottieStore((state) => state.markExported);

    const isExporting = useLottieStore((state) => state.isExporting);
    const setIsExporting = useLottieStore((state) => state.setIsExporting);
    const exportProgress = useLottieStore((state) => state.exportProgress);
    const setExportProgress = useLottieStore((state) => state.setExportProgress);
    const setExportStatus = useLottieStore((state) => state.setExportStatus);

    const isSocialModalOpen = useLottieStore((state) => state.isSocialModalOpen);
    const setSocialModalOpen = useLottieStore((state) => state.setSocialModalOpen);

    const [activeTab, setActiveTab] = useState<'json' | 'lottie' | 'gif' | 'video'>('json');
    const [minify, setMinify] = useState(false);
    const [resolution, setResolution] = useState(1); // Scale for GIF
    const [videoQuality, setVideoQuality] = useState<'144p' | '360p' | '480p' | '720p' | '1080p'>('720p');
    const [videoFormat, setVideoFormat] = useState<'webm' | 'mp4'>('webm'); // WebM is instant, MP4 is slow
    const [fps, setFps] = useState(30);
    const [isExportExpanded, setIsExportExpanded] = useState(true);

    // --- Social / Mockup State (via Store) ---
    const socialSettings = useLottieStore((state) => state.socialSettings);


    const {
        preset: socialPreset,
        resolution: socialResolution,
        bgColor: socialBgColor,
        padding: socialPadding
    } = socialSettings;

    // Quality presets (height in pixels)
    const qualityPresets = {
        '144p': 144,
        '360p': 360,
        '480p': 480,
        '720p': 720,
        '1080p': 1080
    };

    const socialPresets = {
        'square': { w: 1, h: 1, label: '1:1 (Square)' },
        'portrait': { w: 4, h: 5, label: '4:5 (Portrait)' }, // Swapped to match user expectation
        'vertical': { w: 9, h: 16, label: '9:16 (Vertical)' }, // Swapped to match user expectation
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
        // For development/debugging, we want to see it every time to check styling
        setShowSupportForThisExport(true);
        // if (!hasExportedThisSession) {
        //     setShowSupportForThisExport(true);
        //     markExported();
        // } else {
        //     setShowSupportForThisExport(false);
        // }
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
            const totalOutputFrames = Math.floor(duration * fps);

            // Helper to rasterize SVG to canvas at full resolution
            const rasterizeSvgToCanvas = (): Promise<void> => {
                return new Promise((resolve, reject) => {
                    const svgElement = container!.querySelector('svg');
                    if (!svgElement) {
                        reject(new Error('SVG element not found'));
                        return;
                    }

                    // Set viewBox to original Lottie dimensions for proper vector scaling
                    svgElement.setAttribute('viewBox', `0 0 ${lottieData.w} ${lottieData.h}`);
                    // Set output dimensions to target resolution
                    svgElement.setAttribute('width', String(width));
                    svgElement.setAttribute('height', String(height));
                    // Ensure proper aspect ratio preservation
                    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

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

            gif.on('finished', (blob: Blob) => {
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
            const msg = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
            throw new Error(`Failed to load FFmpeg: ${msg}`);
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
        // -movflags +faststart to make it web-friendly
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

            // Helper to rasterize SVG to canvas at full resolution
            const rasterizeSvgToCanvas = (): Promise<void> => {
                return new Promise((resolve, reject) => {
                    const svgElement = container!.querySelector('svg');
                    if (!svgElement) {
                        reject(new Error('SVG element not found'));
                        return;
                    }

                    // Set viewBox to original Lottie dimensions for proper vector scaling
                    svgElement.setAttribute('viewBox', `0 0 ${lottieData.w} ${lottieData.h}`);
                    // Set output dimensions to target resolution
                    svgElement.setAttribute('width', String(width));
                    svgElement.setAttribute('height', String(height));
                    // Ensure proper aspect ratio preservation
                    svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');

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

            // FREE MEMORY IMMEDIATELY
            frames.length = 0; // Clear the huge array of frame strings

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

    // --- Social / Mockup Helpers ---
    const getSocialDimensions = () => {
        const ratio = socialPresets[socialPreset];
        let baseHeight = 1920;

        if (socialResolution === '720p') baseHeight = 1280;
        if (socialResolution === '4k') baseHeight = 3840;

        // For square/landscape, we might base on width instead to keep quality
        const height = baseHeight;
        const width = (height * ratio.w) / ratio.h;
        return { width: Math.round(width), height: Math.round(height) };
    };

    const drawPhoneMockup = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
        // iPhone 14/15 Pro style dimensions relative to width
        const cornerRadius = width * 0.12;
        const borderThickness = width * 0.025;
        const islandWidth = width * 0.3;
        const islandHeight = islandWidth * 0.25;

        // Shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = width * 0.1;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = width * 0.05;

        // Body
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, cornerRadius);
        ctx.fill();

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Screen (The "Hole")
        // Screen aspect ratio ~19.5:9
        const screenMargin = borderThickness;
        const screenW = width - (screenMargin * 2);
        const screenH = height - (screenMargin * 2);
        const screenX = x + screenMargin;
        const screenY = y + screenMargin;
        const screenRadius = cornerRadius - (borderThickness / 2);

        // We will clip to this region for the animation
        return { screenX, screenY, screenW, screenH, screenRadius, islandWidth, islandHeight };
    };

    const applyBackgroundToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number, bg: string) => {
        if (bg.startsWith('linear-gradient')) {
            try {
                // Parse linear-gradient(angle, start, end)
                // Regex matches: linear-gradient(180deg, #start 0%, #end 100%)
                const match = bg.match(/linear-gradient\((\d+)deg,\s*(.+?)(?:\s+\d+%)?,\s*(.+?)(?:\s+\d+%)?\)/);
                if (match) {
                    const angle = parseInt(match[1]);
                    const startColor = match[2];
                    const endColor = match[3];

                    // Convert CSS angle to radians (CSS 0deg is Up, Canvas 0rad is Right)
                    // CSS: 0deg = Top, 90deg = Right, 180deg = Bottom, 270deg = Left
                    // Canvas: 0 = Right, PI/2 = Bottom, PI = Left, 3PI/2 = Top
                    // Formula: rad = (angle - 90) * (Math.PI / 180)
                    const rad = (angle - 90) * (Math.PI / 180);

                    // Calculate gradient line for full coverage
                    const length = Math.sqrt(width * width + height * height);
                    const cx = width / 2;
                    const cy = height / 2;

                    const x0 = cx - Math.cos(rad) * length / 2;
                    const y0 = cy - Math.sin(rad) * length / 2;
                    const x1 = cx + Math.cos(rad) * length / 2;
                    const y1 = cy + Math.sin(rad) * length / 2;

                    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
                    grad.addColorStop(0, startColor);
                    grad.addColorStop(1, endColor);
                    ctx.fillStyle = grad;
                } else {
                    ctx.fillStyle = bg;
                }
            } catch (e) {
                console.warn("Gradient parse error during export", e);
                ctx.fillStyle = bg;
            }
        } else {
            ctx.fillStyle = bg;
        }
        ctx.fillRect(0, 0, width, height);
    };

    const handleSocialExport = async () => {
        if (!lottieData) return;
        setIsExporting(true);
        setExportProgress(0);
        setExportStatus("Initializing Social Export...");

        let container: HTMLDivElement | null = null;
        let anim: any = null;

        try {
            setExportStatus("Preparing Scene...");
            const { width: outWidth, height: outHeight } = getSocialDimensions();

            // Setup Output Canvas
            const canvas = document.createElement('canvas');
            canvas.width = outWidth;
            canvas.height = outHeight;
            const ctx = canvas.getContext('2d')!;

            // Deep clone animation data
            const animationDataClone = JSON.parse(JSON.stringify(lottieData));

            // Determine Animation Scale to fit in Phone Screen
            // Phone Logic:
            // Phone fits within canvas minus padding
            const safeAreaW = outWidth * (1 - (socialPadding / 100));
            const safeAreaH = outHeight * (1 - (socialPadding / 100));

            // Phone Aspect Ratio (iPhone roughly 9:19.5 or 0.46)
            const phoneAspect = 9 / 19.5;

            let phoneW, phoneH;

            // Logic must match Player.tsx layout logic for consistency
            // If container is wider than phone (landscape/square), constrain by Height
            const containerAspect = safeAreaW / safeAreaH;

            if (containerAspect > phoneAspect) {
                // Container is wider than phone -> Fit by Height
                phoneH = safeAreaH;
                phoneW = phoneH * phoneAspect;
            } else {
                // Container is taller/narrower -> Fit by Width
                phoneW = safeAreaW;
                phoneH = phoneW / phoneAspect;
            }

            const phoneX = (outWidth - phoneW) / 2;
            const phoneY = (outHeight - phoneH) / 2;

            // Prepare Lottie Renderer (Using SVG renderer for quality)
            // We render the lottie to a temp canvas or SVG at the dimensions of the PHONE SCREEN
            // First we need to know the phone screen size
            // Match Player.tsx: padding '2.5%' relative to phone width?
            // In Player.tsx, padding is 2.5%. which is 2.5% of the phone container's width?
            // Yes, padding: '2.5%'
            const borderThickness = phoneW * 0.025;
            const screenW = phoneW - (borderThickness * 2);
            const screenH = phoneH - (borderThickness * 2);

            container = document.createElement('div');
            container.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${Math.ceil(screenW)}px;height:${Math.ceil(screenH)}px;overflow:hidden;pointer-events:none;`;
            document.body.appendChild(container);

            anim = lottie.loadAnimation({
                container: container,
                renderer: 'svg',
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

            // Helper to rasterize SVG to image
            const rasterizeLottieFrame = async (): Promise<HTMLImageElement> => {
                const svgElement = container!.querySelector('svg');
                if (!svgElement) throw new Error("No SVG");

                svgElement.setAttribute('width', String(Math.ceil(screenW)));
                svgElement.setAttribute('height', String(Math.ceil(screenH)));

                const svgString = new XMLSerializer().serializeToString(svgElement);
                const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);

                const img = new Image();
                return new Promise((resolve, reject) => {
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = url;
                });
            };

            const totalFrames = anim.totalFrames;
            const duration = totalFrames / anim.frameRate;
            const totalOutputFrames = Math.ceil(duration * fps);

            setExportStatus("Rendering Composition...");
            const frames: string[] = [];

            for (let i = 0; i < totalOutputFrames; i++) {
                const time = i / fps;
                const frame = time * anim.frameRate;
                anim.goToAndStop(frame, true);

                const lottieImg = await rasterizeLottieFrame();

                // COMPOSITION
                // 1. Background (Gradient Aware)
                applyBackgroundToCanvas(ctx, outWidth, outHeight, socialBgColor);

                // 2. Draw Phone Body (Bottom Layer / Shadow)
                // Need to update drawPhoneMockup to match new % based rounding too?
                // drawPhoneMockup uses width * 0.12 for radius.
                // Player.tsx uses borderRadius: '12%'.
                // So it matches!
                const mock = drawPhoneMockup(ctx, phoneX, phoneY, phoneW, phoneH);

                // 3. Draw Screen Content (Clipped)
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(mock.screenX, mock.screenY, mock.screenW, mock.screenH, mock.screenRadius);
                ctx.clip();

                // Draw black BG for screen
                ctx.fillStyle = '#000000';
                ctx.fillRect(mock.screenX, mock.screenY, mock.screenW, mock.screenH);

                // Draw Lottie (Centered/Contained)
                ctx.drawImage(lottieImg, mock.screenX, mock.screenY, mock.screenW, mock.screenH);

                ctx.restore();

                // 4. Draw Dynamic Island / Notch
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                const islandX = mock.screenX + (mock.screenW - mock.islandWidth) / 2;
                const islandY = mock.screenY + (mock.screenW * 0.05); // Top margin relative to width
                ctx.roundRect(islandX, islandY, mock.islandWidth, mock.islandHeight, mock.islandHeight / 2);
                ctx.fill();

                // 5. Gloss/Reflection (Optional - subtle gradient)
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(mock.screenX, mock.screenY, mock.screenW, mock.screenH, mock.screenRadius);
                ctx.clip();
                const grad = ctx.createLinearGradient(mock.screenX, mock.screenY, mock.screenX + mock.screenW, mock.screenY + mock.screenH);
                grad.addColorStop(0, 'rgba(255,255,255,0.1)');
                grad.addColorStop(0.4, 'rgba(255,255,255,0)');
                grad.addColorStop(1, 'rgba(255,255,255,0.05)');
                ctx.fillStyle = grad;
                ctx.fillRect(mock.screenX, mock.screenY, mock.screenW, mock.screenH);
                ctx.restore();

                // Save frame
                frames.push(canvas.toDataURL('image/webp', 0.90));

                URL.revokeObjectURL(lottieImg.src);

                const progress = (i / totalOutputFrames) * 0.5;
                setExportProgress(progress);
                if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));
            }

            anim.destroy();
            if (container && container.parentNode) container.parentNode.removeChild(container);
            container = null;
            anim = null;

            setExportStatus("Encoding Social Video...");

            const videoCanvas = document.createElement('canvas');
            videoCanvas.width = outWidth;
            videoCanvas.height = outHeight;
            videoCanvas.style.cssText = 'position:fixed;left:0;top:-9999px;pointer-events:none;opacity:0;';
            document.body.appendChild(videoCanvas);
            const videoCtx = videoCanvas.getContext('2d')!;

            const stream = videoCanvas.captureStream(fps);
            const recorder = new MediaRecorder(stream, {
                mimeType: 'video/webm',
                videoBitsPerSecond: socialResolution === '4k' ? 15000000 : 8000000
            });

            const chunks: Blob[] = [];
            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

            const recordingComplete = new Promise<Blob>((resolve, reject) => {
                recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
                recorder.onerror = reject;
            });

            recorder.start();

            const frameDelay = 1000 / fps;
            for (let i = 0; i < frames.length; i++) {
                const img = new Image();
                await new Promise<void>((resolve) => {
                    img.onload = () => resolve();
                    img.src = frames[i];
                });
                videoCtx.drawImage(img, 0, 0);

                setExportProgress(0.5 + (i / frames.length) * 0.5);
                await new Promise(r => setTimeout(r, frameDelay));
            }

            recorder.stop();
            const webmBlob = await recordingComplete;
            document.body.removeChild(videoCanvas);

            // Clean frames
            frames.length = 0;

            if (videoFormat === 'webm') {
                downloadBlob(webmBlob, `${fileName.replace('.json', '')}-social.webm`);
                toast.success("Social Post exported!");
            } else {
                setExportStatus("Transcoding to MP4...");
                const mp4Blob = await transcodeWebmToMp4(webmBlob);
                downloadBlob(mp4Blob, `${fileName.replace('.json', '')}-social.mp4`);
                toast.success("Social Post exported!");
            }

            handleSuccess();

        } catch (e: any) {
            console.error("Social Export Failed", e);
            toast.error(`Export failed: ${e?.message}`);
        } finally {
            setIsExporting(false);
            setExportStatus("Completed");
            if (anim) anim.destroy();
            if (container && container.parentNode) container.parentNode.removeChild(container);
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



    // Calculate Estimated Size (Simplified for UI reference)
    // Calculate Estimated Size (Simplified for UI reference)
    const getEstimatedSize = () => {
        if (!lottieData) return null;

        let estimatedBytes = 0;

        if (activeTab === 'json') {
            const content = minify ? JSON.stringify(lottieData) : JSON.stringify(lottieData, null, 2);
            estimatedBytes = new Blob([content]).size;
        } else if (activeTab === 'lottie') {
            return null; // Hard to estimate compressed size
        } else {
            // For media, very rough estimate or return null
            const duration = (lottieData.op - lottieData.ip) / lottieData.fr;
            const width = lottieData.w * resolution;
            const height = lottieData.h * resolution;
            const pixels = width * height;
            const outFrames = duration * fps;

            if (activeTab === 'gif') estimatedBytes = pixels * outFrames * 0.35;
            if (activeTab === 'video') estimatedBytes = (2500000 * duration) / 8; // ~2.5Mbps
        }

        if (estimatedBytes > 1024 * 1024) return (estimatedBytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (estimatedBytes / 1024).toFixed(1) + ' KB';
    };

    if (!lottieData) return null;

    return (
        <div className="border-t border-border mt-auto">
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setIsExportExpanded(!isExportExpanded)}
            >
                <div className="flex items-center gap-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Export</h3>
                </div>
                {isExportExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
            </div>

            {isExportExpanded && (
                <div className="p-3 pt-0 bg-muted/30">

                    {/* Tabs */}
                    <div className="flex bg-muted p-0.5 rounded-lg mb-4 border border-border">
                        {(['json', 'lottie', 'gif', 'video'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-md transition-all duration-200",
                                    activeTab === tab
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab === 'lottie' ? 'LOTTIE' : tab}
                            </button>
                        ))}
                    </div>

                    {/* --- CONTENT BASED ON TAB --- */}
                    <div className="space-y-3">
                        {/* JSON SETTINGS */}
                        {activeTab === 'json' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-muted-foreground">Minify JSON</Label>
                                    <input
                                        type="checkbox"
                                        checked={minify}
                                        onChange={(e) => setMinify(e.target.checked)}
                                        className="toggle toggle-xs"
                                    />
                                </div>

                                <Button
                                    onClick={handleJsonExport}
                                    className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 border-0 flex items-center justify-between px-3"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileJson className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold">EXPORT JSON</span>
                                    </div>
                                    <span className="text-muted-foreground text-[10px] font-medium">
                                        {getEstimatedSize() || '0 KB'}
                                    </span>
                                </Button>
                            </div>
                        )}

                        {/* LOTTIE SETTINGS */}
                        {activeTab === 'lottie' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="p-3 rounded-lg bg-muted border border-border">
                                    <p className="text-[10px] leading-relaxed text-muted-foreground">
                                        The dotLottie format is a superset of Lottie JSON that includes assets and metadata in a compressed archive.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleLottieExport}
                                    disabled={isExporting}
                                    className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 border-0 flex items-center justify-between px-3"
                                >
                                    <div className="flex items-center gap-2">
                                        {isExporting ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                                        <span className="text-xs font-bold">EXPORT .LOTTIE</span>
                                    </div>
                                    {/* Size unknown until export, simplified for now */}
                                    <span className="text-muted text-[10px] font-medium">
                                        {isExporting ? 'PROCESSING...' : (getEstimatedSize() || '')}
                                    </span>
                                </Button>
                                {isExporting && activeTab === 'lottie' && (
                                    <div className="text-[10px] text-center text-muted-foreground">Processing...</div>
                                )}
                            </div>
                        )}

                        {/* GIF SETTINGS */}
                        {activeTab === 'gif' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                {/* Resolution Dropdown */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Resolution</Label>
                                        <select
                                            className="w-full bg-background border border-border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-ring"
                                            value={resolution}
                                            onChange={(e) => setResolution(parseFloat(e.target.value))}
                                        >
                                            <option value={0.5}>0.5x</option>
                                            <option value={1}>1.0x</option>
                                            <option value={2}>2.0x</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">FPS</Label>
                                        <select
                                            className="w-full bg-background border border-border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-ring"
                                            value={fps}
                                            onChange={(e) => setFps(parseInt(e.target.value))}
                                        >
                                            <option value={15}>15</option>
                                            <option value={24}>24</option>
                                            <option value={30}>30</option>
                                        </select>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleGifExport}
                                    disabled={isExporting}
                                    className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 border-0 flex items-center justify-between px-3"
                                >
                                    <div className="flex items-center gap-2">
                                        {isExporting ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                                        <span className="text-xs font-bold">EXPORT GIF</span>
                                    </div>
                                    <span className="text-muted text-[10px] font-medium">
                                        {isExporting ? 'RENDERING...' : (getEstimatedSize() || '')}
                                    </span>
                                </Button>
                                {isExporting && activeTab === 'gif' && (
                                    <div className="space-y-1.5">
                                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white transition-all duration-300 ease-out"
                                                style={{ width: `${Math.max(5, exportProgress * 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-center text-muted-foreground">{Math.round(exportProgress * 100)}%</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* VIDEO SETTINGS */}
                        {activeTab === 'video' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Quality</Label>
                                        <select
                                            className="w-full bg-background border border-border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-ring"
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
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Framerate</Label>
                                        <select
                                            className="w-full bg-background border border-border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-ring"
                                            value={fps}
                                            onChange={(e) => setFps(parseInt(e.target.value))}
                                        >
                                            <option value={24}>24 FPS</option>
                                            <option value={30}>30 FPS</option>
                                            <option value={60}>60 FPS</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-muted-foreground font-bold">Format</Label>
                                    <select
                                        className="w-full bg-background border border-border rounded-md p-1.5 text-xs focus:ring-1 focus:ring-ring"
                                        value={videoFormat}
                                        onChange={(e) => setVideoFormat(e.target.value as 'mp4' | 'webm')}
                                    >
                                        <option value="webm">WebM (⚡ Fast - Recommended)</option>
                                        <option value="mp4">MP4 (🐢 Slow - Better Compatibility)</option>
                                    </select>
                                </div>
                                {videoFormat === 'mp4' && (
                                    <p className="text-[10px] text-amber-500">
                                        ⚠️ MP4 requires downloading ~30MB and slow transcoding
                                    </p>
                                )}

                                <Button
                                    onClick={handleVideoExport}
                                    disabled={isExporting}
                                    className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 border-0 flex items-center justify-between px-3 mt-1"
                                >
                                    <div className="flex items-center gap-2">
                                        {isExporting ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
                                        <span className="text-xs font-bold">EXPORT VIDEO</span>
                                    </div>
                                    <span className="text-muted text-[10px] font-medium">
                                        {isExporting ? 'RENDERING...' : (getEstimatedSize() || '')}
                                    </span>
                                </Button>

                                {isExporting && activeTab === 'video' && (
                                    <div className="space-y-1.5">
                                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-300 ease-out"
                                                style={{ width: `${Math.max(5, exportProgress * 100)}%` }}
                                            />
                                        </div>
                                        <div className="text-[10px] text-center text-muted-foreground">{Math.round(exportProgress * 100)}%</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            )}

            {/* Export Success Message & Support */}
            {exportSuccess && (
                <ExportSuccessSupport showSupport={showSupportForThisExport} />
            )}

            {/* Social Export Modal */}
            <SocialExportModal
                open={isSocialModalOpen}
                onClose={() => setSocialModalOpen(false)}
                onExport={handleSocialExport}
            />
        </div>
    );
};

import { useState, useRef, useEffect } from 'react';
import type { LottieAsset } from '@/engine/lottie-schema';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ImageRowProps {
    asset: LottieAsset;
    onUpdate: (assetId: string, updates: Partial<any>) => void;
}

export const ImageRow = ({ asset, onUpdate }: ImageRowProps) => {
    // We only support embedded images (data URIs) for now
    const isEmbedded = asset.p && asset.p.startsWith('data:image');
    // If it's an external URL (u + p), we might handle it differently, but for now focus on embedded
    // Some lotties use 'u' for folder and 'p' for filename. Embedded ones usually have empty 'u' and data URI in 'p'.

    // Safety check
    if (!isEmbedded && !asset.u) {
        return null; // Skip non-image assets or intricate ones we can't handle yet
    }

    const [compression, setCompression] = useState<'none' | 'low' | 'medium' | 'high'>('none');
    const [originalDimensions, setOriginalDimensions] = useState<{ w: number, h: number } | null>(null);
    const [currentSizeKB, setCurrentSizeKB] = useState<number>(0);
    const [format, setFormat] = useState<'original' | 'image/png' | 'image/jpeg' | 'image/webp'>('original');

    // UI Format options
    const formatOptions = [
        { value: 'original', label: 'Match Original' },
        { value: 'image/png', label: 'PNG (Lossless)' },
        { value: 'image/jpeg', label: 'JPEG (Compact)' }, // Lossy
        { value: 'image/webp', label: 'WebP (Best)' },   // Good compression
    ];

    const compressionOptions = [
        { value: 'none', label: 'None (Original)' },
        { value: 'low', label: 'Low (75%)' },
        { value: 'medium', label: 'Medium (50%)' },
        { value: 'high', label: 'High (25%)' },
    ];

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize/Sync state logic...
    // We map scale back to compression roughly if we were reloading, but for now default to 'none'.
    useEffect(() => {
        if (!asset.p) return;

        // Use _originalP if available (pristine high-res), otherwise current p
        const sourceP = asset._originalP || asset.p;

        if (sourceP && sourceP.startsWith('data:image')) {
            const sizeKB = Math.round(asset.p.length / 1024);
            setCurrentSizeKB(sizeKB);

            // Determine dimensions of the SOURCE image given it is the highest quality available
            const img = new Image();
            img.onload = () => {
                setOriginalDimensions({
                    w: img.naturalWidth,
                    h: img.naturalHeight
                });
            };
            img.src = sourceP;
        }
    }, [asset.p, asset._originalP]);

    const getScaleFromCompression = (comp: string) => {
        switch (comp) {
            case 'low': return 75;
            case 'medium': return 50;
            case 'high': return 25;
            default: return 100;
        }
    };

    const handleCompressionChange = (val: 'none' | 'low' | 'medium' | 'high') => {
        setCompression(val);
        // Process new scale
        const scale = getScaleFromCompression(val);
        setTimeout(() => processResize(scale, format), 0);
    };

    // Re-run process if format changes
    const handleFormatChange = (val: string) => {
        setFormat(val as any);
        const scale = getScaleFromCompression(compression);
        setTimeout(() => processResize(scale, val as any), 0);
    };

    const processResize = (scalePercent: number, explicitFormat?: string) => {
        const targetFormat = explicitFormat || format;

        // Use pristine source if available, else current
        const sourceP = asset._originalP || asset.p;
        if (!sourceP || !originalDimensions) return;

        // OPTIMIZATION: If 100% AND Format is "Original" (or matches original), revert to source.
        // This avoids browser re-encoding bloat (browser PNG/JPEG encoders are often less efficient than source).
        const isOriginalFormat = targetFormat === 'original';

        if (scalePercent === 100 && isOriginalFormat) {
            onUpdate(asset.id, {
                p: sourceP,
                _originalP: sourceP // Ensure it's kept
            });
            // Update UI to show original size
            const sizeKB = Math.round(sourceP.length / 1024);
            setCurrentSizeKB(sizeKB);
            return;
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Calculate pixel dimensions based on original FULL RES image
            const targetW = Math.floor(originalDimensions.w * (scalePercent / 100));
            const targetH = Math.floor(originalDimensions.h * (scalePercent / 100));

            // Limit minimum size to 1x1
            canvas.width = Math.max(1, targetW);
            canvas.height = Math.max(1, targetH);

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Good quality scaling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Determine output mime type
                let outputMime = 'image/png'; // Default
                if (targetFormat !== 'original') {
                    outputMime = targetFormat;
                } else {
                    // Infer from source if 'original' selected
                    if (sourceP.startsWith('data:image/jpeg') || sourceP.startsWith('data:image/jpg')) {
                        outputMime = 'image/jpeg';
                    } else if (sourceP.startsWith('data:image/webp')) {
                        outputMime = 'image/webp';
                    }
                    // If original is PNG or unknown, it remains 'image/png'
                }

                // Quality settings
                // PNG ignores quality. JPEG/WebP use it.
                // 0.85 is a good balance for "Compact" but still good looking.
                const quality = outputMime === 'image/png' ? undefined : 0.85;

                const newDataUri = canvas.toDataURL(outputMime, quality);

                // CRITICAL: We update 'p' (pixel data) but NOT 'w' and 'h'.
                onUpdate(asset.id, {
                    p: newDataUri,
                    _originalP: sourceP // Save the high-res version if not already there
                });

                // Update local size display
                setCurrentSizeKB(Math.round(newDataUri.length / 1024));
            }
        };
        img.src = sourceP;
    };

    const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            const img = new Image();
            img.onload = () => {
                // For REPLACE, we DO update w/h because it's a completely new asset
                // and we want the container to match its aspect ratio.
                onUpdate(asset.id, {
                    p: result,
                    w: img.naturalWidth,
                    h: img.naturalHeight,
                    _originalP: result // New image becomes the new pristine source
                });
                setCompression('none'); // Reset
                setFormat('original');
            };
            img.src = result;
        };
        reader.readAsDataURL(file);
    };

    if (!isEmbedded) {
        return (
            <div className="p-3 border rounded-md bg-muted/50 mb-2">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">External images not supported yet</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 border rounded-md bg-card mb-2 space-y-3">
            <div className="flex gap-3">
                <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0 border flex items-center justify-center relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.p} alt={asset.id} className="max-w-full max-h-full object-contain" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="overflow-hidden mr-2">
                            <h4 className="font-medium text-sm truncate" title={asset.id}>ID: {asset.id}</h4>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                {Math.round(currentSizeKB)} KB
                            </div>
                        </div>

                        {/* Format Selector */}
                        <div className="w-24 flex-shrink-0">
                            <Select value={format} onValueChange={handleFormatChange}>
                                <SelectTrigger className="h-6 text-xs px-2">
                                    <SelectValue placeholder="Format" />
                                </SelectTrigger>
                                <SelectContent>
                                    {formatOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-xs items-center">
                    <Label>Compression</Label>
                    <span className="text-muted-foreground text-[10px]">
                        {originalDimensions && Math.round(originalDimensions.w * (getScaleFromCompression(compression) / 100))} x {originalDimensions && Math.round(originalDimensions.h * (getScaleFromCompression(compression) / 100))} px
                    </span>
                </div>

                <Select value={compression} onValueChange={(val: any) => handleCompressionChange(val)}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Compression Level" />
                    </SelectTrigger>
                    <SelectContent>
                        {compressionOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={handleReplace}
            />

            <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-7"
                onClick={() => fileInputRef.current?.click()}
            >
                <RefreshCw className="w-3 h-3 mr-2" />
                Replace Image
            </Button>
        </div>
    );
};

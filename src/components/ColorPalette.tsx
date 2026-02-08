import { useMemo, useState } from 'react';
import { useLottieStore } from '@/store/useLottieStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { extractColors, type ColorLocation, type ColorInstance } from '@/engine/colors';
import { replaceColor, updateColorForInstance, updateGradientOffset } from '@/engine/transformer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Palette, ChevronDown, ChevronUp, ChevronRight, Layers as LayerIcon, GripHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AdvancedColorPicker } from '@/components/ui/advanced-color-picker';
import { cn } from '@/lib/utils';

export const ColorPalette = () => {
    const lottie = useLottieStore((state) => state.lottie);
    const updateLottie = useLottieStore((state) => state.updateLottie);
    const commit = useLottieStore((state) => state.commit);

    // Global selection state for cross-component highlighting
    const selectedLayerIds = useSelectionStore((state) => state.selectedLayerIds);
    const setHighlightedLayerIds = useSelectionStore((state) => state.setHighlightedLayerIds);

    // Track expansion by index instead of ID to prevent collapse on color change
    const [expandedItem, setExpandedItem] = useState<{ type: 'solid' | 'gradient', index: number } | null>(null);
    const [sectionsExpanded, setSectionsExpanded] = useState({ solids: true, gradients: true });
    const [isMainExpanded, setIsMainExpanded] = useState(true);

    // Memoize color extraction
    const { solids, gradients } = useMemo(() => {
        if (!lottie) return { solids: [], gradients: [] };
        const allColors = extractColors(lottie);
        return {
            solids: allColors.filter(c => c.type === 'solid'),
            gradients: allColors.filter(c => c.type === 'gradient')
        };
    }, [lottie]);

    // Helper to check if a color belongs to any selected layer
    const colorBelongsToSelectedLayer = (color: ColorInstance) => {
        if (selectedLayerIds.length === 0) return false;
        return color.locations.some(loc => selectedLayerIds.includes(loc.layerInd));
    };

    // Helper to highlight layers when hovering a color
    const handleColorHover = (color: ColorInstance | null) => {
        if (color) {
            const layerIds = [...new Set(color.locations.map(loc => loc.layerInd))];
            setHighlightedLayerIds(layerIds);
        } else {
            setHighlightedLayerIds([]);
        }
    };

    // Helper to highlight a single layer when hovering a specific location
    const handleLocationHover = (loc: ColorLocation | null) => {
        if (loc) {
            setHighlightedLayerIds([loc.layerInd]);
        } else {
            setHighlightedLayerIds([]);
        }
    };

    // Helper to format layer names - differentiate between main comp and nested precomp layers
    const formatLayerName = (loc: ColorLocation): string => {
        const name = loc.layerName;
        const isNested = !!loc.assetId; // Has assetId means it's inside a precomp

        // Check if it's a generic "Layer X" name
        const layerMatch = name.match(/^Layer\s*(\d+)$/i);

        if (layerMatch) {
            if (isNested) {
                // For precomp layers with generic names, don't show confusing numbers
                return 'Nested Shape';
            }
            // For main comp layers, keep the layer number
            return `Layer ${layerMatch[1]}`;
        }

        // If it has a meaningful name, use it
        if (isNested) {
            // Indicate it's nested for context
            const truncated = name.length > 18 ? name.substring(0, 16) + '…' : name;
            return `↳ ${truncated}`;
        }

        return name.length > 24 ? name.substring(0, 22) + '…' : name;
    };

    const handleGlobalUpdate = (oldHex: string, newHex: string) => {
        // Hex can be 6 or 8 digits
        if (/^#[0-9A-F]{6,8}$/i.test(newHex)) {
            updateLottie((draft) => {
                replaceColor(draft, oldHex, newHex);
            }, true); // Transient
        }
    };

    const handleInstanceUpdate = (loc: ColorLocation, newHex: string) => {
        if (/^#[0-9A-F]{6,8}$/i.test(newHex)) {
            updateLottie((draft) => {
                updateColorForInstance(
                    draft,
                    loc.layerInd,
                    loc.shapeIndices,
                    newHex,
                    loc.type || 'solid',
                    0,
                    loc.assetId
                );
            }, true); // Transient
        }
    };

    const handleGradientStopUpdate = (c: ColorInstance, stopIndex: number, newHex: string) => {
        if (/^#[0-9A-F]{6,8}$/i.test(newHex)) {
            updateLottie((draft) => {
                c.locations.forEach((loc) => {
                    updateColorForInstance(
                        draft,
                        loc.layerInd,
                        loc.shapeIndices,
                        newHex,
                        'gradient',
                        stopIndex,
                        loc.assetId
                    );
                });
            }, true);
        }
    };

    const handleGradientOffsetUpdate = (c: ColorInstance, stopIndex: number, newOffset: number) => {
        updateLottie((draft) => {
            c.locations.forEach((loc) => {
                updateGradientOffset(
                    draft,
                    loc.layerInd,
                    loc.shapeIndices,
                    newOffset,
                    stopIndex,
                    loc.assetId
                );
            });
        }, true);
    };

    const handleCommit = () => {
        commit();
    };

    const toggleExpand = (type: 'solid' | 'gradient', index: number) => {
        if (expandedItem && expandedItem.type === type && expandedItem.index === index) {
            setExpandedItem(null);
        } else {
            setExpandedItem({ type, index });
        }
    };

    const toggleSection = (section: 'solids' | 'gradients') => {
        setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (!lottie) return null;

    return (
        <div className="flex flex-col h-full border-t border-border bg-background">
            <div
                className="p-4 border-b flex items-center gap-2 font-medium bg-muted/30 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsMainExpanded(!isMainExpanded)}
            >
                <Palette className="size-4" />
                Colors
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{solids.length + gradients.length}</span>
                    {isMainExpanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
                </div>
            </div>

            {isMainExpanded && (
                <ScrollArea className="flex-1">
                    <div className="flex flex-col p-4 gap-6">

                        {/* Color Instance Clusters */}
                        {solids.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div
                                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded"
                                    onClick={() => toggleSection('solids')}
                                >
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Color Instance Clusters ({solids.length})</span>
                                    {sectionsExpanded.solids ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
                                </div>

                                {sectionsExpanded.solids && solids.map((c, idx) => {
                                    const isExpanded = expandedItem?.type === 'solid' && expandedItem?.index === idx;
                                    const belongsToSelectedLayer = colorBelongsToSelectedLayer(c);
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "border rounded-lg shadow-sm bg-card overflow-hidden transition-all",
                                                belongsToSelectedLayer && "ring-2 ring-amber-500 ring-offset-1 ring-offset-background"
                                            )}
                                            onMouseEnter={() => handleColorHover(c)}
                                            onMouseLeave={() => handleColorHover(null)}
                                        >
                                            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleExpand('solid', idx)}>
                                                <span className={cn(
                                                    "text-xs font-medium",
                                                    belongsToSelectedLayer && "text-amber-500"
                                                )}>
                                                    {c.count > 1 ? `${c.count} Instances` : '1 Instance'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {/* Pill Component */}
                                                    <div className="flex items-center gap-2 bg-muted/50 border rounded-full pl-3 pr-1 py-1 h-7">
                                                        <span className="font-mono text-[10px] text-muted-foreground">{c.hex}</span>
                                                        <Popover onOpenChange={(open) => !open && handleCommit()}>
                                                            <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                <div className="size-5 rounded-full border shadow-sm bg-current cursor-pointer hover:scale-110 transition-transform" style={{ color: c.hex }} />
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="left" align="center">
                                                                <AdvancedColorPicker
                                                                    color={c.hex!}
                                                                    onChange={(val) => handleGlobalUpdate(c.hex!, val)}
                                                                    disableGradient
                                                                    inline
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="bg-muted/10 border-t">
                                                    {c.locations.map((loc, locIdx) => (
                                                        <div
                                                            key={`${loc.layerInd}-${locIdx}`}
                                                            className="flex items-center justify-between px-3 py-2 text-xs border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                                                            onMouseEnter={() => handleLocationHover(loc)}
                                                            onMouseLeave={() => handleLocationHover(null)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <LayerIcon className="size-3 text-muted-foreground shrink-0" />
                                                                <span className="truncate text-muted-foreground max-w-[120px]" title={loc.layerName}>{formatLayerName(loc)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 bg-muted/50 border rounded-full pl-3 pr-1 py-0.5 h-6">
                                                                <span className="font-mono text-[10px] text-muted-foreground opacity-75">{c.hex}</span>
                                                                <Popover onOpenChange={(open) => !open && handleCommit()}>
                                                                    <PopoverTrigger asChild>
                                                                        <div className="size-4 rounded-full border shadow-sm bg-current cursor-pointer hover:scale-110 transition-transform" style={{ color: c.hex }} />
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="left" align="center">
                                                                        <AdvancedColorPicker
                                                                            color={c.hex!}
                                                                            onChange={(val) => handleInstanceUpdate(loc, val)}
                                                                            disableGradient
                                                                            inline
                                                                        />
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Gradient Instances */}
                        {gradients.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <div
                                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded"
                                    onClick={() => toggleSection('gradients')}
                                >
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gradient Instances ({gradients.length})</span>
                                    {sectionsExpanded.gradients ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
                                </div>

                                {sectionsExpanded.gradients && gradients.map((c, idx) => {
                                    const isExpanded = expandedItem?.type === 'gradient' && expandedItem?.index === idx;
                                    const gradientBackground = c.stops ? `linear-gradient(to right, ${c.stops.map(s => `${s.hex} ${s.offset * 100}%`).join(', ')}` : 'transparent';
                                    const belongsToSelectedLayer = colorBelongsToSelectedLayer(c);

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "border rounded-lg shadow-sm bg-card overflow-hidden transition-all",
                                                belongsToSelectedLayer && "ring-2 ring-amber-500 ring-offset-1 ring-offset-background"
                                            )}
                                            onMouseEnter={() => handleColorHover(c)}
                                            onMouseLeave={() => handleColorHover(null)}
                                        >
                                            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleExpand('gradient', idx)}>
                                                <div className="flex items-center gap-3">
                                                    <div className="size-6 text-muted-foreground">
                                                        <GripHorizontal className="size-4" />
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs font-medium",
                                                        belongsToSelectedLayer && "text-amber-500"
                                                    )}>
                                                        {c.count > 1 ? `Gradient Group (${c.count})` : c.locations[0]?.layerName || 'Gradient'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-4 w-16 rounded border shadow-sm" style={{ background: gradientBackground }} />
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                    </Button>
                                                </div>
                                            </div>

                                            {isExpanded && c.stops && (
                                                <div className="bg-muted/10 border-t p-3 flex flex-col gap-3">
                                                    {/* Stops */}
                                                    {c.stops.map((stop, stopIdx) => (
                                                        <div key={stopIdx} className="flex items-center justify-between text-xs">
                                                            <span className="text-muted-foreground font-medium">Stop {stopIdx + 1}</span>
                                                            <div className="flex items-center gap-2">
                                                                {/* Offset Input */}
                                                                <div className="flex items-center bg-muted/50 border rounded-md px-2 h-7 w-16">
                                                                    <input
                                                                        className="bg-transparent w-full text-right outline-none font-mono text-[10px]"
                                                                        type="number"
                                                                        min={0}
                                                                        max={100}
                                                                        value={Math.round(stop.offset * 100)}
                                                                        onChange={(e) => {
                                                                            const val = parseInt(e.target.value);
                                                                            if (!isNaN(val)) {
                                                                                handleGradientOffsetUpdate(c, stop.index, Math.max(0, Math.min(100, val)) / 100);
                                                                            }
                                                                        }}
                                                                        onBlur={handleCommit}
                                                                    />
                                                                </div>

                                                                {/* Color Pill */}
                                                                <div className="flex items-center gap-2 bg-muted/50 border rounded-full pl-3 pr-1 py-1 h-7">
                                                                    <span className="font-mono text-[10px] text-muted-foreground">{stop.hex}</span>
                                                                    <Popover onOpenChange={(open) => !open && handleCommit()}>
                                                                        <PopoverTrigger asChild>
                                                                            <div className="size-5 rounded-full border shadow-sm bg-current cursor-pointer hover:scale-110 transition-transform" style={{ color: stop.hex }} />
                                                                        </PopoverTrigger>
                                                                        <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="bottom" align="center">
                                                                            <AdvancedColorPicker
                                                                                color={stop.hex}
                                                                                onChange={(val) => handleGradientStopUpdate(c, stop.index, val)}
                                                                                disableGradient
                                                                                inline
                                                                            />
                                                                        </PopoverContent>
                                                                    </Popover>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                </ScrollArea>
            )}
        </div>
    );
};

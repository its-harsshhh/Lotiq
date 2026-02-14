import { useMemo, useState } from 'react';
import { useLottieStore } from '@/store/useLottieStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { extractColors, type ColorLocation, type ColorInstance } from '@/engine/colors';
import { replaceColor, updateColorForInstance, updateGradientOffset } from '@/engine/transformer';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Palette, ChevronDown, ChevronUp, ChevronRight, Layers as LayerIcon } from 'lucide-react';
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
                className="px-4 py-3 border-b flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50 transition-colors text-foreground select-none"
                onClick={() => setIsMainExpanded(!isMainExpanded)}
            >
                <Palette className="size-4 text-muted-foreground" />
                <span className="text-sm">Colors</span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-normal">{solids.length + gradients.length}</span>
                    {isMainExpanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
                </div>
            </div>

            {isMainExpanded && (
                <ScrollArea className="flex-1">
                    <div className="flex flex-col p-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-500">

                        {/* Color Instance Clusters */}
                        {solids.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div
                                    className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => toggleSection('solids')}
                                >
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Solid Colors ({solids.length})</span>
                                    {sectionsExpanded.solids ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
                                </div>

                                {sectionsExpanded.solids && (
                                    <div className="flex flex-col gap-2">
                                        {solids.map((c, idx) => {
                                            const isExpanded = expandedItem?.type === 'solid' && expandedItem?.index === idx;
                                            const belongsToSelectedLayer = colorBelongsToSelectedLayer(c);
                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "border border-border/60 rounded-xl shadow-sm bg-card/50 overflow-hidden transition-all duration-300",
                                                        belongsToSelectedLayer && "ring-1 ring-primary border-primary/50 bg-primary/5 shadow-[0_0_15px_-5px_var(--primary)]",
                                                        isExpanded && "bg-card shadow-md ring-1 ring-border"
                                                    )}
                                                    onMouseEnter={() => handleColorHover(c)}
                                                    onMouseLeave={() => handleColorHover(null)}
                                                >
                                                    <div
                                                        className="flex items-center gap-3 p-2 pl-2 cursor-pointer hover:bg-muted/30 transition-colors"
                                                        onClick={() => toggleExpand('solid', idx)}
                                                    >
                                                        <div className="flex items-center justify-center w-6 h-6 shrink-0 transition-colors hover:text-foreground">
                                                            {isExpanded ? (
                                                                <ChevronDown className="size-3.5 text-primary" />
                                                            ) : (
                                                                <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col min-w-0">
                                                            <span className={cn(
                                                                "text-[10px] font-bold text-muted-foreground uppercase tracking-tight",
                                                                belongsToSelectedLayer && "text-primary"
                                                            )}>
                                                                {c.count > 1 ? `${c.count} Instances` : '1 Instance'}
                                                            </span>
                                                        </div>

                                                        <div className="ml-auto pr-1" onClick={(e) => e.stopPropagation()}>
                                                            <AdvancedColorPicker
                                                                color={c.hex!}
                                                                onChange={(val) => handleGlobalUpdate(c.hex!, val)}
                                                                disableGradient
                                                                onOpenChange={(open) => !open && handleCommit()}
                                                                className="h-8 w-auto min-w-[90px] border-none bg-muted/40 hover:bg-muted/60 rounded-lg pl-1 pr-2.5 gap-2 flex-row-reverse shadow-none transition-all"
                                                            >
                                                                <div
                                                                    className="size-5 rounded-md shadow-sm cursor-pointer hover:scale-110 transition-transform shrink-0 ring-1 ring-black/10 dark:ring-white/20"
                                                                    style={{ backgroundColor: c.hex }}
                                                                />
                                                            </AdvancedColorPicker>
                                                        </div>
                                                    </div>

                                                    {/* Expanded List with Animation */}
                                                    <div className={cn(
                                                        "grid transition-all duration-300 ease-in-out",
                                                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                                    )}>
                                                        <div className="overflow-hidden">
                                                            <div className="bg-muted/10 border-t border-border/40 flex flex-col">
                                                                {c.locations.map((loc, locIdx) => (
                                                                    <div
                                                                        key={`${loc.layerInd}-${locIdx}`}
                                                                        className="flex items-center justify-between px-3 py-2 text-xs border-b border-border/40 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors group"
                                                                        onMouseEnter={() => handleLocationHover(loc)}
                                                                        onMouseLeave={() => handleLocationHover(null)}
                                                                    >
                                                                        <div className="flex items-center gap-2.5">
                                                                            <LayerIcon className="size-3 text-muted-foreground/70 group-hover:text-foreground transition-colors shrink-0" />
                                                                            <span className="truncate text-muted-foreground group-hover:text-foreground transition-colors max-w-[120px]" title={loc.layerName}>{formatLayerName(loc)}</span>
                                                                        </div>
                                                                        <div onClick={(e) => e.stopPropagation()}>
                                                                            <AdvancedColorPicker
                                                                                color={c.hex!}
                                                                                onChange={(val) => handleInstanceUpdate(loc, val)}
                                                                                disableGradient
                                                                                onOpenChange={(open) => !open && handleCommit()}
                                                                                className="h-7 w-auto min-w-[90px] border border-border/30 bg-background/50 hover:bg-background rounded-full pl-1 pr-3 gap-2 flex-row-reverse shadow-sm transition-all scale-95 hover:scale-100 opacity-60 group-hover:opacity-100"
                                                                            >
                                                                                <div
                                                                                    className="size-4 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform shrink-0 ring-1 ring-black/10 dark:ring-white/20"
                                                                                    style={{ backgroundColor: c.hex }}
                                                                                />
                                                                            </AdvancedColorPicker>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Gradient Instances */}
                        {gradients.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div
                                    className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => toggleSection('gradients')}
                                >
                                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Gradients ({gradients.length})</span>
                                    {sectionsExpanded.gradients ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
                                </div>

                                {sectionsExpanded.gradients && (
                                    <div className="flex flex-col gap-2">
                                        {gradients.map((c, idx) => {
                                            const isExpanded = expandedItem?.type === 'gradient' && expandedItem?.index === idx;
                                            const gradientBackground = c.stops ? `linear-gradient(to right, ${c.stops.map(s => `${s.hex} ${s.offset * 100}%`).join(', ')}` : 'transparent';
                                            const belongsToSelectedLayer = colorBelongsToSelectedLayer(c);

                                            return (
                                                <div
                                                    key={idx}
                                                    className={cn(
                                                        "border border-border/60 rounded-xl shadow-sm bg-card/50 overflow-hidden transition-all duration-300",
                                                        belongsToSelectedLayer && "ring-1 ring-primary border-primary/50 bg-primary/5",
                                                        isExpanded && "bg-card shadow-md ring-1 ring-border"
                                                    )}
                                                    onMouseEnter={() => handleColorHover(c)}
                                                    onMouseLeave={() => handleColorHover(null)}
                                                >
                                                    <div
                                                        className="flex items-center gap-3 p-2 pl-2 cursor-pointer hover:bg-muted/30 transition-colors"
                                                        onClick={() => toggleExpand('gradient', idx)}
                                                    >
                                                        <div className="flex items-center justify-center w-6 h-6 shrink-0 transition-colors hover:text-foreground">
                                                            {isExpanded ? (
                                                                <ChevronDown className="size-3.5 text-primary" />
                                                            ) : (
                                                                <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <span className={cn(
                                                                "text-[10px] font-bold text-muted-foreground uppercase tracking-tight truncate",
                                                                belongsToSelectedLayer && "text-primary"
                                                            )}>
                                                                {c.count > 1 ? `Gradient (${c.count})` : c.locations[0]?.layerName || 'Gradient'}
                                                            </span>
                                                        </div>

                                                        <div className="ml-auto pr-1 flex items-center gap-2">
                                                            <div className="h-6 w-16 rounded-md border shadow-sm ring-1 ring-black/5 dark:ring-white/10" style={{ background: gradientBackground }} />
                                                        </div>
                                                    </div>

                                                    {/* Expanded Gradient */}
                                                    <div className={cn(
                                                        "grid transition-all duration-300 ease-in-out",
                                                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                                    )}>
                                                        <div className="overflow-hidden">
                                                            <div className="bg-muted/10 border-t border-border/40 p-3 flex flex-col gap-3">
                                                                {/* Stops */}
                                                                {c.stops?.map((stop, stopIdx) => (
                                                                    <div key={stopIdx} className="flex items-center justify-between text-xs group">
                                                                        <span className="text-muted-foreground font-medium group-hover:text-foreground transition-colors">Stop {stopIdx + 1}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            {/* Offset Input */}
                                                                            <div className="flex items-center bg-background border border-border/50 rounded-md px-2 h-7 w-16 focus-within:ring-1 focus-within:ring-primary/50 transition-shadow">
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
                                                                                <span className="text-muted-foreground text-[10px] ml-0.5">%</span>
                                                                            </div>

                                                                            {/* Color Pill */}
                                                                            <div onClick={(e) => e.stopPropagation()}>
                                                                                <AdvancedColorPicker
                                                                                    color={stop.hex}
                                                                                    onChange={(val) => handleGradientStopUpdate(c, stop.index, val)}
                                                                                    disableGradient
                                                                                    onOpenChange={(open) => !open && handleCommit()}
                                                                                    className="h-7 w-auto min-w-[90px] border border-border/40 bg-background/80 hover:bg-muted/50 rounded-full pl-1 pr-3 gap-2 flex-row-reverse shadow-sm transition-all"
                                                                                >
                                                                                    <div
                                                                                        className="size-5 rounded-full shadow-sm cursor-pointer hover:scale-110 transition-transform shrink-0 ring-1 ring-black/10 dark:ring-white/20"
                                                                                        style={{ backgroundColor: stop.hex }}
                                                                                    />
                                                                                </AdvancedColorPicker>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </ScrollArea>
            )}
        </div>
    );
};

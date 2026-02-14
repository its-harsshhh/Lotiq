import { useState, useEffect, useRef, useMemo } from 'react';
import { useLottieStore } from '@/store/useLottieStore';
import { useSelectionStore } from '@/store/useSelectionStore';
import { toggleLayerVisibility, deleteLayer, renameLayer, groupLayers, ungroupLayer } from '@/engine/transformer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Eye, EyeOff, Trash2, Layers as LayersIcon, Folder, ChevronDown, ChevronRight,
    Copy, Group, Ungroup, Edit3, Square, Image, Shapes, Type, Crosshair
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Context Menu Component
interface ContextMenuProps {
    x: number;
    y: number;
    layerInd: number;
    layerName: string;
    isHidden: boolean;
    isGroup: boolean;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onToggleVisibility: () => void;
    onDuplicate: () => void;
    onGroup: () => void;
    onUngroup: () => void;
}

const ContextMenu = ({
    x, y, layerName, isHidden, isGroup,
    onClose, onRename, onDelete, onToggleVisibility, onDuplicate, onGroup, onUngroup
}: ContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const menuItems = [
        { icon: Edit3, label: 'Rename', shortcut: 'Enter', onClick: onRename },
        { icon: Copy, label: 'Duplicate', shortcut: '⌘D', onClick: onDuplicate },
        { type: 'separator' as const },
        { icon: isHidden ? Eye : EyeOff, label: isHidden ? 'Show' : 'Hide', shortcut: '⌘H', onClick: onToggleVisibility },
        { type: 'separator' as const },
        { icon: Group, label: 'Group Selection', shortcut: '⌘G', onClick: onGroup },
        ...(isGroup ? [{ icon: Ungroup, label: 'Ungroup', shortcut: '⌘⇧G', onClick: onUngroup }] : []),
        { type: 'separator' as const },
        { icon: Trash2, label: 'Delete', shortcut: '⌫', onClick: onDelete, danger: true },
    ];

    return (
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[200px] bg-popover text-popover-foreground border border-border rounded-lg shadow-xl py-1 animate-in fade-in-0 zoom-in-95"
            style={{ left: x, top: y }}
        >
            <div className="px-3 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground truncate block max-w-[180px]">{layerName}</span>
            </div>
            {menuItems.map((item, idx) => {
                if (item.type === 'separator') {
                    return <div key={idx} className="h-px bg-border my-1" />;
                }
                const Icon = item.icon;
                return (
                    <button
                        key={idx}
                        className={cn(
                            "w-full px-3 py-2 flex items-center gap-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                            item.danger ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-popover-foreground"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            item.onClick();
                            onClose();
                        }}
                    >
                        <Icon className="size-4" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.shortcut && (
                            <span className="text-xs text-muted-foreground opacity-70">{item.shortcut}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export const LayerList = () => {
    const lottie = useLottieStore((state) => state.lottie);
    const updateLottie = useLottieStore((state) => state.updateLottie);

    // Global selection state for cross-component highlighting
    const selectedLayerIds = useSelectionStore((state) => state.selectedLayerIds);
    const setSelectedLayerIds = useSelectionStore((state) => state.setSelectedLayerIds);
    const highlightedLayerIds = useSelectionStore((state) => state.highlightedLayerIds);

    // Local state
    const [editingLayerId, setEditingLayerId] = useState<number | null>(null);
    const [tempName, setTempName] = useState("");
    const [isExpanded, setIsExpanded] = useState(true);
    const [collapsedLayers, setCollapsedLayers] = useState<Set<number>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerInd: number } | null>(null);
    const [lastSelectedInd, setLastSelectedInd] = useState<number | null>(null);
    const [deleteLayerId, setDeleteLayerId] = useState<number | null>(null);
    const [isGrouping, setIsGrouping] = useState(false);
    const [newGroupName, setNewGroupName] = useState("Group 1");

    // Build layer hierarchy - find which layers are children of which
    const { layerDepthMap, layersWithChildren } = useMemo(() => {
        if (!lottie) return { layerDepthMap: new Map(), layersWithChildren: new Set() };

        const childrenMap = new Map<number, number[]>(); // parent ind -> children inds
        const depthMap = new Map<number, number>(); // layer ind -> depth level
        const hasChildren = new Set<number>();

        // First pass: build parent-child relationships
        lottie.layers.forEach(layer => {
            if (typeof layer.parent === 'number') {
                const children = childrenMap.get(layer.parent) || [];
                children.push(layer.ind);
                childrenMap.set(layer.parent, children);
                hasChildren.add(layer.parent);
            }
        });

        // Calculate depth for each layer
        const getDepth = (layerInd: number, visited = new Set<number>()): number => {
            if (visited.has(layerInd)) return 0;
            visited.add(layerInd);

            const layer = lottie.layers.find(l => l.ind === layerInd);
            if (!layer || typeof layer.parent !== 'number') return 0;
            return 1 + getDepth(layer.parent, visited);
        };

        lottie.layers.forEach(layer => {
            depthMap.set(layer.ind, getDepth(layer.ind));
        });

        return { layerChildrenMap: childrenMap, layerDepthMap: depthMap, layersWithChildren: hasChildren };
    }, [lottie]);

    // Check if a layer should be visible (not hidden by collapsed parent)
    const isLayerVisible = (layerInd: number): boolean => {
        if (!lottie) return true;
        const layer = lottie.layers.find(l => l.ind === layerInd);
        if (!layer) return true;

        // Check if any ancestor is collapsed
        let currentLayer = layer;
        while (typeof currentLayer.parent === 'number') {
            if (collapsedLayers.has(currentLayer.parent)) {
                return false;
            }
            const parentLayer = lottie.layers.find(l => l.ind === currentLayer.parent);
            if (!parentLayer) break;
            currentLayer = parentLayer;
        }
        return true;
    };

    if (!lottie) return null;

    const handleToggle = (index: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        updateLottie((draft) => {
            toggleLayerVisibility(draft, index);
        });
    };

    const handleSelect = (ind: number, e: React.MouseEvent) => {
        if (e.shiftKey && lastSelectedInd !== null) {
            const lastIdx = lottie.layers.findIndex(l => l.ind === lastSelectedInd);
            const currIdx = lottie.layers.findIndex(l => l.ind === ind);
            if (lastIdx !== -1 && currIdx !== -1) {
                const start = Math.min(lastIdx, currIdx);
                const end = Math.max(lastIdx, currIdx);
                const rangeIds = lottie.layers.slice(start, end + 1).map(l => l.ind);
                setSelectedLayerIds(Array.from(new Set([...selectedLayerIds, ...rangeIds])));
            }
        } else if (e.metaKey || e.ctrlKey) {
            if (selectedLayerIds.includes(ind)) {
                setSelectedLayerIds(selectedLayerIds.filter(id => id !== ind));
            } else {
                setSelectedLayerIds([...selectedLayerIds, ind]);
            }
            setLastSelectedInd(ind);
        } else {
            setSelectedLayerIds([ind]);
            setLastSelectedInd(ind);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, layerInd: number) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, layerInd });
    };

    const handleDoubleClick = (e: React.MouseEvent, layerInd: number) => {
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, layerInd });
    };

    const startEditing = (index: number, currentName: string) => {
        setEditingLayerId(index);
        setTempName(currentName);
    };

    const saveName = () => {
        if (editingLayerId !== null && tempName.trim()) {
            updateLottie((draft) => {
                renameLayer(draft, editingLayerId, tempName.trim());
            });
        }
        setEditingLayerId(null);
        setTempName("");
    };

    const handleKeyDownInput = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveName();
        else if (e.key === 'Escape') {
            setEditingLayerId(null);
            setTempName("");
        }
        e.stopPropagation();
    };

    const toggleLayerCollapse = (layerInd: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setCollapsedLayers(prev => {
            const next = new Set(prev);
            if (next.has(layerInd)) {
                next.delete(layerInd);
            } else {
                next.add(layerInd);
            }
            return next;
        });
    };

    const handleDuplicate = (layerInd: number) => {
        console.log('Duplicate layer:', layerInd);
    };

    const handleGroup = () => {
        if (selectedLayerIds.length > 0) {
            setNewGroupName("Group 1");
            setIsGrouping(true);
        }
    };

    const confirmGroup = () => {
        if (newGroupName.trim()) {
            updateLottie((draft) => {
                groupLayers(draft, selectedLayerIds, newGroupName.trim());
            });
            setSelectedLayerIds([]);
            setIsGrouping(false);
            setNewGroupName("Group 1");
        }
    };

    const handleUngroup = (layerInd: number) => {
        updateLottie((draft) => {
            ungroupLayer(draft, layerInd);
        });
    };

    // Global Shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
                e.preventDefault();
                if (e.shiftKey) {
                    // Ungroup selected layer if it's a group
                    // We need to know which layer is selected and if it is a group.
                    // For simplicity, if one group layer is selected, ungroup it.
                    if (selectedLayerIds.length === 1) {
                        // We need access to layer data to check if it is a group, or just try to ungroup.
                        // Since we are inside useEffect, we might not have fresh lottie state unless it's in dependency.
                        // But updateLottie handles the state update. We just need to trigger it.
                        // However, handleUngroup takes layerInd.
                        handleUngroup(selectedLayerIds[0]);
                    }
                } else {
                    handleGroup();
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [selectedLayerIds, updateLottie]);

    const isExpandable = (layerInd: number) => layersWithChildren.has(layerInd);
    const isGroup = (layer: any) => layer.ty === 3 || layer.ty === 0;

    const confirmDelete = () => {
        if (deleteLayerId !== null) {
            updateLottie((draft) => {
                deleteLayer(draft, deleteLayerId);
            });
            setDeleteLayerId(null);
        }
    };

    const getContextMenuLayer = () => {
        if (!contextMenu) return null;
        return lottie.layers.find(l => l.ind === contextMenu.layerInd);
    };

    // Get layer type icon with color
    const getLayerIcon = (type: number, isSelected: boolean) => {
        const baseClass = "size-3.5 shrink-0";
        const selectedClass = isSelected ? "text-white" : "";

        switch (type) {
            case 0: // Precomp
                return <Folder className={cn(baseClass, selectedClass || "text-purple-500")} />;
            case 1: // Solid
                return <Square className={cn(baseClass, selectedClass || "text-orange-500")} />;
            case 2: // Image
                return <Image className={cn(baseClass, selectedClass || "text-pink-500")} />;
            case 3: // Null/Group
                return <Crosshair className={cn(baseClass, selectedClass || "text-blue-500")} />;
            case 4: // Shape
                return <Shapes className={cn(baseClass, selectedClass || "text-emerald-500")} />;
            case 5: // Text
                return <Type className={cn(baseClass, selectedClass || "text-amber-500")} />;
            default:
                return <LayersIcon className={cn(baseClass, selectedClass || "text-zinc-500")} />;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            {/* Header */}
            <div
                className="px-4 py-3 border-b flex items-center gap-2 font-medium cursor-pointer hover:bg-muted/50 transition-colors text-foreground select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <LayersIcon className="size-4 text-muted-foreground" />
                <span className="text-sm">Layers</span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-normal">{lottie.layers.length}</span>
                    {isExpanded ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
                </div>
            </div>

            {/* Layer List */}
            {isExpanded && (
                <ScrollArea className="flex-1">
                    <div className="flex flex-col select-none">
                        {lottie.layers.map((layer) => {
                            // Skip if hidden by collapsed parent
                            if (!isLayerVisible(layer.ind)) return null;

                            const isSelected = selectedLayerIds.includes(layer.ind);
                            const isHighlighted = highlightedLayerIds.includes(layer.ind);
                            const hasChildren = isExpandable(layer.ind);
                            const isCollapsed = collapsedLayers.has(layer.ind);
                            const depth = layerDepthMap.get(layer.ind) || 0;

                            return (
                                <div
                                    key={layer.ind}
                                    onClick={(e) => handleSelect(layer.ind, e)}
                                    onContextMenu={(e) => handleContextMenu(e, layer.ind)}
                                    onDoubleClick={(e) => handleDoubleClick(e, layer.ind)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 text-sm group transition-colors cursor-pointer border-l-2",
                                        isSelected
                                            ? "bg-primary/10 border-primary text-primary font-medium"
                                            : "border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground",
                                        isHighlighted && !isSelected && "bg-amber-100 dark:bg-amber-500/20"
                                    )}
                                    style={{ paddingLeft: `${12 + depth * 16}px` }}
                                >
                                    {/* Expand/Collapse Chevron */}
                                    <div className="w-4 shrink-0 flex items-center justify-center">
                                        {hasChildren ? (
                                            <button
                                                onClick={(e) => toggleLayerCollapse(layer.ind, e)}
                                                className={cn(
                                                    "p-0.5 rounded-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
                                                    isSelected && "hover:bg-primary/20"
                                                )}
                                            >
                                                {isCollapsed ? (
                                                    <ChevronRight className="size-3" />
                                                ) : (
                                                    <ChevronDown className="size-3" />
                                                )}
                                            </button>
                                        ) : (
                                            <div className="w-3" />
                                        )}
                                    </div>

                                    {/* Layer Type Icon */}
                                    {getLayerIcon(layer.ty, false)}

                                    {/* Layer Name */}
                                    <div className="flex-1 min-w-0">
                                        {editingLayerId === layer.ind ? (
                                            <Input
                                                autoFocus
                                                value={tempName}
                                                onChange={(e) => setTempName(e.target.value)}
                                                onBlur={saveName}
                                                onKeyDown={handleKeyDownInput}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-6 text-xs px-1 py-0 bg-transparent border-primary/50 text-foreground"
                                            />
                                        ) : (
                                            <span
                                                className={cn(
                                                    "truncate block text-xs",
                                                    layer.hd && "opacity-50 line-through"
                                                )}
                                            >
                                                {layer.nm || `Layer ${layer.ind}`}
                                            </span>
                                        )}
                                    </div>

                                    {/* Right Side - Eye Icon */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                        <button
                                            className={cn(
                                                "p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
                                                layer.hd && "opacity-100 text-muted-foreground"
                                            )}
                                            onClick={(e) => handleToggle(layer.ind, e)}
                                        >
                                            {layer.hd ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            )}

            {/* Context Menu */}
            {contextMenu && getContextMenuLayer() && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    layerInd={contextMenu.layerInd}
                    layerName={getContextMenuLayer()?.nm || `Layer ${contextMenu.layerInd}`}
                    isHidden={getContextMenuLayer()?.hd || false}
                    isGroup={isGroup(getContextMenuLayer())}
                    onClose={() => setContextMenu(null)}
                    onRename={() => startEditing(contextMenu.layerInd, getContextMenuLayer()?.nm || `Layer ${contextMenu.layerInd}`)}
                    onDelete={() => setDeleteLayerId(contextMenu.layerInd)}
                    onToggleVisibility={() => handleToggle(contextMenu.layerInd)}
                    onDuplicate={() => handleDuplicate(contextMenu.layerInd)}
                    onGroup={handleGroup}
                    onUngroup={() => handleUngroup(contextMenu.layerInd)}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteLayerId !== null} onOpenChange={(open) => !open && setDeleteLayerId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Layer?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this layer? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteLayerId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Group Creation Dialog */}
            <Dialog open={isGrouping} onOpenChange={setIsGrouping}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Group Layers</DialogTitle>
                        <DialogDescription>
                            Enter a name for the new group.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Input
                            autoFocus
                            placeholder="Group Name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') confirmGroup();
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsGrouping(false)}>Cancel</Button>
                        <Button onClick={confirmGroup}>Create Group</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

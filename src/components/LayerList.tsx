import { useState, useEffect } from 'react';
import { useLottieStore } from '@/store/useLottieStore';
import { toggleLayerVisibility, deleteLayer, renameLayer, groupLayers } from '@/engine/transformer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Trash2, Layers as LayersIcon, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LayerList = () => {
    const lottie = useLottieStore((state) => state.lottie);
    const updateLottie = useLottieStore((state) => state.updateLottie);

    // Editing & Selection State
    const [editingLayerId, setEditingLayerId] = useState<number | null>(null);
    const [tempName, setTempName] = useState("");
    const [selectedLayerIds, setSelectedLayerIds] = useState<number[]>([]);

    if (!lottie) return null;

    const handleToggle = (index: number) => {
        updateLottie((draft) => {
            toggleLayerVisibility(draft, index);
        });
    };



    const [lastSelectedInd, setLastSelectedInd] = useState<number | null>(null);

    const handleSelect = (ind: number, e: React.MouseEvent) => {
        if (e.shiftKey && lastSelectedInd !== null) {
            // Range Selection
            const lastIdx = lottie.layers.findIndex(l => l.ind === lastSelectedInd);
            const currIdx = lottie.layers.findIndex(l => l.ind === ind);

            if (lastIdx !== -1 && currIdx !== -1) {
                const start = Math.min(lastIdx, currIdx);
                const end = Math.max(lastIdx, currIdx);

                const rangeIds = lottie.layers
                    .slice(start, end + 1)
                    .map(l => l.ind);

                // Merge with existing if command key is also held, otherwise replace? 
                // Standard behavior: Shift usually extends selection from anchor. 
                // We'll just add to selection to be safe or replace if no cmd key? 
                // Let's simpler: Union with current selection.
                setSelectedLayerIds(prev => Array.from(new Set([...prev, ...rangeIds])));
            }
        } else if (e.metaKey || e.ctrlKey) {
            // Toggle selection
            setSelectedLayerIds(prev =>
                prev.includes(ind) ? prev.filter(id => id !== ind) : [...prev, ind]
            );
            setLastSelectedInd(ind);
        } else {
            // Exclusive selection
            setSelectedLayerIds([ind]);
            setLastSelectedInd(ind);
        }
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
        if (e.key === 'Enter') {
            saveName();
        } else if (e.key === 'Escape') {
            setEditingLayerId(null);
            setTempName("");
        }
        e.stopPropagation(); // Prevent global shortcuts while editing
    };

    // Global Shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Group: Cmd/Ctrl + G
            if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
                e.preventDefault();
                if (selectedLayerIds.length > 0) {
                    const name = prompt("Enter group name:", "New Group");
                    if (name) {
                        updateLottie((draft) => {
                            groupLayers(draft, selectedLayerIds, name);
                        });
                        // Clear selection or select the new group?
                        setSelectedLayerIds([]);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [selectedLayerIds, updateLottie]);

    // Simple indentation helper (check if parent exists in the list)
    // Note: This assumes 1 level of parenting for simplicity or we check recursively?
    // Lottie parents are by ID. A layer can have a parent that has a parent.
    // We can do a quick check: does it have a parent attribute?
    const hasParent = (layer: any) => typeof layer.parent === 'number';

    const [deleteLayerId, setDeleteLayerId] = useState<number | null>(null);

    const confirmDelete = () => {
        if (deleteLayerId !== null) {
            updateLottie((draft) => {
                deleteLayer(draft, deleteLayerId);
            });
            setDeleteLayerId(null);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center gap-2 font-medium bg-muted/30">
                <LayersIcon className="size-4" />
                Layers
                <span className="ml-auto text-xs text-muted-foreground">{lottie.layers.length}</span>
            </div>

            <ScrollArea className="flex-1">
                <div className="flex flex-col select-none">
                    {lottie.layers.map((layer) => {
                        const isSelected = selectedLayerIds.includes(layer.ind);
                        const isGroup = layer.ty === 3; // Null layer acting as group

                        return (
                            <div
                                key={layer.ind}
                                onClick={(e) => handleSelect(layer.ind, e)}
                                className={cn(
                                    "flex items-center gap-3 p-3 text-sm border-b border-border/40 group transition-colors cursor-pointer",
                                    isSelected ? "bg-accent/80 text-accent-foreground" : "hover:bg-muted/50",
                                    hasParent(layer) && "pl-8 border-l-4 border-l-transparent ml-2" // Indent
                                )}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                                    onClick={(e) => { e.stopPropagation(); handleToggle(layer.ind); }}
                                >
                                    {layer.hd ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                </Button>

                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                    {isGroup && <Folder className="size-3 text-blue-400 fill-blue-400/20" />}

                                    {editingLayerId === layer.ind ? (
                                        <Input
                                            autoFocus
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onBlur={saveName}
                                            onKeyDown={handleKeyDownInput}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-6 text-xs px-1 py-0"
                                        />
                                    ) : (
                                        <div
                                            className="truncate font-medium w-full"
                                            onDoubleClick={(e) => { e.stopPropagation(); startEditing(layer.ind, layer.nm || `Layer ${layer.ind}`); }}
                                        >
                                            {layer.nm || `Layer ${layer.ind}`}
                                        </div>
                                    )}
                                </div>

                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0 opacity-50">
                                    {getLayerType(layer.ty)}
                                </span>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={(e) => { e.stopPropagation(); setDeleteLayerId(layer.ind); }}
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

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
        </div>
    );
};

function getLayerType(type: number) {
    switch (type) {
        case 0: return 'Precomp';
        case 1: return 'Solid';
        case 2: return 'Image';
        case 3: return 'Null';
        case 4: return 'Shape';
        case 5: return 'Text';
        default: return 'Unknown';
    }
}

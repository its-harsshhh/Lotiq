import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { useLottieStore } from '@/store/useLottieStore';
import { usePlaybackStore } from '@/store/usePlaybackStore';

import { Button } from './ui/button';
import { Player } from './Player';
import { Controls } from './Controls';
import { InspectorLeft } from './InspectorLeft';
import { InspectorRight } from './InspectorRight';
import { CropModal } from './CropModal';
import { ResizableLayout } from './ui/ResizableLayout';
import { LandingPage } from './LandingPage';
import { ModeToggle } from './mode-toggle';
import { EmptyState } from './EmptyState';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { ExportProgress } from './ExportProgress'; // Import Progress Component

export const MainLayout = () => {
    const lottie = useLottieStore((state) => state.lottie);
    const isEditorMode = useLottieStore((state) => state.isEditorMode);
    const fileName = useLottieStore((state) => state.fileName);
    const togglePlay = usePlaybackStore((state) => state.togglePlay);
    const undo = useLottieStore((state) => state.undo);
    const redo = useLottieStore((state) => state.redo);
    const renameLottie = useLottieStore((state) => state.renameLottie);
    const hasExportedThisSession = useLottieStore((state) => state.hasExportedThisSession);
    const history = useLottieStore((state) => state.history);
    const [isCropOpen, setIsCropOpen] = useState(false);
    const [editingName, setEditingName] = useState<string | null>(null);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    useEffect(() => {
        if (fileName && editingName === null) {
            // setEditingName(fileName); 
            // Better to just not set it until edit mode? 
            // Actually let's just use fileName unless editing.
        }
    }, [fileName]);

    const handleNameBlur = () => {
        if (editingName !== null && editingName.trim() !== "") {
            renameLottie(editingName);
        }
        setEditingName(null);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCmdOrCtrl = e.metaKey || e.ctrlKey;
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            // Undo / Redo
            if (isCmdOrCtrl && !isInput) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                    return;
                }
                if (e.key === 'y') { // Common Redo on Windows
                    e.preventDefault();
                    redo();
                    return;
                }
            }

            // Spacebar Play/Pause
            if (e.code === 'Space') {
                if (isInput) {
                    return;
                }
                e.preventDefault();
                togglePlay();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, undo, redo]);

    if (isEditorMode) {
        return (
            <div className="h-screen w-full flex flex-col">
                <header className="border-b h-14 flex items-center px-4 justify-between bg-card z-20 relative">
                    <div
                        className="font-bold text-xl tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                            const hasEdits = history.length > 1;
                            if (hasEdits && !hasExportedThisSession) {
                                setShowCloseConfirm(true);
                            } else {
                                window.location.reload();
                            }
                        }}
                    >
                        Lotiq
                    </div>
                    <label className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-sm group flex items-center gap-2 cursor-pointer">
                        <input
                            className="bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 min-w-[100px] hover:bg-muted/50 transition-colors"
                            value={editingName !== null ? editingName : fileName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleNameBlur}
                            onKeyDown={handleNameKeyDown}
                        />
                        <Pencil className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </label>
                    <div className="flex items-center gap-2">
                        <ModeToggle />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                // Check if there are unsaved changes
                                // Logic: If history has more than 1 item (initial state) AND we haven't exported since last change
                                // Actually simplistic: if we have history > 1 (meaning edits happened) and !hasExportedThisSession
                                // But hasExportedThisSession resets on edit. So if !hasExportedThisSession, we might have unsaved changes.
                                // But we need to distinguish "Active Session with Edits" vs "Just Loaded".
                                // If history.length > 1, we definitely edited.
                                const hasEdits = history.length > 1;
                                if (hasEdits && !hasExportedThisSession) {
                                    setShowCloseConfirm(true);
                                } else {
                                    window.location.reload();
                                }
                            }}
                        >
                            Close
                        </Button>
                    </div>
                </header>

                <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Unexported Changes</DialogTitle>
                            <DialogDescription>
                                You haven't exported your latest changes. Since there are no accounts, your work won't be saved if you leave. Are you sure you want to exit?
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCloseConfirm(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => window.location.reload()}>Close Anyway</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="flex-1 min-h-0 overflow-hidden">
                    <ResizableLayout
                        leftPanel={<InspectorLeft />}
                        centerPanel={
                            <div className="h-full flex flex-col min-w-0 bg-muted/20 relative">
                                {lottie ? (
                                    <>
                                        <Player />
                                        <Controls onCrop={() => setIsCropOpen(true)} />
                                        <ExportProgress />
                                    </>
                                ) : (
                                    <EmptyState />
                                )}
                            </div>
                        }
                        rightPanel={<InspectorRight />}
                        leftDefaultWidth={280}
                        rightDefaultWidth={280}
                        minWidth={200}
                        maxWidth={400}
                    />
                </div>

                <CropModal open={isCropOpen} onClose={() => setIsCropOpen(false)} />
            </div>
        );
    }

    return <LandingPage />;
};

import { useState, useEffect } from 'react';
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

export const MainLayout = () => {
    const lottie = useLottieStore((state) => state.lottie);
    const isEditorMode = useLottieStore((state) => state.isEditorMode);
    const fileName = useLottieStore((state) => state.fileName);
    const togglePlay = usePlaybackStore((state) => state.togglePlay);
    const undo = useLottieStore((state) => state.undo);
    const redo = useLottieStore((state) => state.redo);
    const renameLottie = useLottieStore((state) => state.renameLottie);
    const [isCropOpen, setIsCropOpen] = useState(false);
    const [editingName, setEditingName] = useState<string | null>(null);

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
                    <div className="font-bold text-xl tracking-tight">Lotiq</div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-sm">
                        <input
                            className="bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 min-w-[100px]"
                            value={editingName !== null ? editingName : fileName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleNameBlur}
                            onKeyDown={handleNameKeyDown}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <ModeToggle />
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Close</Button>
                    </div>
                </header>

                <div className="flex-1 min-h-0 overflow-hidden">
                    <ResizableLayout
                        leftPanel={<InspectorLeft />}
                        centerPanel={
                            <div className="h-full flex flex-col min-w-0 bg-muted/20 relative">
                                {lottie ? (
                                    <>
                                        <Player />
                                        <Controls onCrop={() => setIsCropOpen(true)} />
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

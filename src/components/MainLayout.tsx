import { useState, useEffect } from 'react';
import { useLottieStore } from '@/store/useLottieStore';
import { usePlaybackStore } from '@/store/usePlaybackStore';
import { DropZone } from './DropZone';
import { UrlLoader } from './UrlLoader';
import { PasteHandler } from './PasteHandler';
import { Button } from './ui/button';
import { Player } from './Player';
import { Controls } from './Controls';
import { InspectorLeft } from './InspectorLeft';
import { InspectorRight } from './InspectorRight';
import { CropModal } from './CropModal';
import { ResizableLayout } from './ui/ResizableLayout';

export const MainLayout = () => {
    const lottie = useLottieStore((state) => state.lottie);
    const fileName = useLottieStore((state) => state.fileName);
    const togglePlay = usePlaybackStore((state) => state.togglePlay);
    const undo = useLottieStore((state) => state.undo);
    const redo = useLottieStore((state) => state.redo);
    const [isCropOpen, setIsCropOpen] = useState(false);

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

    if (lottie) {
        return (
            <div className="h-screen w-full flex flex-col">
                <header className="border-b h-14 flex items-center px-4 justify-between bg-card z-20 relative">
                    <div className="font-bold text-xl tracking-tight">Lotiq</div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-sm">
                        {fileName}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Close</Button>
                </header>

                <div className="flex-1 min-h-0 overflow-hidden">
                    <ResizableLayout
                        leftPanel={<InspectorLeft />}
                        centerPanel={
                            <div className="h-full flex flex-col min-w-0 bg-muted/20 relative">
                                <Player />
                                <Controls onCrop={() => setIsCropOpen(true)} />
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

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4 relative">
            <PasteHandler />
            <div className="max-w-2xl w-full flex flex-col gap-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Lotiq</h1>
                    <p className="text-muted-foreground">Fast, local Lottie editor. Drop a file or paste JSON to start.</p>
                </div>

                <div className="w-full">
                    <DropZone />
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or load from URL</span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <UrlLoader />
                </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground p-4">
                <p>
                    Built by <span className="font-bold text-foreground">Harsh aka chole bhature</span>. You can reach out to me through{' '}
                    <a
                        href="https://www.linkedin.com/in/its-harsshhh/"
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                        LinkedIn
                    </a>
                    {' '}or{' '}
                    <a
                        href="https://x.com/Choley_Bhature"
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                        X
                    </a>
                </p>
            </div>
        </div>
    );
};

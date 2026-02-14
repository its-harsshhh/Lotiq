import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Pencil, Coffee, Check } from 'lucide-react';
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
    const [isSaved, setIsSaved] = useState(false);

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
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
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
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-screen w-full flex flex-col bg-background text-foreground"
            >
                <header className="h-14 flex items-center px-4 justify-between bg-background/80 backdrop-blur-xl border-b border-border/40 z-20 relative select-none">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
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
                        {/* Logo with better dark mode handling */}
                        <div className="relative h-7 w-auto">
                            <img src="/logo/logo-light-mode.svg" alt="Lotiq" className="h-full w-auto dark:hidden" />
                            <img src="/logo/logo-dark-mode.svg" alt="Lotiq" className="h-full w-auto hidden dark:block" />
                        </div>
                    </motion.div>

                    {/* Filename Input - Centered with premium interaction */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-1.5 group">
                        <div className="relative flex items-center">
                            <input
                                className={cn(
                                    "bg-transparent text-center font-bold text-sm focus:outline-none transition-all duration-300 rounded-lg px-3 py-1.5 min-w-[140px] placeholder:text-muted-foreground/30",
                                    editingName !== null
                                        ? "bg-muted shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_-5px_rgba(255,255,255,0.05)] ring-1 ring-border"
                                        : "hover:bg-muted/50 cursor-pointer"
                                )}
                                value={editingName !== null ? editingName : (fileName || "Untitled")}
                                onChange={(e) => setEditingName(e.target.value)}
                                onFocus={(e) => {
                                    if (editingName === null) setEditingName(fileName || "");
                                    e.currentTarget.select();
                                }}
                                onBlur={handleNameBlur}
                                onKeyDown={handleNameKeyDown}
                                spellCheck={false}
                                style={{ width: `${Math.max((editingName !== null ? editingName : (fileName || "Untitled")).length * 8.5 + 40, 140)}px` }}
                            />

                            <div className="absolute -right-7 flex items-center justify-center">
                                <AnimatePresence mode="wait">
                                    {isSaved ? (
                                        <motion.div
                                            key="saved"
                                            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            className="text-green-500"
                                        >
                                            <Check className="size-3.5 stroke-[3]" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="pencil"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: editingName !== null ? 0 : (fileName ? 0.4 : 0) }}
                                            whileHover={{ opacity: 0.8, scale: 1.1 }}
                                            className="text-muted-foreground transition-opacity"
                                        >
                                            <Pencil className="size-3 cursor-pointer" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Focus glow effect */}
                            {editingName !== null && (
                                <motion.div
                                    layoutId="input-glow"
                                    className="absolute inset-0 -z-10 bg-indigo-500/5 blur-xl rounded-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                size="sm"
                                className="relative overflow-hidden h-8 gap-2 bg-gradient-to-r from-amber-300 to-orange-400 text-black hover:from-amber-400 hover:to-orange-500 font-semibold border-0 hidden sm:flex rounded-full px-4 shadow-lg shadow-orange-500/20 group transition-all"
                                onClick={() => {
                                    window.open('https://buymeacoffee.com/harshpal', '_blank');
                                }}
                            >
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-[100%]"
                                    animate={{ translateX: ["-100%", "200%"] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2.5,
                                        ease: "easeInOut",
                                        repeatDelay: 4
                                    }}
                                />
                                <Coffee className="size-3.5 relative z-10" />
                                <span className="text-xs relative z-10">Buy me a coffee</span>
                            </Button>
                        </motion.div>

                        <div className="h-4 w-px bg-border/50 mx-1" /> {/* Divider */}

                        <ModeToggle />

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                onClick={() => {
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
                        </motion.div>
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
                            <div className="h-full flex flex-col min-w-0 bg-zinc-50/50 dark:bg-zinc-950/50 relative">
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
            </motion.div>
        );
    }

    return <LandingPage />;
};

import { useLottieStore } from '@/store/useLottieStore';
import { useCompareStore } from '@/store/useCompareStore';
import { Button } from './ui/button';
import { ArrowLeft, GitCompare } from 'lucide-react';
import { CompareDropZone } from './CompareDropZone';
import { CompareUrlLoader } from './CompareUrlLoader';
import { ComparePlayer } from './ComparePlayer';
import { CompareControls } from './CompareControls';
import { ModeToggle } from './mode-toggle';
import { ComparePreviewPlayer } from './ComparePreviewPlayer';
import { TrySampleCompare } from './TrySampleCompare';

export const CompareLayout = () => {
    const setAppMode = useLottieStore((state) => state.setAppMode);
    const { lottieA, lottieB, setLottieA, setLottieB } = useCompareStore();

    return (
        <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden">
            {/* Header */}
            <header className="h-14 flex items-center px-4 justify-between bg-background/80 backdrop-blur-xl border-b border-border/40 z-20 relative select-none">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAppMode('editor')}
                        className="rounded-full hover:bg-muted"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <GitCompare className="w-5 h-5 text-indigo-500" />
                        <h1 className="font-bold text-lg">Compare Lotties</h1>
                    </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-3">
                    <ModeToggle />
                    <div className="w-[100px]"></div> {/* Spacer to balance the layout */}
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 flex flex-col bg-white dark:bg-zinc-950 relative">

                {/* Condition: Both loaded -> Show Dual Player */}
                {lottieA && lottieB ? (
                    <>
                        <div className="flex-1 w-full h-full relative">
                            <ComparePlayer />
                        </div>
                        <CompareControls />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col md:flex-row w-full h-full">
                        {/* Lottie A Dropzone / Player */}
                        <div className="flex-1 border-b md:border-b-0 md:border-r border-border/40 flex items-center justify-center p-8 bg-white dark:bg-zinc-950">
                            {!lottieA ? (
                                <div className="flex flex-col items-center max-w-sm w-full">
                                    <CompareDropZone
                                        onLoad={(json, name) => setLottieA(json, name)}
                                        label="Drop Lottie A here"
                                    />
                                    <CompareUrlLoader onLoad={(json, name) => setLottieA(json, name)} />
                                    <TrySampleCompare onLoad={(json, name) => setLottieA(json, name)} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 w-full">
                                    <div className="w-full h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-border/40 shadow-inner overflow-hidden">
                                        <ComparePreviewPlayer data={lottieA} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Lottie A Loaded</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Upload Lottie B to start the comparison</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setLottieA(null)} className="h-8 gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/40">
                                        Remove A
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Lottie B Dropzone / Player */}
                        <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-zinc-950">
                            {!lottieB ? (
                                <div className="flex flex-col items-center max-w-sm w-full">
                                    <CompareDropZone
                                        onLoad={(json, name) => setLottieB(json, name)}
                                        label="Drop Lottie B here"
                                    />
                                    <CompareUrlLoader onLoad={(json, name) => setLottieB(json, name)} />
                                    <TrySampleCompare onLoad={(json, name) => setLottieB(json, name)} />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 w-full">
                                    <div className="w-full h-48 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-border/40 shadow-inner overflow-hidden">
                                        <ComparePreviewPlayer data={lottieB} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">Lottie B Loaded</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Upload Lottie A to start the comparison</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setLottieB(null)} className="h-8 gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/40">
                                        Remove B
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

import { useState } from "react";
import { ColorPalette } from "./ColorPalette";
import { ExportPanel } from "./ExportPanel";
import { CanvasControls } from "./CanvasControls";
import { ImageManager } from "./ImageManager/ImageManager";
import { cn } from "@/lib/utils";
import { Palette, ImageIcon } from "lucide-react";

export const InspectorRight = () => {
    const [activeTab, setActiveTab] = useState<'colors' | 'images'>('colors');

    return (
        <div className="w-80 border-l bg-background flex flex-col h-full">
            {/* Top - Canvas properties */}
            <CanvasControls />

            {/* Tabs */}
            <div className="flex border-b">
                <button
                    onClick={() => setActiveTab('colors')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'colors'
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                >
                    <Palette className="w-4 h-4" />
                    Colors
                </button>
                <button
                    onClick={() => setActiveTab('images')}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'images'
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                >
                    <ImageIcon className="w-4 h-4" />
                    Images
                    <span className="ml-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 text-[10px] font-bold leading-none">
                        BETA
                    </span>
                </button>
            </div>

            {/* Middle - Content */}
            <div className="flex-1 min-h-0 flex flex-col relative">
                <div className={cn("absolute inset-0 flex flex-col bg-background z-10", activeTab === 'colors' ? 'visible' : 'hidden')}>
                    <ColorPalette />
                </div>
                <div className={cn("absolute inset-0 flex flex-col bg-background z-10", activeTab === 'images' ? 'visible' : 'hidden')}>
                    <ImageManager />
                </div>
            </div>

            {/* Bottom - Export. Always visible? Or should ImageManager take over full height? 
                Usually Export is key action. Let's keep it visible at bottom. */}
            <ExportPanel />
        </div>
    );
};

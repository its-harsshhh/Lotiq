import { useState, useEffect } from "react";
import { useLottieStore } from "@/store/useLottieStore";
import { Loader2, X, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export const ExportProgress = () => {
    const isExporting = useLottieStore((state) => state.isExporting);
    const progress = useLottieStore((state) => state.exportProgress);
    const status = useLottieStore((state) => state.exportStatus);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Auto-show when exporting starts
    useEffect(() => {
        if (isExporting) {
            setIsVisible(true);
            setIsCollapsed(false);
        }
    }, [isExporting]);

    if (!isVisible && !isExporting) return null;

    return (
        <div
            className={cn(
                "absolute right-0 top-10 z-50 flex items-start transition-all duration-300",
                isCollapsed ? "translate-x-[calc(100%-32px)]" : "translate-x-0"
            )}
        >
            {/* Toggle Tab */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="bg-background border border-r-0 rounded-l-md p-1 mt-2 shadow-sm hover:bg-muted"
            >
                {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Main Panel */}
            <div className="bg-background border rounded-bl-md shadow-lg w-64 overflow-hidden">
                <div className="p-3 border-b flex items-center justify-between bg-muted/30">
                    <span className="text-xs font-semibold">Exporting...</span>
                    {!isExporting && (
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsVisible(false)}>
                            <X className="w-3 h-3" />
                        </Button>
                    )}
                </div>

                <div className="p-4 space-y-4">
                    {/* Status & Icon */}
                    <div className="flex items-center gap-3">
                        {isExporting ? (
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{isExporting ? "Processing" : "Completed"}</span>
                            <span className="text-[10px] text-muted-foreground">{status}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300 ease-out"
                                style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{Math.round(progress * 100)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

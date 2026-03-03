import { DropZone } from "./DropZone";
import { UrlLoader } from "./UrlLoader";
import { Button } from "./ui/button";
import { useLottieStore } from "@/store/useLottieStore";
import { GitCompare } from "lucide-react";
import { TrySampleLottie } from "./TrySampleLottie";

export const EmptyState = () => {
    const setAppMode = useLottieStore((state) => state.setAppMode);

    return (
        <div className="w-full h-full flex items-center justify-center p-8 bg-muted/10 relative overflow-hidden">
            <div className="max-w-md w-full space-y-8 flex flex-col items-center relative z-10">
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Empty Page</h3>
                    <p className="text-sm text-muted-foreground">Upload a Lottie animation to start editing.</p>
                </div>

                <div className="w-full bg-background rounded-2xl p-2 shadow-sm border">
                    <DropZone />
                </div>

                <div className="w-full relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-muted/10 px-2 text-muted-foreground">Or load URL</span>
                    </div>
                </div>

                <UrlLoader />

                <div className="pt-2">
                    <TrySampleLottie />
                </div>

                <div className="pt-4 w-full flex flex-col items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => setAppMode('compare')}
                        className="w-full h-12 rounded-xl group relative overflow-hidden flex items-center gap-2 font-medium"
                    >
                        <div className="absolute inset-0 bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors" />
                        <GitCompare className="w-5 h-5 text-indigo-500" />
                        <span className="text-indigo-600 dark:text-indigo-400">Launch Comparison Tool</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

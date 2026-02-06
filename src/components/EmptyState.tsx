import { DropZone } from "./DropZone";
import { UrlLoader } from "./UrlLoader";

export const EmptyState = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-8 bg-muted/10">
            <div className="max-w-md w-full space-y-8 flex flex-col items-center">
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
            </div>
        </div>
    );
};

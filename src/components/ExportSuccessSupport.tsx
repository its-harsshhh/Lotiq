import { Button } from '@/components/ui/button';
import { Check, Coffee } from 'lucide-react';

interface ExportSuccessSupportProps {
    showSupport?: boolean;
}

export const ExportSuccessSupport = ({ showSupport = true }: ExportSuccessSupportProps) => {
    return (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Pure Success State */}
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-500 px-1">
                <Check className="size-4" />
                <span>Exported successfully</span>
            </div>

            {showSupport && (
                <>
                    {/* Divider */}
                    <div className="h-px bg-border my-3" />

                    {/* Secondary Support Block */}
                    <div className="space-y-3 px-1 pb-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                                Saved you a few minutes?
                            </p>
                            <p className="text-xs font-bold text-foreground">
                                Support Lotiq
                            </p>
                        </div>

                        <Button
                            size="sm"
                            className="w-full h-9 text-xs gap-2 bg-[#FFDD00] text-black hover:bg-[#FFDD00]/90 font-bold border-0"
                            onClick={() => {
                                window.open('https://buymeacoffee.com/harshpal', '_blank');
                            }}
                        >
                            <Coffee className="size-3.5" />
                            Support Lotiq
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

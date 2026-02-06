
import { useLottieStore } from '@/store/useLottieStore';
import { updateCanvasSize } from '@/engine/transformer';
import { Input } from '@/components/ui/input';
import { Maximize } from 'lucide-react';

export const CanvasControls = () => {
    const lottie = useLottieStore((state) => state.lottie);
    const updateLottie = useLottieStore((state) => state.updateLottie);

    if (!lottie) return null;

    const handleResize = (w: number, h: number) => {
        updateLottie((draft) => {
            updateCanvasSize(draft, w, h);
        });
    };

    return (
        <div className="p-3 border-b border-border bg-muted/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1">
                <Maximize className="size-3.5" />
                Canvas
            </div>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground pointer-events-none">W</span>
                    <Input
                        type="number"
                        value={lottie.w}
                        onChange={(e) => handleResize(Number(e.target.value), lottie.h)}
                        className="h-7 text-xs pl-6 bg-background/50 border-zinc-700/50"
                    />
                </div>
                <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground pointer-events-none">H</span>
                    <Input
                        type="number"
                        value={lottie.h}
                        onChange={(e) => handleResize(lottie.w, Number(e.target.value))}
                        className="h-7 text-xs pl-6 bg-background/50 border-zinc-700/50"
                    />
                </div>
            </div>
        </div>
    );
};

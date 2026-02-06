import { useLottieStore } from '@/store/useLottieStore';
import { updateCanvasSize } from '@/engine/transformer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
        <div className="p-4 border-b border-border bg-muted/30 flex flex-col gap-4">
            <div>
                <div className="flex items-center gap-2 font-medium mb-3">
                    <Maximize className="size-4" />
                    Canvas
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="width" className="text-xs text-muted-foreground uppercase">Width</Label>
                        <Input
                            id="width"
                            type="number"
                            value={lottie.w}
                            onChange={(e) => handleResize(Number(e.target.value), lottie.h)}
                            className="h-8"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="height" className="text-xs text-muted-foreground uppercase">Height</Label>
                        <Input
                            id="height"
                            type="number"
                            value={lottie.h}
                            onChange={(e) => handleResize(lottie.w, Number(e.target.value))}
                            className="h-8"
                        />
                    </div>
                </div>
            </div>


        </div>
    );
};






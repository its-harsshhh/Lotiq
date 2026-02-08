import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlaybackStore } from "@/store/usePlaybackStore";
import { useLottieStore } from "@/store/useLottieStore";
import { Play, Pause, Crop, Smartphone } from "lucide-react";

interface ControlsProps {
    onCrop?: () => void;
}

export const Controls = ({ onCrop }: ControlsProps) => {
    const { isPlaying, progress, speed, currentFrame, totalFrames } = usePlaybackStore();
    const { togglePlay, setProgress, setPlaying, setSpeed } = usePlaybackStore();

    const handleScrub = (value: number[]) => {
        // Pause while scrubbing
        if (isPlaying) setPlaying(false);
        setProgress(value[0]);
    };

    const toggleSpeed = () => {
        const speeds = [0.5, 1, 2];
        const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
        setSpeed(speeds[nextIdx]);
    };

    // Format frames as generic "time"
    const formatTime = (frame: number) => {
        return Math.floor(frame).toString().padStart(3, '0');
    };

    return (
        <div className="h-16 border-t bg-card flex items-center px-4 gap-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
            </div>

            <div className="flex-1 flex flex-col gap-1">
                <Slider
                    value={[progress]}
                    max={1}
                    step={0.001}
                    onValueChange={handleScrub}
                    className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground w-full px-1">
                    <span>{formatTime(currentFrame)}f</span>
                    <span>{formatTime(totalFrames)}f</span>
                </div>
            </div>

            <div className="flex items-center gap-2 border-l pl-4">
                <Button variant="ghost" size="sm" onClick={toggleSpeed} className="w-16 font-mono">
                    {speed}x
                </Button>
                {onCrop && (
                    <Button variant="ghost" size="icon" onClick={onCrop} title="Crop Animation">
                        <Crop className="h-4 w-4" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => useLottieStore.getState().setSocialModalOpen(true)} title="Social Post">
                    <Smartphone className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

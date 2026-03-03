import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import lottie from 'lottie-web';
import type { LottieJSON } from '@/engine/lottie-schema';

const SAMPLE_LOTTIES = [
    {
        id: 'lotty-1',
        name: 'Love Cat',
        url: '/samples/Cat feeling love emotionsexpression. Emojisticker animation.json',
    },
    {
        id: 'lotty-2',
        name: 'Cute Doggie',
        url: '/samples/Cute Doggie.json',
    },
    {
        id: 'lotty-3',
        name: 'Valentine Day',
        url: '/samples/Happy Valentine Day.json',
    },
    {
        id: 'lotty-4',
        name: 'Showtime',
        url: '/samples/Showtime.json',
    },
    {
        id: 'lotty-5',
        name: 'Bear Love Couples',
        url: '/samples/Valentines Day.json',
    }
];

const LottiePreview = ({ url }: { url: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!containerRef.current) return;
        const anim = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: url,
        });
        return () => anim.destroy();
    }, [url]);
    return <div ref={containerRef} className="w-full h-full" />;
};

interface TrySampleCompareProps {
    onLoad: (json: LottieJSON, fileName: string) => void;
}

export const TrySampleCompare = ({ onLoad }: TrySampleCompareProps) => {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const handleSelectSample = async (sample: typeof SAMPLE_LOTTIES[0]) => {
        setLoadingId(sample.id);
        try {
            const response = await fetch(sample.url);
            const json = await response.json();
            onLoad(json, `${sample.name}.json`);
            setOpen(false);
        } catch (error) {
            console.error("Failed to load sample lottie", error);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="link"
                    className="text-muted-foreground hover:text-primary text-[10px] gap-1.5 h-auto p-0 font-medium group transition-all mt-2"
                >
                    <Sparkles className="w-3 h-3 group-hover:animate-pulse" />
                    Try a sample
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border border-border/40 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Pick a Sample</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Select an animation to load into this comparison slot.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[50vh] -mr-4 pr-4 mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
                        {SAMPLE_LOTTIES.map((sample) => (
                            <motion.button
                                key={sample.id}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSelectSample(sample)}
                                disabled={loadingId !== null}
                                className="flex items-center gap-4 p-3 rounded-xl border border-border/40 bg-muted/20 text-left relative overflow-hidden group"
                            >
                                <div className="w-12 h-12 shrink-0 bg-white dark:bg-zinc-900 rounded-lg border border-border/20 flex items-center justify-center relative overflow-hidden p-1">
                                    <LottiePreview url={sample.url} />
                                    {loadingId === sample.id && (
                                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-semibold truncate flex-1">{sample.name}</span>
                            </motion.button>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

import { useState, useEffect, useRef } from 'react';
import { useLottieStore } from '@/store/useLottieStore';
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

export const TrySampleLottie = () => {
    const loadLottie = useLottieStore((state) => state.loadLottie);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    const handleSelectSample = async (sample: typeof SAMPLE_LOTTIES[0]) => {
        setLoadingId(sample.id);
        try {
            const response = await fetch(sample.url);
            const json = await response.json();
            loadLottie(json, `${sample.name}.json`);
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
                    className="text-muted-foreground hover:text-primary text-xs gap-1.5 h-auto p-0 font-medium group transition-all"
                >
                    <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
                    Don't have a Lottie? Try a sample
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] border border-border/40 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Try Lotiq with Samples</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Select a sample animation to see how Lotiq works.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] -mr-4 pr-4 mt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-6">
                        {SAMPLE_LOTTIES.map((sample) => (
                            <motion.button
                                key={sample.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleSelectSample(sample)}
                                disabled={loadingId !== null}
                                className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-all text-center relative overflow-hidden group"
                            >
                                <div className="w-full aspect-square bg-white dark:bg-zinc-900 rounded-xl border border-border/20 flex items-center justify-center relative overflow-hidden p-2">
                                    <LottiePreview url={sample.url} />

                                    {loadingId === sample.id && (
                                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-20">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-semibold truncate w-full px-1">{sample.name}</span>
                            </motion.button>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

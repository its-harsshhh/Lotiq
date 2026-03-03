import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link, AlertCircle } from 'lucide-react';
import type { LottieJSON } from '@/engine/lottie-schema';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface CompareUrlLoaderProps {
    onLoad: (json: LottieJSON, fileName: string) => void;
}

export const CompareUrlLoader = ({ onLoad }: CompareUrlLoaderProps) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLoad = async () => {
        if (!url) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch');
            const json = await response.json();

            if (json.v && json.layers) {
                onLoad(json, url.split('/').pop() || 'remote.json');
                setUrl('');
            } else {
                setError("The URL returned valid JSON, but it doesn't look like a valid Lottie animation.");
            }
        } catch (error) {
            console.error(error);
            setError("Failed to load Lottie from the provided URL. Please check the link and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center gap-4 mt-4">
            <div className="w-full relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center -z-10">
                    <div className="w-full border-t border-zinc-100 dark:border-zinc-800" />
                </div>
                <span className="relative z-10 bg-white dark:bg-zinc-950 px-4 text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-widest">
                    Or load URL
                </span>
            </div>

            <div className="flex w-full items-center space-x-2">
                <div className="relative flex-1">
                    <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="url"
                        placeholder="Paste URL..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="pl-9 h-10 w-full"
                        onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
                    />
                </div>
                <Button disabled={!url || loading} onClick={handleLoad} variant="secondary" className="h-10">
                    {loading ? '...' : 'Load'}
                </Button>
            </div>

            <Dialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <DialogTitle>Error Loading Lottie</DialogTitle>
                        </div>
                        <DialogDescription className="pt-2">
                            {error}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setError(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLottieStore } from '@/store/useLottieStore';
import { Link, AlertCircle } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export const UrlLoader = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const loadLottie = useLottieStore((state) => state.loadLottie);

    const handleLoad = async () => {
        if (!url) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch');
            const json = await response.json();
            // Basic validation
            if (json.v && json.layers) {
                loadLottie(json, url.split('/').pop() || 'remote.json');
                setUrl(''); // Clear input on success
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
        <>
            <div className="flex w-full max-w-sm items-center space-x-2">
                <div className="relative flex-1">
                    <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="url"
                        placeholder="Paste Lottie URL..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="pl-9"
                        onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
                    />
                </div>
                <Button disabled={!url || loading} onClick={handleLoad}>
                    {loading ? 'Loading...' : 'Load'}
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
        </>
    );
};

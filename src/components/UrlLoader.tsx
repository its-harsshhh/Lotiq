import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLottieStore } from '@/store/useLottieStore';
import { Link } from 'lucide-react';

export const UrlLoader = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const loadLottie = useLottieStore((state) => state.loadLottie);

    const handleLoad = async () => {
        if (!url) return;
        setLoading(true);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch');
            const json = await response.json();
            // Basic validation
            if (json.v && json.layers) {
                loadLottie(json, url.split('/').pop() || 'remote.json');
            } else {
                alert("Invalid Lottie JSON from URL");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to load Lottie from URL");
        } finally {
            setLoading(false);
        }
    };

    return (
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
    );
};

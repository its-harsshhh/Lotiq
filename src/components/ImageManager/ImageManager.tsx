import { useLottieStore } from '@/store/useLottieStore';
import { ImageRow } from './ImageRow';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ImageManager = () => {
    const lottie = useLottieStore((state) => state.lottie);
    const updateLottie = useLottieStore((state) => state.updateLottie);

    if (!lottie || !lottie.assets) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No images found in this animation.
            </div>
        );
    }

    // Filter for image assets.
    // Lottie assets can be precomps (which have 'layers') or images (which have 'p' or 'u').
    // Distinctive feature of image asset usually is that it does NOT have 'layers'.
    const imageAssets = lottie.assets.filter(asset => !asset.layers && (asset.p || asset.u));

    if (imageAssets.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No embedded images found.
            </div>
        );
    }

    const handleAssetUpdate = (assetId: string, updates: Partial<any>) => {
        updateLottie((draft) => {
            if (!draft.assets) return;
            const asset = draft.assets.find(a => a.id === assetId);
            if (asset) {
                // Apply all updates
                Object.assign(asset, updates);
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm">Image Manager</h3>
                <p className="text-xs text-muted-foreground">Manage embedded assets ({imageAssets.length})</p>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4">
                    {imageAssets.map((asset) => (
                        <ImageRow
                            key={asset.id}
                            asset={asset}
                            onUpdate={handleAssetUpdate}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};

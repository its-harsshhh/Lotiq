import { useEffect, useRef } from 'react';
import lottie, { type AnimationItem } from 'lottie-web';
import { usePlaybackStore } from '@/store/usePlaybackStore';
import type { LottieJSON } from '@/engine/lottie-schema';

interface ComparePreviewPlayerProps {
    data: LottieJSON;
}

export const ComparePreviewPlayer = ({ data }: ComparePreviewPlayerProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<AnimationItem | null>(null);
    const isPlaying = usePlaybackStore((state) => state.isPlaying);
    const speed = usePlaybackStore((state) => state.speed);

    useEffect(() => {
        if (!containerRef.current) return;

        const anim = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: JSON.parse(JSON.stringify(data)),
            rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
        });

        animRef.current = anim;
        anim.setSpeed(speed);

        return () => anim.destroy();
    }, [data]);

    useEffect(() => {
        if (isPlaying) animRef.current?.play();
        else animRef.current?.pause();
    }, [isPlaying]);

    useEffect(() => {
        animRef.current?.setSpeed(speed);
    }, [speed]);

    return <div ref={containerRef} className="w-full h-full max-w-[200px] max-h-[200px]" />;
};

import { useEffect } from 'react';
import { useLottieStore } from '@/store/useLottieStore';

export const PasteHandler = () => {
    const loadLottie = useLottieStore((state) => state.loadLottie);
    // const { toast } = useToast(); 

    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const text = event.clipboardData?.getData('text');
            if (!text) return;

            try {
                // Peek first char to optimize
                const trimmed = text.trim();
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                    const json = JSON.parse(text);
                    if (json.v && json.layers) {
                        loadLottie(json, 'pasted-animation.json');
                    }
                }
            } catch (error) {
                // Ignore non-json pastes quietly or show error if it looked like JSON
                console.error("Paste parse error", error);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [loadLottie]);

    return null; // Headless component
};

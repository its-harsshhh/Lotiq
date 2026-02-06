import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLottieStore } from '@/store/useLottieStore';
import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';

export const DropZone = () => {
    const loadLottie = useLottieStore((state) => state.loadLottie);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Basic validation: check for 'v' or 'layers'
                if (json.v && json.layers) {
                    loadLottie(json, file.name);
                } else {
                    alert("Invalid Lottie JSON");
                }
            } catch (error) {
                console.error("Failed to parse JSON", error);
                alert("Failed to parse JSON file");
            }
        };
        reader.readAsText(file);
    }, [loadLottie]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/json': ['.json']
        },
        multiple: false
    });

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-secondary/50" : "border-muted-foreground/25 hover:border-primary/50"
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
                <UploadCloud className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">
                    {isDragActive ? "Drop Lottie here..." : "Drag & drop Lottie JSON, or click to select"}
                </p>
            </div>
        </div>
    );
};

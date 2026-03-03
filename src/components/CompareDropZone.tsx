import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LottieJSON } from '@/engine/lottie-schema';

interface CompareDropZoneProps {
    onLoad: (json: LottieJSON, fileName: string) => void;
    label?: string;
}

export const CompareDropZone = ({ onLoad, label = "Drop Lottie here" }: CompareDropZoneProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.v && json.layers) {
                    onLoad(json, file.name);
                } else {
                    alert("Invalid Lottie JSON");
                }
            } catch (error) {
                console.error("Failed to parse JSON", error);
                alert("Failed to parse JSON file");
            }
        };
        reader.readAsText(file);
    }, [onLoad]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/json': ['.json']
        },
        multiple: false
    });

    const { onAnimationStart, onDrag, ...rootProps } = getRootProps();

    const containerVariants = {
        idle: {
            scale: 1,
            borderColor: "rgba(161, 161, 170, 0.25)",
            backgroundColor: "transparent",
            transition: { type: "spring" as const, stiffness: 400, damping: 25 }
        },
        hover: {
            scale: 1.02,
            borderColor: "rgba(99, 102, 241, 0.5)",
            backgroundColor: "rgba(99, 102, 241, 0.02)",
            transition: { type: "spring" as const, stiffness: 400, damping: 25 }
        },
        active: {
            scale: 1.05,
            borderColor: "rgba(99, 102, 241, 1)",
            backgroundColor: "rgba(99, 102, 241, 0.05)",
            transition: { type: "spring" as const, stiffness: 400, damping: 25 }
        }
    };

    const iconVariants = {
        idle: {
            y: 0,
            transition: { repeat: Infinity, repeatType: "reverse" as const, duration: 1.5, ease: "easeInOut" as const }
        },
        hover: {
            y: -5,
            scale: 1.1,
            color: "rgba(99, 102, 241, 1)",
            transition: { type: "spring" as const, stiffness: 300, damping: 15 }
        },
        active: {
            y: 0,
            scale: 1.2,
            color: "rgba(99, 102, 241, 1)",
            transition: { type: "spring" as const, stiffness: 300, damping: 15 }
        }
    };

    return (
        <motion.div
            {...(rootProps as any)}
            variants={containerVariants}
            initial="idle"
            animate={isDragActive ? "active" : "idle"}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            className={cn(
                "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer relative overflow-hidden group/dropzone w-full mx-auto"
            )}
        >
            <input {...getInputProps()} />

            <AnimatePresence>
                {isDragActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-indigo-50/50 dark:bg-indigo-900/20 -z-10"
                    />
                )}
            </AnimatePresence>

            <div className="flex flex-col items-center gap-3 relative z-10">
                <motion.div
                    variants={iconVariants}
                    className="p-3 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm group-hover/dropzone:shadow-md transition-shadow"
                >
                    <UploadCloud className="h-6 w-6 text-zinc-400 group-hover/dropzone:text-indigo-500 transition-colors" />
                </motion.div>

                <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                        {isDragActive ? "Drop it!" : label}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Click to upload or drag JSON
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

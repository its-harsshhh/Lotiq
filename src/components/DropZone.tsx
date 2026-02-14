import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLottieStore } from '@/store/useLottieStore';
import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

    // Destructure to remove conflicting props
    const { onAnimationStart, onDrag, ...rootProps } = getRootProps();

    // Framer Motion Variants
    const containerVariants = {
        idle: {
            scale: 1,
            borderColor: "rgba(161, 161, 170, 0.25)", // zinc-400 equivalent approx with opacity
            backgroundColor: "transparent",
            transition: { type: "spring" as const, stiffness: 400, damping: 25 }
        },
        hover: {
            scale: 1.02,
            borderColor: "rgba(99, 102, 241, 0.5)", // indigo-500 equivalent approx
            backgroundColor: "rgba(99, 102, 241, 0.02)",
            transition: { type: "spring" as const, stiffness: 400, damping: 25 }
        },
        active: {
            scale: 1.05,
            borderColor: "rgba(99, 102, 241, 1)", // indigo-500
            backgroundColor: "rgba(99, 102, 241, 0.05)",
            transition: { type: "spring" as const, stiffness: 400, damping: 25 }
        }
    };

    const iconVariants = {
        idle: {
            y: 0,
            transition: {
                repeat: Infinity,
                repeatType: "reverse" as const,
                duration: 1.5,
                ease: "easeInOut" as const
            }
        },
        hover: {
            y: -5,
            scale: 1.1,
            color: "rgba(99, 102, 241, 1)", // indigo-500
            transition: { type: "spring" as const, stiffness: 300, damping: 15 }
        },
        active: {
            y: 0,
            scale: 1.2,
            color: "rgba(99, 102, 241, 1)", // indigo-500
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
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer relative overflow-hidden group/dropzone",
                // Remove base collision classes as motion handles styles, but keep layout
            )}
        >
            <input {...getInputProps()} />

            {/* Background Pulse Effect */}
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

            <div className="flex flex-col items-center gap-4 relative z-10">
                <motion.div
                    variants={iconVariants}
                    className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm group-hover/dropzone:shadow-md transition-shadow"
                >
                    <UploadCloud className="h-8 w-8 text-zinc-400 group-hover/dropzone:text-indigo-500 transition-colors" />
                </motion.div>

                <div className="space-y-1">
                    <p className="text-base font-semibold text-zinc-700 dark:text-zinc-200">
                        {isDragActive ? "Drop it like it's hot!" : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        JSON or Lottie files supported
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

import { DropZone } from "./DropZone";
import { UrlLoader } from "./UrlLoader";
import { PasteHandler } from "./PasteHandler";
import {
    Coffee,
    Palette,
    GitCompare,
    Code2,
    Copy,
    Smartphone,
    LayoutTemplate,
    Crop,
    Download,
    Zap,
    ShieldCheck,
    UserCheck,
    Moon
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, useScroll } from "framer-motion";
import { Button } from "./ui/button";
import { LandingNavbar } from "./LandingNavbar";
import { FeedbackSection } from "./FeedbackSection";
import { Footer } from "./Footer";
import { TrySampleLottie } from "./TrySampleLottie";
import { cn } from "@/lib/utils";

// --- Local Components for Interaction ---

const TiltCard = ({ children, className, ...props }: any) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 });

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const xVal = clientX - left;
        const yVal = clientY - top;
        const xPct = xVal / width - 0.5;
        const yPct = yVal / height - 0.5;

        x.set(xPct);
        y.set(yPct);
        mouseX.set(xVal);
        mouseY.set(yVal);
    }

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

    // Spotlight gradient that follows mouse - drastically reduced opacity for subtle effect
    const spotlight = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.03), transparent 80%)`;

    return (
        <motion.div
            {...props}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { x.set(0); y.set(0); }}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                perspective: 1000,
                ...props.style
            }}
            className={cn("group relative", className)}
        >
            {/* Spotlight Glare */}
            <motion.div
                className="absolute inset-0 z-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: spotlight }}
            />

            {/* Inner content wrapper to preserve z-axis sorting */}
            <div style={{ transform: "translateZ(20px)" }} className="h-full w-full relative z-0">
                {children}
            </div>
        </motion.div>
    );
};


const ParallaxBackground = () => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
    const y2 = useTransform(scrollY, [0, 1000], [0, -150]);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Animated Gradient Orbs */}
            <motion.div
                style={{ y: y1, opacity: 0.4 }}
                className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[100px] dark:bg-indigo-500/10"
            />
            <motion.div
                style={{ y: y2, opacity: 0.4 }}
                className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[100px] dark:bg-purple-500/10"
            />

            {/* Grid Pattern with Parallax */}
            <motion.div
                style={{ y: useTransform(scrollY, [0, 1000], [0, 50]) }}
                className="absolute inset-0 h-full w-full bg-white dark:bg-zinc-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
            />
        </div>
    );
};

export const LandingPage = () => {
    // Animation variants for progressive disclosure
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 20,
                mass: 0.5
            }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1
            }
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-100 dark:selection:bg-indigo-900/50 flex flex-col font-sans transition-colors duration-300">
            <PasteHandler />

            <LandingNavbar />

            <ParallaxBackground />

            <main className="relative z-10 w-full flex flex-col items-center flex-grow pt-32 px-6">

                {/* 1. HERO SECTION */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="text-center space-y-6 max-w-3xl mx-auto mb-10 w-full"
                >
                    <motion.div
                        variants={fadeInUp}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center rounded-full border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2 tracking-wide uppercase cursor-default"
                        role="status"
                    >
                        <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        v3.0 Live · Compare Lotties side-by-side
                    </motion.div>

                    <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
                        Edit Lottie files <br />
                        <span className="text-indigo-600 dark:text-indigo-400 inline-block">in seconds, not minutes.</span>
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="text-base text-zinc-600 dark:text-zinc-400 max-w-none mx-auto leading-relaxed">
                        Lotiq lets you inspect, tweak, and export animations in seconds. Runs entirely in your browser.
                    </motion.p>

                </motion.div>

                {/* 2. DROP ZONE SECTION */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8, type: "spring", bounce: 0.4 }}
                    className="w-full max-w-xl mx-auto mb-20"
                >
                    <div className="relative group rounded-3xl p-1 bg-gradient-to-br from-indigo-50/50 via-white to-zinc-50 dark:from-indigo-500/10 dark:via-zinc-900 dark:to-zinc-900 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 hover:shadow-indigo-200/20 dark:hover:shadow-indigo-500/10 transition-all duration-500">
                        <div className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl opacity-60 backdrop-blur-xl"></div>
                        <div className="relative rounded-[20px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col gap-6 items-center text-center transition-all duration-300 group-hover:border-indigo-100 dark:group-hover:border-indigo-900/50 cursor-pointer">

                            {/* ... DropZone contents ... */}
                            <div className="w-full">
                                <DropZone />
                            </div>

                            <div className="w-full flex items-center gap-4">
                                <div className="h-[1px] flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                <span className="text-[10px] uppercase font-medium text-zinc-400 dark:text-zinc-500 tracking-widest whitespace-nowrap">
                                    or load URL
                                </span>
                                <div className="h-[1px] flex-1 bg-zinc-100 dark:bg-zinc-800" />
                            </div>

                            <div className="flex flex-col items-center w-full gap-4">
                                <UrlLoader />
                                <TrySampleLottie />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 3. NEW FEATURE GRID SECTION */}
                <motion.div
                    id="features"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="w-full max-w-[1440px] mx-auto space-y-20 mb-32"
                >
                    <div className="text-center space-y-5">
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight">
                            Built for the real-world workflow.
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-zinc-500 dark:text-zinc-400 max-w-3xl mx-auto text-lg">
                            Stop pinging your motion designer for small tweaks. Lotiq gives you the power to optimize, brand, and package animations directly in your browser.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {[
                            {
                                title: 'Compare Lotties',
                                text: 'Compare two Lotties side-by-side with synchronized playback. Perfect for QA and optimization checks.',
                                icon: GitCompare,
                                color: 'text-indigo-500',
                                bg: 'bg-indigo-500/10'
                            },
                            {
                                title: 'Dev Mode',
                                text: 'Bridge the gap between design and dev. Inspect JSON structure and copy clean code snippets instantly.',
                                icon: Code2,
                                color: 'text-green-500',
                                bg: 'bg-green-500/10',
                                badge: 'Coming Soon'
                            },
                            {
                                title: 'Multi-Page Canvas',
                                text: 'Work on an entire suite of animations at once. Switch between pages without re-importing.',
                                icon: Copy,
                                color: 'text-blue-500',
                                bg: 'bg-blue-500/10'
                            },
                            {
                                title: 'Live Device Preview',
                                text: 'Wrap your animation in a high-fidelity iPhone mockup to see how it looks in a real mobile context.',
                                icon: Smartphone,
                                color: 'text-orange-500',
                                bg: 'bg-orange-500/10'
                            },
                            {
                                title: 'Social Mockup Engine',
                                text: 'Render Lotties inside social post containers with custom backgrounds for "Share-Ready" exports.',
                                icon: LayoutTemplate,
                                color: 'text-pink-500',
                                bg: 'bg-pink-500/10'
                            },
                            {
                                title: 'Animation cropping',
                                text: 'Adjust width, height, and padding. Standardize your Lottie dimensions without reopening AE.',
                                icon: Crop,
                                color: 'text-purple-500',
                                bg: 'bg-purple-500/10'
                            },
                            {
                                title: 'Real-Time Color Transformer',
                                text: 'Identify and swap colors across all layers instantly. Batch-edit branding with a live preview.',
                                icon: Palette,
                                color: 'text-amber-500',
                                bg: 'bg-amber-500/10'
                            },
                            {
                                title: 'Universal Media Export',
                                text: 'Export to any format: JSON, .lottie, GIF, or high-res Video (WebM/MP4) with one click.',
                                icon: Download,
                                color: 'text-emerald-500',
                                bg: 'bg-emerald-500/10'
                            },
                            {
                                title: 'Image Optimization',
                                text: 'Compress embedded assets (PNG to WebP) inside the browser to shrink file sizes by up to 80%.',
                                icon: Zap,
                                color: 'text-yellow-500',
                                bg: 'bg-yellow-500/10'
                            },
                            {
                                title: '100% Client-Side Engine',
                                text: 'No servers. No data leaks. Everything is processed in your browser memory for maximum privacy.',
                                icon: ShieldCheck,
                                color: 'text-red-500',
                                bg: 'bg-red-500/10'
                            },
                            {
                                title: 'Friendly UI',
                                text: 'A clean UI that lets PMs and Devs tweak animations without disturbing motion designers.',
                                icon: UserCheck,
                                color: 'text-cyan-500',
                                bg: 'bg-cyan-500/10'
                            },
                            {
                                title: 'Dark & Light Mode',
                                text: 'Seamlessly switch between themes for late-night dev sessions or daylight design reviews.',
                                icon: Moon,
                                color: 'text-zinc-600 dark:text-zinc-400',
                                bg: 'bg-zinc-500/10'
                            }
                        ].map((item, i) => (
                            <TiltCard
                                key={i}
                                variants={fadeInUp}
                                whileHover={{ y: -5 }}
                                className="h-full group p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-500/20 transition-all duration-300 relative"
                            >
                                <div className="flex flex-col h-full gap-5">
                                    <div className={cn("p-3 w-fit rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3", item.bg)}>
                                        <item.icon className={cn("w-6 h-6", item.color)} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500 transition-colors">{item.title}</h3>
                                            {item.badge && (
                                                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                            {item.text}
                                        </p>
                                    </div>
                                </div>
                            </TiltCard>
                        ))}
                    </div>
                </motion.div>


                {/* 6. SOCIAL PROOF / BUILDER NOTE - Elevated Card */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="w-full max-w-lg p-10 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center space-y-4 mb-12 shadow-sm"
                >
                    <p className="text-zinc-600 dark:text-zinc-400 italic font-medium leading-relaxed">
                        "Finally, a way to fix small animation tweaks without bothering your motion designer."
                    </p>
                    <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">— Harsh</div>
                </motion.div>

                {/* 7. SUPPORT / COFFEE */}
                <motion.div
                    id="support"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="text-center space-y-6 mb-32"
                >
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                        Lotiq is free to use. If it saves you time, you can support it with a coffee ☕
                    </p>
                    <a href="https://buymeacoffee.com/harshpal" target="_blank" rel="noreferrer" className="inline-block group">
                        <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Button className="relative overflow-hidden gap-2 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black border-none font-bold shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all duration-300 rounded-full px-8 py-6 text-base group/btn">
                                {/* Steam/Energy particles */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-[100%]"
                                    animate={{ translateX: ["-100%", "200%"] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2.5,
                                        ease: "linear",
                                        repeatDelay: 2
                                    }}
                                />

                                <div className="relative z-10 flex items-center gap-2">
                                    <motion.div
                                        animate={{
                                            rotate: [0, -10, 10, -10, 0],
                                            scale: [1, 1.1, 1, 1.1, 1]
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 2,
                                            ease: "easeInOut",
                                            repeatDelay: 1
                                        }}
                                    >
                                        <Coffee className="w-5 h-5 fill-current" />
                                    </motion.div>
                                    <span className="font-extrabold tracking-tight">Support development</span>
                                </div>

                                {/* Shine effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            </Button>
                        </motion.div>
                    </a>
                </motion.div>

                {/* 8. FEEDBACK SECTION */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="w-full"
                >
                    <FeedbackSection />
                </motion.div>

                {/* 9. FOOTER */}

            </main>
            <Footer />
        </div>
    );
};

import { useRef } from 'react';
import { DropZone } from "./DropZone";
import { UrlLoader } from "./UrlLoader";
import { PasteHandler } from "./PasteHandler";
import { Layers, Coffee, Shield, Zap, Lock, Palette, Eye, MousePointer2 } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, useScroll } from "framer-motion";
import { Button } from "./ui/button";
import { LandingNavbar } from "./LandingNavbar";
import { FeedbackSection } from "./FeedbackSection";
import { Footer } from "./Footer";
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

const SpotlightCard = ({ children, className, ...props }: any) => {
    const divRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        divRef.current.style.setProperty("--mouse-x", `${x}px`);
        divRef.current.style.setProperty("--mouse-y", `${y}px`);
        divRef.current.style.setProperty("--opacity", "1");
    };

    const handleMouseLeave = () => {
        if (!divRef.current) return;
        divRef.current.style.setProperty("--opacity", "0");
    };

    return (
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            {...props}
            className={cn(
                "relative h-full overflow-hidden rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-colors group/spotlight",
                className
            )}
        >
            {/* Spotlight Overlay */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-10"
                style={{
                    opacity: `var(--opacity, 0)`,
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(99,102,241,0.1), transparent 40%)`,
                }}
            />
            {/* Border Highlight */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-20"
                style={{
                    opacity: `var(--opacity, 0)`,
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(99,102,241,0.4), transparent 40%)`,
                    maskImage: `linear-gradient(black, black) content-box, linear-gradient(black, black)`,
                    WebkitMaskImage: `linear-gradient(black, black) content-box, linear-gradient(black, black)`,
                    maskComposite: `exclude`,
                    WebkitMaskComposite: `xor`,
                    padding: '1px' // Width of the border
                }}
            />

            <div className="relative z-0 h-full">
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

            <main className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col items-center flex-grow pt-32">

                {/* 1. HERO SECTION */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="text-center space-y-6 max-w-4xl mx-auto mb-10"
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
                        v2.0 Beta · Tweak, Crop, and Export in seconds
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
                    className="w-full max-w-xl mx-auto mb-16"
                >
                    <div className="relative group rounded-3xl p-1 bg-gradient-to-br from-indigo-50/50 via-white to-zinc-50 dark:from-indigo-500/10 dark:via-zinc-900 dark:to-zinc-900 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 hover:shadow-indigo-200/20 dark:hover:shadow-indigo-500/10 transition-all duration-500">
                        <div className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl opacity-60 backdrop-blur-xl"></div>
                        <div className="relative rounded-[20px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col gap-6 items-center text-center transition-all duration-300 group-hover:border-indigo-100 dark:group-hover:border-indigo-900/50 cursor-pointer">

                            {/* ... DropZone contents ... */}
                            <div className="w-full">
                                <DropZone />
                            </div>

                            <div className="w-full border-t border-zinc-100 dark:border-zinc-800 relative">
                                <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-white dark:bg-zinc-900 px-3 text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                                    or load URL
                                </span>
                            </div>

                            <div className="flex justify-center w-full">
                                <UrlLoader />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 3. WHY LOTIQ SECTION */}
                <motion.div
                    id="features"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="w-full max-w-3xl mx-auto text-center space-y-10 mb-6"
                >
                    <motion.h2 variants={fadeInUp} className="text-2xl font-bold text-zinc-900 dark:text-white">Why Lotiq?</motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        {[
                            {
                                title: 'Instant tweaks',
                                icon: Palette,
                                text: "Change colors, layers, and canvas in seconds.",
                                iconBg: 'bg-zinc-50 dark:bg-zinc-800',
                                iconColor: 'text-zinc-600 dark:text-zinc-400'
                            },
                            {
                                title: 'Live preview',
                                icon: Eye,
                                text: "See changes instantly and export with confidence.",
                                iconBg: 'bg-zinc-50 dark:bg-zinc-800',
                                iconColor: 'text-zinc-600 dark:text-zinc-400'
                            },
                            {
                                title: 'Workflow friendly',
                                icon: MousePointer2,
                                text: "Fix small things without leaving your flow.",
                                iconBg: 'bg-zinc-50 dark:bg-zinc-800',
                                iconColor: 'text-zinc-600 dark:text-zinc-400'
                            }
                        ].map((item, i) => (
                            <TiltCard
                                key={i}
                                variants={fadeInUp}
                                whileHover={{ y: -5 }}
                                className="h-full p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all"
                            >
                                <div className="flex flex-col h-full gap-6">
                                    <div className="flex-shrink-0">
                                        <div className={cn("p-2 w-fit rounded-lg border shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300", item.iconBg, "border-zinc-100 dark:border-zinc-800")}>
                                            <item.icon className={cn("w-5 h-5", item.iconColor)} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {item.text}
                                        </p>
                                    </div>
                                </div>
                            </TiltCard>
                        ))}
                    </div>
                </motion.div>

                {/* 4. FEATURE STRIP */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    className="w-full max-w-3xl mx-auto space-y-12 mb-32"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <TiltCard
                            variants={fadeInUp}
                            whileHover={{ y: -5 }}
                            className="h-full p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all"
                        >
                            <div className="flex flex-col h-full gap-6">
                                <div className="flex-shrink-0">
                                    <div className="p-2 w-fit bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                        <div className="w-5 h-5 rounded-full bg-indigo-500 shadow-sm" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Global color editing</h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Automatically detects all colors in your animation. Change once, update everywhere.
                                    </p>
                                </div>
                            </div>
                        </TiltCard>

                        {/* Feature 2 */}
                        <TiltCard
                            variants={fadeInUp}
                            whileHover={{ y: -5 }}
                            className="h-full p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all"
                        >
                            <div className="flex flex-col h-full gap-6">
                                <div className="flex-shrink-0">
                                    <div className="p-2 w-fit bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                        <Layers className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Layer visibility</h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Hide or remove layers without touching keyframes or complicating your project file.
                                    </p>
                                </div>
                            </div>
                        </TiltCard>

                        {/* Feature 3 */}
                        <TiltCard
                            variants={fadeInUp}
                            whileHover={{ y: -5 }}
                            className="h-full p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all"
                        >
                            <div className="flex flex-col h-full gap-6">
                                <div className="flex-shrink-0">
                                    <div className="p-2 w-fit bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                        <svg className="w-5 h-5 text-zinc-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" /><path d="M3 15h18" /></svg>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Canvas fixes</h3>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Adjust width, height, and padding. Standardize your Lottie dimensions without reopening AE.
                                    </p>
                                </div>
                            </div>
                        </TiltCard>
                    </div>

                </motion.div>

                {/* 5. TRUST & PRIVACY - Aceternity Style Bento Grid */}
                <motion.div
                    id="trust"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="w-full max-w-4xl mx-auto mb-32"
                >
                    <div className="text-center mb-12 space-y-4">
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Your files stay with you.</h2>
                        <p className="text-zinc-500 dark:text-zinc-400">Zero data leaks. Lotiq runs entirely in your browser.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <SpotlightCard
                            whileHover={{ y: -5 }}
                            className="group relative overflow-hidden rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/10 hover:border-indigo-100 dark:hover:border-indigo-900/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 dark:from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col gap-8 p-8 h-full">
                                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Shield className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Local Processing</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Your Lottie files never leave your device. We process everything in-memory.
                                    </p>
                                </div>
                            </div>
                        </SpotlightCard>

                        {/* Card 2 */}
                        <SpotlightCard
                            whileHover={{ y: -5 }}
                            className="group relative overflow-hidden rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/10 hover:border-indigo-100 dark:hover:border-indigo-900/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 dark:from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col gap-8 p-8 h-full">
                                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Zap className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white mb-1">No Accounts</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Jump straight in. No signups, no credit cards, no "free trial" friction.
                                    </p>
                                </div>
                            </div>
                        </SpotlightCard>

                        {/* Card 3 */}
                        <SpotlightCard
                            whileHover={{ y: -5 }}
                            className="group relative overflow-hidden rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/10 hover:border-indigo-100 dark:hover:border-indigo-900/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 dark:from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col gap-8 p-8 h-full">
                                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Lock className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Private by Default</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        No tracking scripts or analytics. What you browse is your business.
                                    </p>
                                </div>
                            </div>
                        </SpotlightCard>
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
                                    <span className="font-extrabold tracking-tight">Buy me a coffee</span>
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

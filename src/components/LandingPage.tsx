import { DropZone } from "./DropZone";
import { UrlLoader } from "./UrlLoader";
import { PasteHandler } from "./PasteHandler";
import { Layers, Coffee, Shield, Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { LandingNavbar } from "./LandingNavbar";
import { FeedbackSection } from "./FeedbackSection";

export const LandingPage = () => {
    // Animation variants for progressive disclosure
    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 selection:bg-indigo-100 dark:selection:bg-indigo-900/50 flex flex-col font-sans transition-colors duration-300">
            <PasteHandler />

            <LandingNavbar />

            {/* Dot Pattern Background - Reduced Contrast */}
            <div aria-hidden="true" className="fixed inset-0 z-0 h-full w-full bg-white dark:bg-zinc-950 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

            <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-16 flex flex-col items-center flex-grow pt-32">

                {/* 1. HERO SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center space-y-6 max-w-2xl mx-auto mb-10"
                >
                    <div className="inline-flex items-center rounded-full border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-3 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-2 tracking-wide uppercase" role="status">
                        v2.0 Beta · Runs entirely in your browser
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.1]">
                        Edit Lottie files <br />
                        <span className="text-indigo-600 dark:text-indigo-400">in seconds, not minutes.</span>
                    </h1>

                    <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                        Lotiq lets you inspect, tweak, and export animations in seconds. Runs entirely in your browser.
                    </p>

                </motion.div>

                {/* 2. DROP ZONE SECTION */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="w-full max-w-xl mx-auto mb-16"
                >
                    <div className="relative group rounded-3xl p-1 bg-gradient-to-br from-indigo-50/50 via-white to-zinc-50 dark:from-indigo-500/10 dark:via-zinc-900 dark:to-zinc-900 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 hover:shadow-indigo-200/20 dark:hover:shadow-indigo-500/10 transition-all duration-500">
                        <div className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl opacity-60 backdrop-blur-xl"></div>
                        <div className="relative rounded-[20px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 p-8 flex flex-col gap-6 items-center text-center transition-all duration-300 group-hover:border-indigo-100 dark:group-hover:border-indigo-900/50 group-hover:scale-[1.01] cursor-pointer">

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

                {/* 3. WHY LOTIQ SECTION - Compact & Outcome focused */}
                <motion.div
                    id="features"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="w-full max-w-2xl mx-auto text-center space-y-12 mb-32"
                >
                    <motion.h2 variants={fadeInUp} className="text-2xl font-bold text-zinc-900 dark:text-white">Why Lotiq?</motion.h2>

                    <div className="flex flex-col md:flex-row justify-between gap-8 text-left">
                        <motion.div variants={fadeInUp} className="flex-1 space-y-2">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Instant tweaks</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Change colors, layers, and canvas in seconds.</p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="flex-1 space-y-2">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Live preview</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">See changes instantly and export with confidence.</p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="flex-1 space-y-2">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Workflow friendly</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">Fix small things without leaving your flow.</p>
                        </motion.div>
                    </div>
                </motion.div>

                {/* 4. FEATURE STRIP (Stacked Rows) - Tighter spacing */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="w-full max-w-3xl mx-auto space-y-12 mb-32"
                >
                    <motion.div variants={fadeInUp} className="border-t border-zinc-100" />

                    <div className="space-y-12">
                        {/* Feature 1 */}
                        <motion.div variants={fadeInUp} className="flex flex-col md:flex-row items-start gap-6">
                            <div className="flex-shrink-0 pt-1">
                                <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <div className="w-5 h-5 rounded-full bg-indigo-500 shadow-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Global color editing</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
                                    Automatically detects all colors in your animation. Change once, update everywhere.
                                </p>
                            </div>
                        </motion.div>

                        {/* Feature 2 */}
                        <motion.div variants={fadeInUp} className="flex flex-col md:flex-row items-start gap-6">
                            <div className="flex-shrink-0 pt-1">
                                <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <Layers className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Layer visibility</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
                                    Hide or remove layers without touching keyframes or complicating your project file.
                                </p>
                            </div>
                        </motion.div>

                        {/* Feature 3 */}
                        <motion.div variants={fadeInUp} className="flex flex-col md:flex-row items-start gap-6">
                            <div className="flex-shrink-0 pt-1">
                                <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <svg className="w-5 h-5 text-zinc-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M15 3v18" /><path d="M3 15h18" /></svg>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Canvas fixes</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
                                    Adjust width, height, and padding. Standardize your Lottie dimensions without reopening AE.
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div variants={fadeInUp} className="border-t border-zinc-100" />
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
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="group relative overflow-hidden rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/10 hover:border-indigo-100 dark:hover:border-indigo-900/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col gap-4">
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
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="group relative overflow-hidden rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:shadow-emerald-100/50 dark:hover:shadow-emerald-900/10 hover:border-emerald-100 dark:hover:border-emerald-900/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Zap className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white mb-1">No Accounts</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Jump straight in. No signups, no credit cards, no "free trial" friction.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="group relative overflow-hidden rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:shadow-xl hover:shadow-amber-100/50 dark:hover:shadow-amber-900/10 hover:border-amber-100 dark:hover:border-amber-900/50"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Lock className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white mb-1">Private by Default</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        No tracking scripts or analytics. What you browse is your business.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
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
                        "Built by a product designer who was tired of reopening After Effects for tiny Lottie fixes."
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
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Lotiq is free to use. If it saves you time, you can support it with a coffee ☕
                    </p>
                    <a href="https://buymeacoffee.com/harshpal" target="_blank" rel="noreferrer">
                        <Button className="gap-2 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black border-none font-bold shadow-sm hover:shadow-md transition-all rounded-full px-6">
                            <Coffee className="w-4 h-4" /> Buy me a coffee
                        </Button>
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
                <footer className="w-full pt-20 pb-8 text-center" role="contentinfo">
                    <div className="flex items-center justify-center gap-6 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                        <span>Built by Harsh</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800"></span>
                        <span>Runs locally in your browser</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800"></span>
                        <span>MIT License</span>
                    </div>
                </footer>
            </main>
        </div>
    );
};

import { motion } from "framer-motion";
import { Coffee, Youtube, Info, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { LandingNavbar } from "./LandingNavbar";
import { Footer } from "./Footer";

export const TutorialPage = () => {

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col">
            <LandingNavbar />

            <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-24 pb-12">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="space-y-12"
                >
                    {/* Hero Text */}
                    <div className="text-center space-y-4 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <Youtube className="w-3 h-3" />
                            Featured Tutorial
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                            Remove Lottielab Watermark <br />
                            <span className="text-indigo-600 dark:text-indigo-400">For Free</span>
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">
                            Using Lottielab's free plan and seeing the "Made with Lottielab" watermark?
                            This 1-minute guide shows you how to remove it easily using Lotiq.
                        </p>
                    </div>

                    {/* Video Section */}
                    <div className="grid grid-cols-1 gap-12">
                        <div className="space-y-6">
                            <div className="relative group rounded-[32px] p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden aspect-video transition-all duration-500 ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 hover:ring-indigo-500/30">
                                {/* Decorative elements */}
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="px-3 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1.5 shadow-lg">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        PRO TIP
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-50 pointer-events-none" />

                                <iframe
                                    className="w-full h-full rounded-[24px] shadow-2xl relative z-10 bg-black"
                                    src="https://www.youtube.com/embed/tUqVg1VzoRo"
                                    title="How to Remove Lottielab Watermark for Free"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                ></iframe>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 items-start justify-between bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold">In this tutorial:</h3>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                                        {[
                                            "Exporting from Lottielab",
                                            "Importing the JSON to Lotiq",
                                            "Scanning for watermark layers",
                                            "One-click deletion",
                                            "Clean export without logos",
                                            "100% Free method"
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-start gap-4 max-w-xs">
                                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                        <Info className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        This tutorial was created by the developer to help you get the most out of Lotiq's browser-only engine.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support Section */}
                    <div className="text-center pt-12 border-t border-zinc-100 dark:border-zinc-900">
                        <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                            Enjoying Lotiq? Help us keep it free and ad-free.
                        </p>
                        <a href="https://buymeacoffee.com/harshpal" target="_blank" rel="noreferrer">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                                <Button className="bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black font-extrabold px-10 py-7 rounded-full text-lg shadow-xl shadow-yellow-500/20 gap-3 group">
                                    <Coffee className="w-6 h-6 group-hover:animate-bounce" />
                                    <span>Support development</span>
                                </Button>
                            </motion.div>
                        </a>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

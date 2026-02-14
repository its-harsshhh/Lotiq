
import { Coffee, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { cn } from "@/lib/utils";

export const LandingNavbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 20);
    });

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setIsMenuOpen(false);
        }
    };

    const navLinks = [
        { name: "Features", id: "features" },
        { name: "Privacy", id: "trust" },
        { name: "Support", id: "support" },
    ];

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
                scrolled
                    ? "border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm"
                    : "border-transparent bg-transparent"
            )}
        >
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* Logo */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <img src="/logo/logo-light-mode.svg" alt="Lotiq" className="h-8 w-auto dark:hidden" />
                    <img src="/logo/logo-dark-mode.svg" alt="Lotiq" className="h-8 w-auto hidden dark:block" />
                </motion.div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((link, index) => (
                        <button
                            key={link.name}
                            onClick={() => scrollToSection(link.id)}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="relative px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                            {hoveredIndex === index && (
                                <motion.span
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800 rounded-full -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            {link.name}
                        </button>
                    ))}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <a href="https://buymeacoffee.com/harshpal" target="_blank" rel="noreferrer">
                        <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                            <Button size="sm" className="relative overflow-hidden gap-2 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black border-none font-extrabold shadow-sm hover:shadow-yellow-500/20 transition-all rounded-full px-5 group/btn">
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[100%]"
                                    animate={{ translateX: ["-100%", "200%"] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2.5,
                                        ease: "linear",
                                        repeatDelay: 2
                                    }}
                                />
                                <motion.div
                                    animate={{
                                        rotate: [0, -10, 10, -10, 0],
                                        scale: [1, 1.1, 1, 1.1, 1]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2.5,
                                        ease: "easeInOut",
                                        repeatDelay: 1.5
                                    }}
                                    className="relative z-10"
                                >
                                    <Coffee className="w-3.5 h-3.5 fill-current" />
                                </motion.div>
                                <span className="relative z-10">Buy coffee</span>
                            </Button>
                        </motion.div>
                    </a>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
                    <ModeToggle />
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden items-center gap-4">
                    <ModeToggle />
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden"
                    >
                        <div className="flex flex-col p-6 space-y-4">
                            {navLinks.map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => scrollToSection(link.id)}
                                    className="text-left text-base font-medium text-zinc-600 dark:text-zinc-400 py-2"
                                >
                                    {link.name}
                                </button>
                            ))}
                            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <a href="https://buymeacoffee.com/harshpal" target="_blank" rel="noreferrer" className="block">
                                    <Button className="w-full relative overflow-hidden gap-2 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black border-none font-extrabold h-12 rounded-xl">
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[100%]"
                                            animate={{ translateX: ["-100%", "200%"] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 2.5,
                                                ease: "linear",
                                                repeatDelay: 2
                                            }}
                                        />
                                        <motion.div
                                            animate={{
                                                rotate: [0, -10, 10, -10, 0],
                                                scale: [1, 1.1, 1, 1.1, 1]
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 2.5,
                                                ease: "easeInOut"
                                            }}
                                            className="relative z-10"
                                        >
                                            <Coffee className="w-4 h-4 fill-current" />
                                        </motion.div>
                                        <span className="relative z-10">Buy me a coffee</span>
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

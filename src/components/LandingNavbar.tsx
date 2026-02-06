
import { Coffee, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import { motion, AnimatePresence } from "framer-motion";

export const LandingNavbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl shadow-sm">
            <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* Logo */}
                <div
                    className="flex items-center gap-2 font-bold text-xl tracking-tight cursor-pointer"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-500/20 shadow-lg">
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="text-zinc-900 dark:text-white">Lotiq</span>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <button
                            key={link.name}
                            onClick={() => scrollToSection(link.id)}
                            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            {link.name}
                        </button>
                    ))}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <a href="https://buymeacoffee.com/harshpal" target="_blank" rel="noreferrer">
                        <Button size="sm" className="gap-2 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black border-none font-bold shadow-sm hover:shadow-md transition-all">
                            <Coffee className="w-4 h-4" />
                            <span className="font-bold">Buy coffee</span>
                        </Button>
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
                                    <Button className="w-full gap-2 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black border-none font-bold">
                                        <Coffee className="w-4 h-4" />
                                        Buy me a coffee
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

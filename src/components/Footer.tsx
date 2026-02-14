
import { motion } from "framer-motion";
import { Linkedin } from "lucide-react";

const SocialIcon = ({ href, children, label }: { href: string; children: React.ReactNode; label: string }) => (
    <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ y: -2, scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all duration-200"
        aria-label={label}
    >
        {children}
    </motion.a>
);

const XIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
);

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative w-full mt-24 pb-12 pt-20" role="contentinfo">
            {/* Background Branding (SVG) */}
            <div
                className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none select-none z-0 opacity-[0.04] dark:opacity-[0.08] h-[500px] overflow-hidden"
                style={{
                    maskImage: 'linear-gradient(to top, black 0%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)'
                }}
            >
                <img
                    src="/logo/Lotiq.svg"
                    alt=""
                    className="w-[110%] max-w-7xl h-auto object-contain translate-y-[40%] dark:invert"
                />
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
                {/* Horizontal Line */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-200/50 dark:via-zinc-800/50 to-transparent mb-12" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        <span>Built and crafted by Harsh <span className="text-red-500">❤️</span></span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-800"></span>
                        <span>Powered by Chole bhature & AI</span>
                    </div>

                    <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 order-3 md:order-2">
                        © {currentYear} Harsh Pal. All rights reserved
                    </div>

                    <div className="flex items-center gap-1 order-2 md:order-3">
                        <SocialIcon href="https://x.com/Choley_Bhature" label="X (Twitter)">
                            <XIcon />
                        </SocialIcon>
                        <SocialIcon href="https://www.linkedin.com/in/its-harsshhh/" label="LinkedIn">
                            <Linkedin className="h-4 w-4" />
                        </SocialIcon>
                    </div>
                </div>
            </div>
        </footer>
    );
};

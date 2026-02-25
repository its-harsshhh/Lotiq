import { motion, AnimatePresence } from "framer-motion";
import { Code2, Sparkles, Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";

export const DevModeComingSoon = () => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setIsSubmitted(true);

            try {
                // Must use URLSearchParams, NOT FormData, so the content-type is set to application/x-www-form-urlencoded. 
                // Google Forms ignores multipart/form-data submissions for standard forms.
                const searchParams = new URLSearchParams();
                searchParams.append("entry.9763260", email.trim()); // 9763260 is the question Entry ID
                searchParams.append("emailAddress", email.trim());

                await fetch("https://docs.google.com/forms/d/e/1FAIpQLSf2KsUBnzm_zOoYXkIpmxTVMs4oBfy3qH5gLz5rXKC5oqcDMw/formResponse", {
                    method: "POST",
                    body: searchParams,
                    mode: "no-cors",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                });
            } catch (error) {
                console.error("Waitlist submission error:", error);
            }

            setTimeout(() => setIsSubmitted(false), 3000);
            setEmail("");
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 dark:bg-green-500/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-md w-full px-6 flex flex-col items-center text-center relative z-10"
            >
                {/* Icon Container */}
                <motion.div
                    className="relative mb-8"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <div className="absolute inset-0 bg-green-500/20 rounded-2xl blur-xl" />
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-2xl shadow-green-500/20 border border-green-400/30">
                        <Code2 className="w-12 h-12 text-white" />
                    </div>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-3 -right-3"
                    >
                        <Sparkles className="w-6 h-6 text-amber-400" />
                    </motion.div>
                </motion.div>

                {/* Typography */}
                <h1 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Dev Mode is Coming
                </h1>
                <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-[85%]">
                    Seamlessly bridge the gap between design and development. Inspect animations, copy clean code, and export assets effortlessly.
                </p>

                {/* Waitlist Form or Success Message */}
                <div className="w-full max-w-sm h-11 relative">
                    <AnimatePresence mode="wait">
                        {!isSubmitted ? (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleSubmit}
                                className="w-full flex items-center gap-2 absolute inset-0"
                            >
                                <Input
                                    type="email"
                                    placeholder="Join the waitlist..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 bg-background/50 backdrop-blur-sm border-border/50 focus-visible:ring-green-500/30 w-full rounded-xl transition-all"
                                    required
                                />
                                <Button
                                    type="submit"
                                    className="h-11 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 transition-all font-medium whitespace-nowrap"
                                >
                                    Notify Me
                                    <Send className="w-4 h-4 ml-2" />
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-green-500/10 border border-green-500/20 rounded-xl px-4 text-green-600 dark:text-green-400 font-medium text-sm text-center"
                            >
                                🎉 You're on the list! We'll inform you soon.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="mt-10 text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-border" />
                    Early Access
                    <span className="w-4 h-[1px] bg-border" />
                </p>
            </motion.div>
        </div>
    );
};


import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { MessageSquare, Send, Loader2, CheckCircle2, ChevronDown } from "lucide-react";
import { AnimatePresence } from "framer-motion";


export const FeedbackSection = () => {
    // STATE
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    // FORM HANDLER
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setLastError(null);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        // We will replace this with the user's email later
        const EMAIL_ENDPOINT = "https://formsubmit.co/ajax/harshpal1.gdsc@gmail.com";

        try {
            const response = await fetch(EMAIL_ENDPOINT, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    _subject: `Lotiq Feedback: ${data.subject || 'General'}`,
                    _template: "table",
                    ...data
                })
            });

            if (!response.ok) throw new Error("Failed to send message");

            setIsSuccess(true);
            e.currentTarget.reset();
        } catch (error) {
            console.error(error);
            // setLastError("Something went wrong. Please try again.");
            // For now, since the endpoint is invalid (placeholder), we might simulate success or show error.
            // But Formsubmit will strictly fail on invalid email.
            setLastError("Please configure the email address in `FeedbackSection.tsx` first.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="feedback" className="w-full max-w-2xl mx-auto mb-32 relative">

            <div className="text-center mb-10 space-y-2">
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-3">
                    <MessageSquare className="w-8 h-8 text-indigo-500" />
                    <span>Got a suggestion?</span>
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Feature request? Bug report? Just saying hi? <br />
                    I read every message directly.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="group relative rounded-3xl p-px bg-gradient-to-br from-zinc-200 via-zinc-200 to-zinc-200 dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-800 hover:bg-gradient-to-br hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all duration-500 shadow-xl shadow-zinc-200/50 dark:shadow-black/50"
            >
                <div className="absolute inset-0 bg-white dark:bg-zinc-950 rounded-3xl opacity-100 dark:opacity-95 backdrop-blur-xl"></div>

                <div className="relative rounded-[23px] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl p-8 transition-all duration-500 group-hover:bg-white/90 dark:group-hover:bg-black/40">

                    {isSuccess ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-[300px] text-center space-y-4"
                        >
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Message Sent!</h3>
                            <p className="text-zinc-500 dark:text-zinc-400 max-w-xs">
                                Thanks for your feedback. I'll get back to you as soon as possible.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setIsSuccess(false)}
                                className="mt-4"
                            >
                                Send another
                            </Button>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 ml-1">Name</label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Your name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all h-11"
                                    />
                                    <div className="h-4 pl-1">
                                        <AnimatePresence>
                                            {name.length > 2 && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                                    className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400/80 italic"
                                                >
                                                    {name.toLowerCase().includes('harsh') ? "That's a legendary name! 👑" : "You have a cute name <3"}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 ml-1">Email</label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="so I can reply..."
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all h-11"
                                    />
                                    <div className="h-4 pl-1">
                                        <AnimatePresence>
                                            {email.includes('@') && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                                    className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 italic"
                                                >
                                                    I'll keep this safe, promise! 🔒
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 ml-1">Subject</label>
                                <div className="relative group/select">
                                    <select
                                        id="subject"
                                        name="subject"
                                        className="w-full h-11 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700"
                                    >
                                        <option value="Feature Request">✨ Feature Request</option>
                                        <option value="Bug Report">🐛 Bug Report</option>
                                        <option value="Feedback">💭 General Feedback</option>
                                        <option value="Other">👋 Just saying hi</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 ml-1">Message</label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    placeholder="Tell me what's on your mind..."
                                    required
                                    rows={4}
                                    className="resize-none bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[120px]"
                                />
                            </div>

                            {/* Honeypot for spam */}
                            <input type="text" name="_honey" style={{ display: 'none' }} />
                            {/* Disable Captcha for smoother UX (optional) */}
                            <input type="hidden" name="_captcha" value="false" />

                            {lastError && (
                                <p className="text-sm text-red-500 text-center">{lastError}</p>
                            )}

                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full relative overflow-hidden bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl group transition-all duration-300 shadow-lg shadow-indigo-500/20"
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%]"
                                        animate={!isSubmitting ? { translateX: ["-100%", "200%"] } : {}}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 2.5,
                                            ease: "linear",
                                            repeatDelay: 1
                                        }}
                                    />
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            <span>Sending...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                Send Message <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                                            </span>
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        </form>
                    )}
                </div>
            </motion.div>
        </section>
    );
};

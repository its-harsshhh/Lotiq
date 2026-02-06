
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { MessageSquare, Send, Loader2, CheckCircle2 } from "lucide-react";


export const FeedbackSection = () => {
    // STATE
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

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

            <div className="group relative rounded-3xl p-1 bg-gradient-to-br from-indigo-50/50 via-white to-zinc-50 dark:from-indigo-500/10 dark:via-zinc-900 dark:to-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-black/50 transition-all duration-500">
                <div className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-3xl opacity-60 backdrop-blur-xl"></div>

                <div className="relative rounded-[20px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 p-8">

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
                                    <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="Your name"
                                        required
                                        className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="so I can reply..."
                                        required
                                        className="bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Subject</label>
                                <select
                                    id="subject"
                                    name="subject"
                                    className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="Feature Request">✨ Feature Request</option>
                                    <option value="Bug Report">🐛 Bug Report</option>
                                    <option value="Feedback">💭 General Feedback</option>
                                    <option value="Other">👋 Just saying hi</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Message</label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    placeholder="Tell me what's on your mind..."
                                    required
                                    rows={4}
                                    className="resize-none bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
                                />
                            </div>

                            {/* Honeypot for spam */}
                            <input type="text" name="_honey" style={{ display: 'none' }} />
                            {/* Disable Captcha for smoother UX (optional) */}
                            <input type="hidden" name="_captcha" value="false" />

                            {lastError && (
                                <p className="text-sm text-red-500 text-center">{lastError}</p>
                            )}

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Message <Send className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};

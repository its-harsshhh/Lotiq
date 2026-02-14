import { Moon, Sun } from "lucide-react"
import { Button } from "./ui/button"
import { useTheme } from "./theme-provider"
import { motion, AnimatePresence } from "framer-motion"
import { flushSync } from "react-dom"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    const toggleTheme = async (e: React.MouseEvent<HTMLButtonElement>) => {
        const newTheme = theme === "light" ? "dark" : "light"

        // @ts-ignore
        if (!document.startViewTransition) {
            setTheme(newTheme)
            return
        }

        const x = e.clientX
        const y = e.clientY
        const endRadius = Math.hypot(
            Math.max(x, innerWidth - x),
            Math.max(y, innerHeight - y)
        )

        // @ts-ignore
        const transition = document.startViewTransition(() => {
            flushSync(() => {
                setTheme(newTheme)
            })
        })

        await transition.ready

        const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
        ]

        document.documentElement.animate(
            {
                clipPath: clipPath,
            },
            {
                duration: 500,
                easing: "ease-in-out",
                pseudoElement: "::view-transition-new(root)",
            }
        )
    }


    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative rounded-full w-10 h-10 overflow-hidden bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-0"
        >
            <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                    <motion.div
                        key="moon"
                        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Moon className="h-5 w-5 text-zinc-100" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <Sun className="h-5 w-5 text-zinc-800" />
                    </motion.div>
                )}
            </AnimatePresence>
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

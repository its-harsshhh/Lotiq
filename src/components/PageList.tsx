import { useState } from 'react';
import { useLottieStore } from '../store/useLottieStore';
import { Plus, FileJson, Trash2, MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const PageList = () => {
    const pages = useLottieStore((state) => state.pages);
    const activePageId = useLottieStore((state) => state.activePageId);
    const addPage = useLottieStore((state) => state.addPage);
    const setActivePage = useLottieStore((state) => state.setActivePage);
    const removePage = useLottieStore((state) => state.removePage);
    const renamePage = useLottieStore((state) => state.renamePage);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);

    const startEditing = (id: string, currentName: string) => {
        setEditingId(id);
        setEditName(currentName);
    };

    const submitEdit = () => {
        if (editingId && editName.trim()) {
            renamePage(editingId, editName.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="flex flex-col border-b bg-muted/10">
            <div
                className="flex items-center justify-between px-3 py-2 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group/header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pages</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-zinc-200 dark:hover:bg-zinc-800 opacity-40 group-hover/header:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); addPage(); }}
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
            </div>

            {isExpanded && (
                <div className="flex flex-col max-h-[200px] overflow-y-auto">
                    {pages.map((page) => {
                        const isActive = page.id === activePageId;

                        return (
                            <div
                                key={page.id}
                                onClick={() => setActivePage(page.id)}
                                className={cn(
                                    "group flex items-center justify-between px-3 py-1.5 cursor-pointer text-sm transition-colors border-l-2",
                                    isActive
                                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-900 dark:text-indigo-100"
                                        : "border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
                                )}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileJson className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-indigo-500" : "text-zinc-400")} />

                                    {editingId === page.id ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={submitEdit}
                                            onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                                            autoFocus
                                            className="bg-transparent border-none outline-none w-full h-5 text-sm p-0 m-0"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="truncate" onDoubleClick={() => startEditing(page.id, page.name)}>
                                            {page.name}
                                        </span>
                                    )}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                "h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity",
                                                isActive && "opacity-100"
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32">
                                        <DropdownMenuItem onClick={() => startEditing(page.id, page.name)}>
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20"
                                            onClick={() => removePage(page.id)}
                                            disabled={pages.length <= 1}
                                        >
                                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

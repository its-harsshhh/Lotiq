import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResizableLayoutProps {
    leftPanel: React.ReactNode;
    centerPanel: React.ReactNode;
    rightPanel: React.ReactNode;
    leftDefaultWidth?: number;
    rightDefaultWidth?: number;
    minWidth?: number;
    maxWidth?: number;
}

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
    leftPanel,
    centerPanel,
    rightPanel,
    leftDefaultWidth = 280,
    rightDefaultWidth = 280,
    minWidth = 200,
    maxWidth = 400,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [leftWidth, setLeftWidth] = useState(leftDefaultWidth);
    const [rightWidth, setRightWidth] = useState(rightDefaultWidth);
    const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);

    const handleMouseDown = useCallback((side: 'left' | 'right') => {
        setIsDragging(side);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();

        if (isDragging === 'left') {
            const newWidth = e.clientX - containerRect.left;
            setLeftWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
        } else if (isDragging === 'right') {
            const newWidth = containerRect.right - e.clientX;
            setRightWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
        }
    }, [isDragging, minWidth, maxWidth]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(null);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div ref={containerRef} className="flex h-full w-full overflow-hidden">
            {/* Left Panel */}
            <div style={{ width: leftWidth, minWidth: leftWidth, maxWidth: leftWidth }} className="h-full overflow-hidden">
                {leftPanel}
            </div>

            {/* Left Resize Handle */}
            <div
                className={cn(
                    "w-1 bg-border hover:bg-primary/50 cursor-col-resize flex items-center justify-center transition-colors relative group",
                    isDragging === 'left' && "bg-primary/50"
                )}
                onMouseDown={() => handleMouseDown('left')}
            >
                <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
                <div className="h-8 w-4 bg-muted border rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
            </div>

            {/* Center Panel */}
            <div className="flex-1 h-full overflow-hidden min-w-0">
                {centerPanel}
            </div>

            {/* Right Resize Handle */}
            <div
                className={cn(
                    "w-1 bg-border hover:bg-primary/50 cursor-col-resize flex items-center justify-center transition-colors relative group",
                    isDragging === 'right' && "bg-primary/50"
                )}
                onMouseDown={() => handleMouseDown('right')}
            >
                <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
                <div className="h-8 w-4 bg-muted border rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
            </div>

            {/* Right Panel */}
            <div style={{ width: rightWidth, minWidth: rightWidth, maxWidth: rightWidth }} className="h-full overflow-hidden">
                {rightPanel}
            </div>
        </div>
    );
};

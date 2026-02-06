import { useState, useEffect } from 'react';
import { RgbaColorPicker, type RgbaColor } from 'react-colorful';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

extend([namesPlugin]);

interface AdvancedColorPickerProps {
    color: string; // Hex string (likely)
    onChange: (newColor: string) => void;
}

type ColorFormat = 'hex' | 'rgb' | 'hsl';

export const AdvancedColorPicker = ({ color, onChange }: AdvancedColorPickerProps) => {
    const [format, setFormat] = useState<ColorFormat>('hex');
    const [localColor, setLocalColor] = useState<RgbaColor>({ r: 0, g: 0, b: 0, a: 1 });

    // Sync from prop
    useEffect(() => {
        const c = colord(color);
        if (c.isValid()) {
            setLocalColor(c.toRgb());
        }
    }, [color]);

    const handleColorChange = (newColor: RgbaColor) => {
        setLocalColor(newColor);
        // Emit specific format or just HEX with Alpha if needed?
        // Lottie usually uses arrays [r,g,b,a] but UI expects Hex mostly for compatibility.
        // `replaceColor` expects Hex. `updateColorForInstance` expects Hex.
        // If we want transparency, we need to pass Hex+Alpha possibly? 
        // Standard Hex: #RRGGBB. With Alpha: #RRGGBBAA.
        // Helper `colord(newColor).toHex()` returns #RRGGBB(AA)?
        onChange(colord(newColor).toHex());
    };

    const handleInputChange = (val: string) => {
        const c = colord(val);
        if (c.isValid()) {
            const rgb = c.toRgb();
            setLocalColor(rgb);
            onChange(c.toHex());
        }
    };

    // Derived values for inputs
    const hexValue = colord(localColor).toHex();
    const rgbValue = (() => {
        const { r, g, b, a } = localColor;
        return `${r}, ${g}, ${b}, ${Math.round(a * 100)}%`;
    })();
    const hslValue = colord(localColor).toHslString();

    return (
        <div className="flex flex-col gap-3 w-64 p-3 bg-popover rounded-lg shadow-lg border">
            <RgbaColorPicker color={localColor} onChange={handleColorChange} className="!w-full" />

            <div className="flex gap-2">
                <Select value={format} onValueChange={(v: ColorFormat) => setFormat(v)}>
                    <SelectTrigger className="w-[80px] h-8 text-xs">
                        <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="hex">HEX</SelectItem>
                        <SelectItem value="rgb">RGB</SelectItem>
                        <SelectItem value="hsl">HSL</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex-1">
                    {format === 'hex' && (
                        <div className="flex items-center gap-1">
                            <Input
                                className="h-8 text-xs font-mono"
                                value={hexValue.toUpperCase()}
                                onChange={(e) => handleInputChange(e.target.value)}
                            />
                        </div>
                    )}
                    {format === 'rgb' && (
                        <div className="flex items-center gap-1">
                            <Input
                                className="h-8 text-xs font-mono"
                                value={rgbValue}
                                onChange={(e) => handleInputChange(`rgba(${e.target.value})`)} // basic parser attempt
                                placeholder="r, g, b, a%"
                            />
                        </div>
                    )}
                    {format === 'hsl' && (
                        <div className="flex items-center gap-1">
                            <Input
                                className="h-8 text-xs font-mono"
                                value={hslValue}
                                onChange={(e) => handleInputChange(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Opacity Slider Metadata (Optional, since visual slider handles it) */}
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>Opacity</span>
                <span>{Math.round(localColor.a * 100)}%</span>
            </div>
        </div>
    );
};

import type { LottieJSON, LottieLayer, LottieShape } from "./lottie-schema";

// Helper to convert 0-1 RGB to Hex
export const rgbToHex = (r: number, g: number, b: number, a: number = 1): string => {
    const toHex = (c: number) => {
        const hex = Math.round(c * 255).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    };
    if (a < 1) {
        return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
    }
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Helper to convert Hex to 0-1 RGB (supports Alpha)
export const hexToRgb = (hex: string): [number, number, number, number] => {
    // Check for #RRGGBBAA
    const resultAlpha = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (resultAlpha) {
        return [
            parseInt(resultAlpha[1], 16) / 255,
            parseInt(resultAlpha[2], 16) / 255,
            parseInt(resultAlpha[3], 16) / 255,
            parseInt(resultAlpha[4], 16) / 255,
        ];
    }

    // Check for #RRGGBB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0, 1];
    return [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
        1 // Default Alpha
    ];
};

export interface GradientStop {
    hex: string;
    offset: number;
    index: number;
}

export type ColorType = 'solid' | 'gradient';

export interface ColorLocation {
    assetId?: string; // ID of the asset (precomp) if this layer is inside one
    layerInd: number;
    layerName: string;
    shapeIndices: number[]; // Path to the shape in the layer's shapes array
    type: ColorType;
    // For solids, this might be irrelevant or used if mult-stops (not typical for 'solid')
    // For gradients, we don't store stopIndex here because the Location represents the WHOLE gradient.
}

export interface ColorInstance {
    type: ColorType;
    // For solids
    hex?: string;
    // For gradients
    stops?: GradientStop[];
    locations: ColorLocation[];
    count: number;
    id: string; // hex or signature
}

export const extractColors = (json: LottieJSON): ColorInstance[] => {
    const solidsMap = new Map<string, ColorLocation[]>();
    const gradientsMap = new Map<string, { stops: GradientStop[]; locations: ColorLocation[] }>();

    const processShape = (shape: LottieShape, layerInd: number, layerName: string, path: number[], assetId?: string) => {
        // Helper to extract opacity
        let alpha = 1;
        if (shape.o) {
            if (typeof shape.o.k === 'number') {
                alpha = shape.o.k / 100;
            } else if (Array.isArray(shape.o.k) && typeof shape.o.k[0] === 'number') {
                alpha = shape.o.k[0] / 100;
            }
        }

        // 1. Solid Fills/Strokes
        if ((shape.ty === "fl" || shape.ty === "st") && shape.c && shape.c.k) {
            const k = shape.c.k;
            if (Array.isArray(k) && typeof k[0] === 'number' && k.length >= 3) {
                // Use the extracted alpha from shape.o
                const hex = rgbToHex(k[0], k[1], k[2], alpha);
                const loc: ColorLocation = { layerInd, layerName, shapeIndices: [...path], type: 'solid', assetId };
                const existing = solidsMap.get(hex) || [];
                existing.push(loc);
                solidsMap.set(hex, existing);
            }
        }

        // 2. Gradients
        if ((shape.ty === "gf" || shape.ty === "gs") && shape.g) {
            let gradientData: number[] | undefined;
            /* @ts-ignore */
            if (shape.g.k && Array.isArray(shape.g.k.k) && typeof shape.g.k.k[0] === 'number') {
                gradientData = shape.g.k.k;
            }
            // @ts-ignore
            else if (shape.g.k && Array.isArray(shape.g.k.k) && shape.g.k.k[0] && Array.isArray(shape.g.k.k[0].s)) {
                /* @ts-ignore */
                gradientData = shape.g.k.k[0].s;
            }
            else if (Array.isArray(shape.g.k) && typeof shape.g.k[0] === 'number') {
                gradientData = shape.g.k;
            }

            let points = shape.g.p;
            if ((typeof points !== 'number' || points === 0) && gradientData) {
                points = Math.floor(gradientData.length / 4);
            }

            if (Array.isArray(gradientData) && typeof points === 'number') {
                const currentStops: GradientStop[] = [];
                for (let i = 0; i < points; i++) {
                    const base = i * 4;
                    if (base + 3 < gradientData.length) {
                        const r = gradientData[base + 1];
                        const g = gradientData[base + 2];
                        const b = gradientData[base + 3];
                        // If alpha/offset is needed?
                        // Usually base+0 is offset.
                        // We use offset for sorting/display
                        const offset = gradientData[base];
                        // Use shape opacity as the stop opacity for now (Global Opacity model)
                        const hex = rgbToHex(r, g, b, alpha);
                        currentStops.push({ hex, offset, index: i });
                    }
                }

                if (currentStops.length > 0) {
                    // Create signature
                    const signature = currentStops.map(s => `${s.index}:${s.hex}`).join('-');
                    const loc: ColorLocation = { layerInd, layerName, shapeIndices: [...path], type: 'gradient', assetId };

                    const existing = gradientsMap.get(signature) || { stops: currentStops, locations: [] };
                    existing.locations.push(loc);
                    gradientsMap.set(signature, existing);
                }
            }
        }

        if (shape.ty === "gr" && shape.it) {
            shape.it.forEach((child, idx) => {
                processShape(child, layerInd, layerName, [...path, idx], assetId);
            });
        }
    };

    const processLayer = (layer: LottieLayer, assetId?: string) => {
        if (layer.shapes) {
            layer.shapes.forEach((shape, idx) => {
                processShape(shape, layer.ind, layer.nm || `Layer ${layer.ind}`, [idx], assetId);
            });
        }
    };

    // Process Main Layers
    json.layers.forEach(l => processLayer(l));

    // Process Assets (Precomps)
    if (json.assets) {
        json.assets.forEach((asset) => {
            if (asset.layers) {
                asset.layers.forEach((layer) => {
                    processLayer(layer, asset.id);
                });
            }
        });
    }

    const result: ColorInstance[] = [];

    // Add Solids
    solidsMap.forEach((locs, hex) => {
        result.push({
            type: 'solid',
            hex,
            locations: locs,
            count: locs.length,
            id: hex
        });
    });

    // Add Gradients
    gradientsMap.forEach((val, sig) => {
        result.push({
            type: 'gradient',
            stops: val.stops,
            locations: val.locations,
            count: val.locations.length,
            id: sig
        });
    });

    return result.sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
};

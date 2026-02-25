import type { LottieJSON, LottieLayer, LottieShape } from "./lottie-schema";
import { hexToRgb } from "./colors";

/**
 * Replaces all instances of a specific color with a new color.
 */
export const replaceColor = (draft: LottieJSON, oldHex: string, newHex: string) => {
    const targetRgb = hexToRgb(oldHex); // [r, g, b]
    const newRgb = hexToRgb(newHex); // [r, g, b]

    // Tolerance for float comparison
    const isMatch = (c: number[]) => {
        if (!c || c.length < 3) return false;
        // Compare r, g, b. Ignore alpha for now or assume 1 if missing.
        return Math.abs(c[0] - targetRgb[0]) < 0.01 &&
            Math.abs(c[1] - targetRgb[1]) < 0.01 &&
            Math.abs(c[2] - targetRgb[2]) < 0.01;
    };

    const updateShape = (shape: LottieShape) => {
        // Fill or Stroke
        if ((shape.ty === "fl" || shape.ty === "st") && shape.c && shape.c.k) {
            const k = shape.c.k;
            if (Array.isArray(k) && typeof k[0] === 'number') {
                // Static color
                if (isMatch(k)) {
                    // Update color [r, g, b]
                    shape.c.k = [newRgb[0], newRgb[1], newRgb[2]];

                    // Update Opacity (o)
                    const newAlpha = newRgb[3] !== undefined ? newRgb[3] : 1;
                    if (!shape.o) {
                        shape.o = { a: 0, k: 100 };
                    }

                    if (typeof shape.o.k === 'number') {
                        shape.o.k = Math.round(newAlpha * 100);
                    } else if (Array.isArray(shape.o.k) && typeof shape.o.k[0] === 'number') {
                        shape.o.k = [Math.round(newAlpha * 100)];
                    }
                }
            }
        }

        // Group recursion
        if (shape.ty === "gr" && shape.it) {
            shape.it.forEach(updateShape);
        }
    };

    const processLayer = (layer: LottieLayer) => {
        if (layer.shapes) {
            layer.shapes.forEach(updateShape);
        }
    };

    draft.layers.forEach(processLayer);

    // Handle assets (Precomps)
    if (draft.assets) {
        draft.assets.forEach((asset) => {
            if (asset.layers) {
                asset.layers.forEach(processLayer);
            }
        });
    }
};

/**
 * Updates a specific color instance.
 */
export const updateColorForInstance = (
    draft: LottieJSON,
    layerInd: number,
    shapeIndices: number[],
    newHex: string,
    type: 'solid' | 'gradient' = 'solid',
    stopIndex: number = 0,
    assetId?: string
) => {
    const newRgb = hexToRgb(newHex);

    let layers = draft.layers;
    if (assetId) {
        const asset = draft.assets?.find(a => a.id === assetId);
        if (asset && asset.layers) {
            layers = asset.layers;
        } else {
            return; // Asset not found
        }
    }

    const layer = layers.find(l => l.ind === layerInd);
    if (!layer || !layer.shapes) return;

    let currentShape: any = layer.shapes[shapeIndices[0]];

    // Traverse down to the specific shape
    for (let i = 1; i < shapeIndices.length; i++) {
        if (currentShape && currentShape.it) {
            currentShape = currentShape.it[shapeIndices[i]];
        } else {
            return; // Path invalid
        }
    }

    if (type === 'solid') {
        if (currentShape && currentShape.c && currentShape.c.k) {
            const k = currentShape.c.k;
            if (Array.isArray(k) && typeof k[0] === 'number') {
                // Update color [r, g, b]
                currentShape.c.k = [newRgb[0], newRgb[1], newRgb[2]];

                // Update Opacity
                const newAlpha = newRgb[3] !== undefined ? newRgb[3] : 1;

                if (!currentShape.o) {
                    currentShape.o = { a: 0, k: 100 };
                }

                if (typeof currentShape.o.k === 'number') {
                    currentShape.o.k = Math.round(newAlpha * 100);
                } else if (Array.isArray(currentShape.o.k) && typeof currentShape.o.k[0] === 'number') {
                    currentShape.o.k = [Math.round(newAlpha * 100)];
                }
            }
        }
    } else if (type === 'gradient') {
        if (currentShape && currentShape.g) {
            // Check if gradient data is in k.k (static) or k.k[0].s (animated) or g.k (minified)
            let gradientData: number[] | undefined;
            if (currentShape.g.k && Array.isArray(currentShape.g.k.k) && typeof currentShape.g.k.k[0] === 'number') {
                gradientData = currentShape.g.k.k;
            } else if (Array.isArray(currentShape.g.k)) {
                gradientData = currentShape.g.k;
            } else if (currentShape.g.k && Array.isArray(currentShape.g.k.k) && currentShape.g.k.k[0] && Array.isArray(currentShape.g.k.k[0].s)) {
                // Animated. We need to update ALL keyframes to this new color to maintain consistency? 
                // Or just update the specific stop in all keyframes.
                // For now, let's update first keyframe only as MVP or better: update all keyframes' start values.
                const keyframes = currentShape.g.k.k;
                keyframes.forEach((kf: any) => {
                    if (kf.s && Array.isArray(kf.s)) {
                        const base = stopIndex * 4;
                        if (base + 3 < kf.s.length) {
                            kf.s[base + 1] = newRgb[0];
                            kf.s[base + 2] = newRgb[1];
                            kf.s[base + 3] = newRgb[2];
                        }
                    }
                    // Should we update 'e' (end) value too? 
                    // Usually s->e. If we want constant change, update both.
                    if (kf.e && Array.isArray(kf.e)) {
                        const base = stopIndex * 4;
                        if (base + 3 < kf.e.length) {
                            kf.e[base + 1] = newRgb[0];
                            kf.e[base + 2] = newRgb[1];
                            kf.e[base + 3] = newRgb[2];
                        }
                    }
                });
                return; // handled
            }

            if (Array.isArray(gradientData)) {
                // Get number of points (color stops)
                let points = currentShape.g.p;
                if (typeof points !== 'number') {
                    points = Math.floor(gradientData.length / 4);
                }

                // Update Color [r, g, b]
                const base = stopIndex * 4;
                if (base + 3 < gradientData.length) {
                    gradientData[base + 1] = newRgb[0];
                    gradientData[base + 2] = newRgb[1];
                    gradientData[base + 3] = newRgb[2];
                }

                // Update Alpha
                const newAlpha = newRgb[3] !== undefined ? newRgb[3] : 1;

                // Lottie Gradient Data Structure: 
                // [ off, r, g, b, ... (p times) ... , off, a, ... (p times) ... ]
                // If length is p * 4, no alphas exist yet. We must create them.

                const colorDataSize = points * 4;

                // Check if we need to initialize alpha stops
                if (gradientData.length === colorDataSize) {
                    // Append default alphas (1) for all stops
                    for (let i = 0; i < points; i++) {
                        const offset = gradientData[i * 4];
                        gradientData.push(offset, 1);
                    }
                }

                // Now update the specific alpha stop
                // Alpha stops start after color stops. Each alpha stop is 2 values: [offset, alpha]
                const alphaStartIndex = colorDataSize;
                const alphaStopBase = alphaStartIndex + (stopIndex * 2);

                if (alphaStopBase + 1 < gradientData.length) {
                    gradientData[alphaStopBase + 1] = newAlpha;
                    // Ensure offset matches color stop offset (in case it drifted or we just created it)
                    gradientData[alphaStopBase] = gradientData[stopIndex * 4];
                }
            }
        }
    }
};

/**
 * Updates a specific gradient stop offset.
 */
export const updateGradientOffset = (
    draft: LottieJSON,
    layerInd: number,
    shapeIndices: number[],
    newOffset: number,
    stopIndex: number,
    assetId?: string
) => {
    let layers = draft.layers;
    if (assetId) {
        const asset = draft.assets?.find(a => a.id === assetId);
        if (asset && asset.layers) {
            layers = asset.layers;
        } else {
            return; // Asset not found
        }
    }

    const layer = layers.find(l => l.ind === layerInd);
    if (!layer || !layer.shapes) return;

    let currentShape: any = layer.shapes[shapeIndices[0]];

    // Traverse down to the specific shape
    for (let i = 1; i < shapeIndices.length; i++) {
        if (currentShape && currentShape.it) {
            currentShape = currentShape.it[shapeIndices[i]];
        } else {
            return; // Path invalid
        }
    }

    if (currentShape && currentShape.g) {
        // Check if gradient data is available
        let gradientData: number[] | undefined;

        if (currentShape.g.k && Array.isArray(currentShape.g.k.k) && typeof currentShape.g.k.k[0] === 'number') {
            gradientData = currentShape.g.k.k;
        } else if (Array.isArray(currentShape.g.k)) {
            gradientData = currentShape.g.k;
        } else if (currentShape.g.k && Array.isArray(currentShape.g.k.k) && currentShape.g.k.k[0] && Array.isArray(currentShape.g.k.k[0].s)) {
            // Handle animated props
            const keyframes = currentShape.g.k.k;
            keyframes.forEach((kf: any) => {
                // Start Value
                if (kf.s && Array.isArray(kf.s)) {
                    const base = stopIndex * 4;
                    if (base < kf.s.length) {
                        kf.s[base] = newOffset;
                    }
                }
                // End Value
                if (kf.e && Array.isArray(kf.e)) {
                    const base = stopIndex * 4;
                    if (base < kf.e.length) {
                        kf.e[base] = newOffset;
                    }
                }
            });
            return;
        }

        if (Array.isArray(gradientData)) {
            const base = stopIndex * 4;
            if (base < gradientData.length) {
                gradientData[base] = newOffset;
            }
        }
    }
};

/**
 * Toggles layer visibility.
 */
export const toggleLayerVisibility = (draft: LottieJSON, layerInd: number) => {
    const layer = draft.layers.find(l => l.ind === layerInd);
    if (layer) {
        layer.hd = !layer.hd;

        // Propagate to children
        const propagateVisibility = (parentId: number, hidden: boolean) => {
            draft.layers.forEach(l => {
                if (l.parent === parentId) {
                    l.hd = hidden;
                    propagateVisibility(l.ind, hidden); // Recursive for nested groups
                }
            });
        };

        propagateVisibility(layerInd, !!layer.hd);
    }
};

/**
 * Deletes a layer.
 */
export const deleteLayer = (draft: LottieJSON, layerInd: number) => {
    const idx = draft.layers.findIndex(l => l.ind === layerInd);
    if (idx !== -1) {
        const deletedLayer = draft.layers[idx];
        const deletedLayerName = deletedLayer.nm;

        // 1. Unparent any orphaned children
        draft.layers.forEach(l => {
            if (l.parent === layerInd) {
                delete l.parent;
            }
        });

        // 2. Handle Track Mattes
        // If the layer being deleted (idx) is a matte for the layer below it (idx + 1),
        const dependentLayer = draft.layers[idx + 1];
        if (dependentLayer && dependentLayer.tt) {
            delete dependentLayer.tt;
        }

        // 3. Scan and Sanitize Expressions (The "Proper" Fix)
        // If any expression references the deleted layer name, it will crash the export.
        if (deletedLayerName) {
            const sanitizeProperties = (obj: any) => {
                if (!obj || typeof obj !== 'object') return;

                // Check for 'x' (Expression) property
                if (typeof obj.x === 'string') {
                    // Simple heuristic: does the expression contain the layer name?
                    // matches: layer("Name") or layer('Name')
                    // We escape the name for regex
                    const escapedName = deletedLayerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`layer\\(["']${escapedName}["']\\)`, 'i');

                    if (regex.test(obj.x)) {
                        console.warn(`[Lotiq] Removed expression referencing deleted layer "${deletedLayerName}"`);
                        delete obj.x; // Remove expression, fallback to keyframes
                    }
                }

                // Recursion
                Object.keys(obj).forEach(key => {
                    sanitizeProperties(obj[key]);
                });
            };

            draft.layers.forEach(layer => sanitizeProperties(layer));
        }

        // 4. Remove the layer
        draft.layers.splice(idx, 1);
    }
};

/**
 * Updates canvas dimensions.
 */
export const updateCanvasSize = (draft: LottieJSON, width: number, height: number) => {
    draft.w = width;
    draft.h = height;
};

/**
 * Updates Lottie Name
 */
export const updateName = (draft: LottieJSON, name: string) => {
    draft.nm = name;
};

/**
 * Renames a layer.
 */
export const renameLayer = (draft: LottieJSON, layerInd: number, newName: string) => {
    const layer = draft.layers.find(l => l.ind === layerInd);
    if (layer) {
        layer.nm = newName;

        // If it's a Text Layer, also update the actual text content being rendered
        if (layer.ty === 5 && layer.t && layer.t.d && Array.isArray(layer.t.d.k)) {
            layer.t.d.k.forEach((keyframe: any) => {
                if (keyframe.s && typeof keyframe.s.t === 'string') {
                    keyframe.s.t = newName;
                }
            });
        }
    }
};

/**
 * Groups selected layers under a new Null layer.
 */
export const groupLayers = (draft: LottieJSON, selectedInds: number[], groupName: string = "Group") => {
    if (selectedInds.length === 0) return;

    // 1. Find a unique ID
    let maxInd = 0;
    draft.layers.forEach(l => {
        if (l.ind > maxInd) maxInd = l.ind;
    });
    const newGroupId = maxInd + 1;

    // 2. Determine insertion index (above the first selected layer in the visual list?)
    // In Lottie, layers are processed. Top visual layer is usually first in array (or last depending on player).
    // Let's assume index 0 is top. We find the minimum array index of selected layers.
    let minIdx = draft.layers.length;
    selectedInds.forEach(ind => {
        const idx = draft.layers.findIndex(l => l.ind === ind);
        if (idx !== -1 && idx < minIdx) minIdx = idx;
    });
    if (minIdx === draft.layers.length) minIdx = 0;

    // 3. Create Null Layer (Type 3)
    const groupLayer: LottieLayer = {
        ind: newGroupId,
        nm: groupName,
        ty: 3, // Null
        ip: 0,
        op: 99999, // Broad range
        st: 0,
        ks: {
            a: { k: [0, 0, 0] },
            p: { k: [0, 0, 0] }, // Origin at 0,0 to preserve child positions
            s: { k: [100, 100, 100] },
            r: { k: 0 },
            o: { k: 100 }
        },
        ao: 0,
        fff: 0
    };

    // 4. Insert Group Layer
    draft.layers.splice(minIdx, 0, groupLayer);

    // 5. Parent selected layers to this group
    selectedInds.forEach(ind => {
        const layer = draft.layers.find(l => l.ind === ind);
        if (layer) {
            // If already parented, we might break the chain or chain it.
            // For now, simple parenting.
            // Note: Parent needs to be valid.
            layer.parent = newGroupId;
        }
    });
};

/**
 * Ungroups a layer (removes the Null layer and unparents children).
 */
export const ungroupLayer = (draft: LottieJSON, groupLayerInd: number) => {
    // 1. Find the group layer in the array
    const groupLayerIdx = draft.layers.findIndex(l => l.ind === groupLayerInd);
    if (groupLayerIdx === -1) return;

    const groupLayer = draft.layers[groupLayerIdx];
    const originalParentId = groupLayer.parent;

    // 2. Find all children of this group
    const children = draft.layers.filter(l => l.parent === groupLayerInd);

    // 3. Reparent children to the group's parent (or remove parent if root)
    children.forEach(child => {
        if (originalParentId !== undefined) {
            child.parent = originalParentId;
        } else {
            delete child.parent;
        }
    });

    // 4. Remove the group layer
    draft.layers.splice(groupLayerIdx, 1);
};

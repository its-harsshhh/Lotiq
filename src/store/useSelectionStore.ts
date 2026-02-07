import { create } from 'zustand';

interface SelectionState {
    // Selected layer IDs (for multi-select)
    selectedLayerIds: number[];
    setSelectedLayerIds: (ids: number[]) => void;
    addSelectedLayer: (id: number) => void;
    removeSelectedLayer: (id: number) => void;
    clearSelectedLayers: () => void;

    // Hovered color cluster ID (for highlighting)
    hoveredColorId: string | null;
    setHoveredColorId: (id: string | null) => void;

    // Selected color cluster ID (for persistent highlighting)
    selectedColorId: string | null;
    setSelectedColorId: (id: string | null) => void;

    // Layer IDs currently highlighted due to color selection
    highlightedLayerIds: number[];
    setHighlightedLayerIds: (ids: number[]) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
    // Layer selection
    selectedLayerIds: [],
    setSelectedLayerIds: (ids) => set({ selectedLayerIds: ids }),
    addSelectedLayer: (id) => set((state) => ({
        selectedLayerIds: state.selectedLayerIds.includes(id)
            ? state.selectedLayerIds
            : [...state.selectedLayerIds, id]
    })),
    removeSelectedLayer: (id) => set((state) => ({
        selectedLayerIds: state.selectedLayerIds.filter(i => i !== id)
    })),
    clearSelectedLayers: () => set({ selectedLayerIds: [] }),

    // Hovered color
    hoveredColorId: null,
    setHoveredColorId: (id) => set({ hoveredColorId: id }),

    // Selected color
    selectedColorId: null,
    setSelectedColorId: (id) => set({ selectedColorId: id }),

    // Highlighted layers (from color selection)
    highlightedLayerIds: [],
    setHighlightedLayerIds: (ids) => set({ highlightedLayerIds: ids }),
}));

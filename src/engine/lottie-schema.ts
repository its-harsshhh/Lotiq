export interface LottieColor {
    k: number[]; // [r, g, b, a] usually, or keyframes
}

export interface LottieShape {
    ty: string; // "fl" = fill, "st" = stroke, "gr" = group, etc.
    nm?: string;
    c?: LottieColor; // Color property
    o?: any; // Opacity
    w?: any; // Width (stroke)
    it?: LottieShape[]; // Items (if group)
    [key: string]: any;
}

export interface LottieLayer {
    ind: number; // Index
    nm: string; // Name
    ty: number; // Type: 0=Precomp, 1=Solid, 2=Image, 3=Null, 4=Shape, 5=Text
    ip: number; // In point
    op: number; // Out point
    st: number; // Start time
    ks: any; // Transform/Keyframes
    shapes?: LottieShape[]; // For shape layers
    refId?: string; // For image/precomp layers
    parent?: number;
    hd?: boolean; // Hidden
    [key: string]: any;
}

export interface LottieAsset {
    id: string;
    w?: number;
    h?: number;
    u?: string; // Path/URL
    p?: string; // Filename/Path
    e?: number; // Embedded?
    layers?: LottieLayer[]; // If precomp
    [key: string]: any;
}

export interface LottieJSON {
    v: string; // Version
    fr: number; // Frame rate
    ip: number; // In point
    op: number; // Out point
    w: number; // Width
    h: number; // Height
    nm?: string; // Name
    assets?: LottieAsset[];
    layers: LottieLayer[];
    markers?: any[];
    [key: string]: any;
}

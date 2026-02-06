import { LayerList } from "./LayerList";

export const InspectorLeft = () => {
    return (
        <div className="w-full h-full border-r bg-background flex flex-col overflow-hidden">
            <LayerList />
        </div>
    );
};

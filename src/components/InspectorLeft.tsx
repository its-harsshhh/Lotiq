import { LayerList } from "./LayerList";

export const InspectorLeft = () => {
    return (
        <div className="w-72 border-r bg-background flex flex-col">
            <LayerList />
        </div>
    );
};

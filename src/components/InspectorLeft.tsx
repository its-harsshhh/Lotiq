import { useLottieStore } from "@/store/useLottieStore";
import { LayerList } from "./LayerList";
import { PageList } from "./PageList";

export const InspectorLeft = () => {
    const lottie = useLottieStore((state) => state.lottie);

    return (
        <div className="w-full h-full border-r bg-background flex flex-col overflow-hidden">
            <PageList />
            <div className="flex-1 overflow-hidden flex flex-col">
                {lottie && <LayerList />}
            </div>
        </div>
    );
};

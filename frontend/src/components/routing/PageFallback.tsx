import { LoadingState } from "@/components/ui/LoadingState";

export function PageFallback() {
  return (
    <div className="min-h-[40vh] bg-paper px-6 py-16">
      <LoadingState label="Loading page" />
    </div>
  );
}

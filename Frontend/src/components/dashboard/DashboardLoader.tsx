import { Loader } from "@/components/ui/loader";

interface DashboardLoaderProps {
  isLoading: boolean;
  message?: string;
}

export function DashboardLoader({ isLoading, message = "Analyzing your business" }: DashboardLoaderProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
      <div className="text-center">
        <Loader text={message} />
        <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed dark:text-slate-400">
          Setting up your personalized dashboard
        </p>
      </div>
    </div>
  );
}

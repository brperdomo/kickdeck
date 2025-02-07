
import { useMemo } from 'react';

interface ProgressIndicatorProps {
  tabs: string[];
  completedTabs: string[];
}

export function ProgressIndicator({ tabs, completedTabs }: ProgressIndicatorProps) {
  const progress = useMemo(() => {
    return (completedTabs.length / tabs.length) * 100;
  }, [tabs.length, completedTabs.length]);

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">Progress</span>
        <span className="text-sm font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#43A047] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import type { GeneratedLayout } from "@shared/schema";

interface HistoryPanelProps {
  onSelectLayout: (layout: GeneratedLayout) => void;
}

export function HistoryPanel({ onSelectLayout }: HistoryPanelProps) {
  const { data: layouts = [], isLoading } = useQuery<GeneratedLayout[]>({
    queryKey: ["/api/layouts?limit=3"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Recent Generations</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 border border-slate-200 rounded-lg animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Recent Generations</h3>
          <span className="text-xs text-slate-500">Last 3</span>
        </div>
        
        <div className="space-y-3">
          {layouts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-sm">No generations yet</p>
              <p className="text-xs mt-1">Your recent layouts will appear here</p>
            </div>
          ) : (
            layouts.map((layout) => (
              <div
                key={layout.id}
                className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => onSelectLayout(layout)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {layout.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(layout.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight className="text-slate-400 w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

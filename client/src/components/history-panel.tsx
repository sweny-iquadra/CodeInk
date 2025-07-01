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
    <Card className="border-2 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">Recent Generations</h3>
          <span className="text-sm text-muted-foreground font-medium px-3 py-1 bg-muted rounded-full">Last 3</span>
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
                className="p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                onClick={() => onSelectLayout(layout)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {layout.title}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      {formatDistanceToNow(new Date(layout.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground group-hover:text-primary w-4 h-4 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

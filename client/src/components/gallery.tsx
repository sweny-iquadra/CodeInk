import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Eye, Globe, Code, Clock, ChevronRight } from "lucide-react";
import type { GeneratedLayout } from "@shared/schema";

interface GalleryProps {
  onSelectLayout: (layout: GeneratedLayout) => void;
}

export function Gallery({ onSelectLayout }: GalleryProps) {
  const { data: publicLayouts = [], isLoading } = useQuery<GeneratedLayout[]>({
    queryKey: ["/api/public-layouts"],
    refetchInterval: 10000, // Refetch every 10 seconds for live updates
  });

  if (isLoading) {
    return (
      <Card className="border-2 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">Recent Public Generations</h3>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-medium">Live Feed</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border border-border rounded-xl animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
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
          <h3 className="text-xl font-bold text-foreground">Recent Public Generations</h3>
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-muted-foreground font-medium">Live Feed</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {publicLayouts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm font-medium mb-1">No public generations yet</p>
              <p className="text-xs">Be the first to share your creation!</p>
            </div>
          ) : (
            publicLayouts.map((layout) => (
              <div
                key={layout.id}
                className="group p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200"
                onClick={() => onSelectLayout(layout)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {layout.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        <Eye className="w-3 h-3 mr-1" />
                        Public
                      </Badge>
                      {(layout as any).category && (
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: (layout as any).category.color }}
                          />
                          <span className="text-xs text-muted-foreground font-medium">
                            {(layout as any).category.name}
                          </span>
                        </div>
                      )}
                    </div>
                    {layout.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {layout.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-2 flex-shrink-0" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(new Date(layout.createdAt), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Code className="w-3 h-3" />
                      <span className="capitalize">{layout.inputMethod}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLayout(layout);
                    }}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {publicLayouts.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Live updates every 10 seconds</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { InputPanel } from "@/components/input-panel";
import { OutputPanel } from "@/components/output-panel";
import { HistoryPanel } from "@/components/history-panel";
import { LoadingModal } from "@/components/loading-modal";
import { useToast } from "@/hooks/use-toast";
import type { GeneratedLayout } from "@shared/schema";

interface GenerationResult {
  html: string;
  title: string;
  description: string;
  id: number;
}

export default function Home() {
  const [currentCode, setCurrentCode] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateFromTextMutation = useMutation({
    mutationFn: async ({ description, additionalContext }: { description: string; additionalContext?: string }) => {
      const response = await apiRequest("POST", "/api/generate-from-text", {
        description,
        additionalContext,
      });
      return response.json();
    },
    onSuccess: (data: GenerationResult) => {
      setCurrentCode(data.html);
      setCurrentTitle(data.title);
      setIsReady(true);
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      toast({
        title: "Code generated successfully!",
        description: "Your HTML layout has been created.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message,
      });
    },
  });

  const generateFromImageMutation = useMutation({
    mutationFn: async ({ file, additionalContext }: { file: File; additionalContext?: string }) => {
      const formData = new FormData();
      formData.append("image", file);
      if (additionalContext) {
        formData.append("additionalContext", additionalContext);
      }

      const response = await fetch("/api/generate-from-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }

      return response.json();
    },
    onSuccess: (data: GenerationResult) => {
      setCurrentCode(data.html);
      setCurrentTitle(data.title);
      setIsReady(true);
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      toast({
        title: "Code generated from image!",
        description: "Your layout has been analyzed and converted to HTML.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Image analysis failed",
        description: error.message,
      });
    },
  });

  const handleGenerate = (data: { 
    type: 'text' | 'image'; 
    description?: string; 
    additionalContext?: string; 
    file?: File 
  }) => {
    if (data.type === 'text' && data.description) {
      generateFromTextMutation.mutate({
        description: data.description,
        additionalContext: data.additionalContext,
      });
    } else if (data.type === 'image' && data.file) {
      generateFromImageMutation.mutate({
        file: data.file,
        additionalContext: data.additionalContext,
      });
    }
  };

  const handleSelectLayout = (layout: GeneratedLayout) => {
    setCurrentCode(layout.generatedCode);
    setCurrentTitle(layout.title);
    setIsReady(true);
    toast({
      title: "Layout loaded",
      description: `Loaded "${layout.title}" from history.`,
    });
  };

  const isLoading = generateFromTextMutation.isPending || generateFromImageMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header />
      
      {/* Hero Section */}
      <div className="border-b border-border bg-gradient-to-r from-background to-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground tracking-tight">
              Transform Ideas into
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"> Code</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Upload sketches, describe layouts, or share screenshots. Our AI instantly generates responsive HTML and Tailwind CSS code ready for production.
            </p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <InputPanel onGenerate={handleGenerate} isLoading={isLoading} />
            <HistoryPanel onSelectLayout={handleSelectLayout} />
          </div>
          
          <div className="lg:col-span-8">
            <OutputPanel 
              generatedCode={currentCode}
              title={currentTitle}
              isReady={isReady}
            />
          </div>
        </div>
      </div>

      <Footer />
      
      <LoadingModal open={isLoading} />
    </div>
  );
}

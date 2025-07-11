import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { InputPanel } from "@/components/input-panel";
import { OutputPanel } from "@/components/output-panel";
import { HistoryPanel } from "@/components/history-panel";
import { Gallery } from "@/components/gallery";
import { LoadingModal } from "@/components/loading-modal";
import { DesignAssistant } from "@/components/design-assistant";
import { ProjectManagement } from "@/components/project-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Home as HomeIcon, Image, Folder } from "lucide-react";
import type { GeneratedLayout } from "@shared/schema";

interface GenerationResult {
  html: string;
  title: string;
  description: string;
  id: number;
  versionNumber?: string;
}

export default function Home() {
  const [currentCode, setCurrentCode] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentLayoutId, setCurrentLayoutId] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [outputTab, setOutputTab] = useState("code");
  const [selectedLayoutForManagement, setSelectedLayoutForManagement] = useState<GeneratedLayout | undefined>(undefined);
  const [projectManagementTab, setProjectManagementTab] = useState("organization");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateFromTextMutation = useMutation({

    mutationFn: async ({ description, additionalContext, isPublic, categoryId, layoutName }: { description: string; additionalContext?: string; isPublic?: boolean; categoryId?: number; layoutName: string }) => {

      const controller = new AbortController();
      setAbortController(controller);
      
      const response = await apiRequest("POST", "/api/generate-from-text", {
        description,
        additionalContext,
        isPublic: isPublic || false,
        categoryId,
        layoutName,
      }, controller.signal);
      return response.json();
    },
    onSuccess: (data: GenerationResult) => {
      setCurrentCode(data.html);
      setCurrentTitle(data.title);
      setCurrentLayoutId(data.id);
      setIsReady(true);
      setOutputTab("preview"); // Auto-switch to preview for live preview
      setAbortController(null);
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      toast({
        title: "Code generated successfully!",
        description: "Your HTML layout has been created.",
      });
    },
    onError: (error) => {
      setAbortController(null);
      if (error.name === 'AbortError') {
        toast({
          title: "Generation cancelled",
          description: "Code generation was cancelled by user.",
        });
        return;
      }
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message,
      });
    },
  });

  const generateFromImageMutation = useMutation({

    mutationFn: async ({ file, additionalContext, isPublic, categoryId, layoutName }: { file: File; additionalContext?: string; isPublic?: boolean; categoryId?: number; layoutName: string }) => {
      const controller = new AbortController();
      setAbortController(controller);
      
      const formData = new FormData();
      formData.append("image", file);
      if (additionalContext) {
        formData.append("additionalContext", additionalContext);
      }

      formData.append("isPublic", String(isPublic || false));
      if (categoryId) {
        formData.append("categoryId", String(categoryId));
      }
      formData.append("layoutName", layoutName);

      // Use authenticated fetch with JWT token for file uploads
      const accessToken = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/generate-from-image", {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
        signal: controller.signal,
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
      setCurrentLayoutId(data.id);
      setIsReady(true);
      setOutputTab("preview"); // Auto-switch to preview for live preview
      setAbortController(null);
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      toast({
        title: "Code generated from image!",
        description: "Your layout has been analyzed and converted to HTML.",
      });
    },
    onError: (error) => {
      setAbortController(null);
      if (error.name === 'AbortError') {
        toast({
          title: "Generation cancelled",
          description: "Image generation was cancelled by user.",
        });
        return;
      }
      toast({
        variant: "destructive",
        title: "Image analysis failed",
        description: error.message,
      });
    },
  });

  const improveMutation = useMutation({
    mutationFn: async (feedback: string) => {
      const controller = new AbortController();
      setAbortController(controller);
      
      console.log("Improving layout with currentLayoutId:", currentLayoutId);
      
      const response = await apiRequest("POST", "/api/improve-layout", {
        code: currentCode,
        feedback,
        originalLayoutId: currentLayoutId,
      }, controller.signal);
      return response.json();
    },
    onSuccess: (data: GenerationResult) => {
      setCurrentCode(data.html);
      setCurrentTitle(data.title);
      setCurrentLayoutId(data.id);
      setIsReady(true);
      setOutputTab("preview"); // Auto-switch to preview for live preview
      setAbortController(null);
      queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
      toast({
        title: "Layout improved!",
        description: data.versionNumber ? `Version ${data.versionNumber} created with improvements.` : "Your layout has been enhanced based on AI feedback.",
      });
    },
    onError: (error) => {
      setAbortController(null);
      if (error.name === 'AbortError') {
        toast({
          title: "Improvement cancelled",
          description: "Layout improvement was cancelled by user.",
        });
        return;
      }
      toast({
        variant: "destructive",
        title: "Improvement failed",
        description: error.message,
      });
    },
  });

  const handleGenerate = (data: { 
    type: 'text' | 'image'; 
    description?: string; 
    additionalContext?: string; 
    file?: File;
    isPublic?: boolean;
    categoryId?: number;
    layoutName?: string;
  }) => {
    if (data.type === 'text' && data.description && data.layoutName) {
      generateFromTextMutation.mutate({
        description: data.description,
        additionalContext: data.additionalContext,
        isPublic: data.isPublic,
        categoryId: data.categoryId,
        layoutName: data.layoutName,
      });
    } else if (data.type === 'image' && data.file && data.layoutName) {
      generateFromImageMutation.mutate({
        file: data.file,
        additionalContext: data.additionalContext,
        isPublic: data.isPublic,
        categoryId: data.categoryId,
        layoutName: data.layoutName,
      });
    }
  };

  const handleSelectLayout = (layout: GeneratedLayout) => {
    console.log("Selecting layout with ID:", layout.id);
    setCurrentCode(layout.generatedCode);
    setCurrentTitle(layout.title);
    setCurrentLayoutId(layout.id);
    setIsReady(true);
    setOutputTab("preview"); // Auto-switch to preview when selecting layout
    toast({
      title: "Layout loaded",
      description: `Loaded "${layout.title}" from history.`,
    });
  };

  const handleSelectLayoutForManagement = (layout: GeneratedLayout) => {
    console.log("handleSelectLayoutForManagement called with layout:", layout.id, layout.versionNumber);
    console.log("Layout generatedCode preview:", layout.generatedCode?.substring(0, 200));
    console.log("Current code before update:", currentCode?.substring(0, 100));
    setSelectedLayoutForManagement(layout);
    // Also update the code editor to show the selected layout
    setCurrentCode(layout.generatedCode);
    setCurrentTitle(layout.title);
    setCurrentLayoutId(layout.id);
    setIsReady(true);
    setOutputTab("preview"); // Auto-switch to preview when selecting layout
    console.log("Code updated to:", layout.generatedCode?.substring(0, 100));
    toast({
      title: "Layout selected",
      description: `Selected "${layout.title}" (${layout.versionNumber || 'Original'}) for project management.`,
    });
  };

  const handleLayoutImproved = (improvedLayout: { html: string; title: string; description: string }) => {
    setCurrentCode(improvedLayout.html);
    setCurrentTitle(improvedLayout.title);
    setIsReady(true);
    queryClient.invalidateQueries({ queryKey: ["/api/layouts"] });
  };

  const handleAssistantCodeGenerate = (description: string, additionalContext?: string, isPublic?: boolean, categoryId?: number) => {
    generateFromTextMutation.mutate({
      description,
      additionalContext,
      isPublic: isPublic ?? false, // Default to private if not specified
      categoryId,
    });
  };

  const handleAssistantCodeImprove = (feedback: string) => {
    if (currentCode) {
      // Use the improve layout API
      improveMutation.mutate(feedback);
    }
  };

  const handleCancelGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const isLoading = generateFromTextMutation.isPending || generateFromImageMutation.isPending || improveMutation.isPending;

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
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <HomeIcon className="w-4 h-4" />
              <span>Create</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center space-x-2">
              <Image className="w-4 h-4" />
              <span>Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center space-x-2">
              <Folder className="w-4 h-4" />
              <span>Manage</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create">
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
                  onLayoutImproved={handleLayoutImproved}
                  activeTab={outputTab}
                  onTabChange={setOutputTab}
                  currentLayoutId={currentLayoutId}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="gallery">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <Gallery onSelectLayout={handleSelectLayout} />
              </div>
              
              <div className="lg:col-span-8">
                <OutputPanel 
                  generatedCode={currentCode}
                  title={currentTitle}
                  isReady={isReady}
                  onLayoutImproved={handleLayoutImproved}
                  activeTab={outputTab}
                  onTabChange={setOutputTab}
                  currentLayoutId={currentLayoutId}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="manage">
            {projectManagementTab === "search" ? (
              <div className="space-y-8">
                <ProjectManagement 
                  onSelectLayout={handleSelectLayoutForManagement}
                  currentLayout={selectedLayoutForManagement}
                  defaultTab={projectManagementTab}
                  onTabChange={setProjectManagementTab}
                />
                <OutputPanel 
                  generatedCode={selectedLayoutForManagement?.generatedCode || currentCode}
                  title={selectedLayoutForManagement?.title || currentTitle}
                  isReady={!!(selectedLayoutForManagement || isReady)}
                  onLayoutImproved={handleLayoutImproved}
                  activeTab={outputTab}
                  onTabChange={setOutputTab}
                  currentLayoutId={selectedLayoutForManagement?.id || currentLayoutId}
                  userRole={selectedLayoutForManagement?.sharedRole}
                  onCodeChange={(code) => {
                    if (selectedLayoutForManagement) {
                      setSelectedLayoutForManagement({
                        ...selectedLayoutForManagement,
                        generatedCode: code
                      });
                    } else {
                      setCurrentCode(code);
                    }
                  }}
                />
              </div>
            ) : (
              <div className={`grid ${projectManagementTab === "collaborate" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12"} gap-8`}>
                <div className={projectManagementTab === "collaborate" ? "w-full" : "lg:col-span-4"}>
                  <ProjectManagement 
                    onSelectLayout={handleSelectLayoutForManagement}
                    currentLayout={selectedLayoutForManagement}
                    defaultTab={projectManagementTab}
                    onTabChange={setProjectManagementTab}
                  />
                </div>
                
                {projectManagementTab !== "collaborate" && (
                  <div className="lg:col-span-8">
                    <OutputPanel 
                      generatedCode={selectedLayoutForManagement?.generatedCode || currentCode}
                      title={selectedLayoutForManagement?.title || currentTitle}
                      isReady={!!(selectedLayoutForManagement || isReady)}
                      onLayoutImproved={handleLayoutImproved}
                      activeTab={outputTab}
                      onTabChange={setOutputTab}
                      currentLayoutId={selectedLayoutForManagement?.id || currentLayoutId}
                      userRole={selectedLayoutForManagement?.sharedRole}
                      onCodeChange={(code) => {
                        if (selectedLayoutForManagement) {
                          setSelectedLayoutForManagement({
                            ...selectedLayoutForManagement,
                            generatedCode: code
                          });
                        } else {
                          setCurrentCode(code);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
      
      <LoadingModal open={isLoading} onCancel={handleCancelGeneration} />
      
      {/* AI Design Assistant Chatbot */}
      <DesignAssistant 
        currentCode={currentCode}
        onCodeGenerate={handleAssistantCodeGenerate}
        onCodeImprove={handleAssistantCodeImprove}
        onSwitchToPreview={() => setOutputTab("preview")}
      />
    </div>
  );
}

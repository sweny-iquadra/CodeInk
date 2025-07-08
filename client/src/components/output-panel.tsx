import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Code, 
  Eye, 
  Copy, 
  Download, 
  ExternalLink, 
  Smartphone, 
  Tablet, 
  Monitor,
  Lightbulb,
  Wand2,
  Save,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface OutputPanelProps {
  generatedCode?: string;
  title?: string;
  isReady: boolean;
  onLayoutImproved?: (improvedLayout: { html: string; title: string; description: string }) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  currentLayoutId?: number;
  userRole?: string; // 'viewer', 'editor', 'admin', or undefined for own layouts
  onCodeChange?: (code: string) => void;
}

export function OutputPanel({ generatedCode = "", title = "", isReady, onLayoutImproved, activeTab, onTabChange, currentLayoutId, userRole, onCodeChange }: OutputPanelProps) {
  const [activeView, setActiveView] = useState("code");
  
  // Use external activeTab if provided, otherwise use internal state
  const currentTab = activeTab || activeView;
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setActiveView(tab);
    }
  };
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [improvementFeedback, setImprovementFeedback] = useState("");
  const [showImprovementDialog, setShowImprovementDialog] = useState(false);
  const [editableCode, setEditableCode] = useState(generatedCode);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  // Determine if user can edit this layout
  const canEdit = !userRole || userRole === 'editor' || userRole === 'admin';
  const isViewOnly = userRole === 'viewer';

  // Update editable code when generatedCode changes
  useEffect(() => {
    setEditableCode(generatedCode);
  }, [generatedCode]);

  // Handle code changes for editable textarea
  const handleCodeChange = (newCode: string) => {
    setEditableCode(newCode);
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };

  // Handle iframe link clicks to prevent navigation away from Codink
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleIframeLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Prevent all links from navigating away
        const links = iframeDoc.querySelectorAll('a');
        links.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href && href.startsWith('http')) {
              // Open external links in new tab
              window.open(href, '_blank');
            }
            // Ignore internal links to keep preview contained
          });
        });

        // Prevent form submissions that could navigate away
        const forms = iframeDoc.querySelectorAll('form');
        forms.forEach(form => {
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            toast({
              title: "Form submission disabled",
              description: "Forms are disabled in preview mode.",
            });
          });
        });
      } catch (error) {
        // Silently handle cross-origin errors
        console.log('Cross-origin iframe access blocked');
      }
    };

    iframe.addEventListener('load', handleIframeLoad);
    
    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, [generatedCode, toast]);

  const explainMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/explain-code", { code });
      return response.json();
    },
    onSuccess: (data) => {
      setExplanation(data.explanation);
      setShowExplanation(true);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to explain code",
        description: error.message,
      });
    },
  });

  const improveMutation = useMutation({
    mutationFn: async ({ code, feedback }: { code: string; feedback?: string }) => {
      console.log("Improving layout with currentLayoutId:", currentLayoutId);
      const response = await apiRequest("POST", "/api/improve-layout", { 
        code, 
        feedback,
        originalLayoutId: currentLayoutId
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Layout improved!",
        description: "Your layout has been enhanced with AI suggestions.",
      });
      setShowImprovementDialog(false);
      setImprovementFeedback("");
      // Call the callback to update the parent component's state
      if (onLayoutImproved) {
        onLayoutImproved({
          html: data.html,
          title: data.title,
          description: data.description
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to improve layout",
        description: error.message,
      });
    },
  });

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast({
        title: "Code copied!",
        description: "The generated code has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Unable to copy code to clipboard.",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-") || "generated-layout"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your HTML file is being downloaded.",
    });
  };

  const handleOpenInNewTab = () => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(generatedCode);
      newWindow.document.close();
    }
  };

  const handleExplain = () => {
    if (!generatedCode) return;
    explainMutation.mutate(generatedCode);
  };

  const handleImprove = () => {
    if (!generatedCode) return;
    setShowImprovementDialog(true);
  };

  const submitImprovement = () => {
    improveMutation.mutate({ code: generatedCode, feedback: improvementFeedback });
  };

  const getPreviewWidth = () => {
    switch (previewDevice) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      default:
        return "100%";
    }
  };



  return (
    <>
      <Card className="overflow-hidden border-2 shadow-lg bg-card/50 backdrop-blur-sm">
        <div className="border-b border-border p-6 bg-gradient-to-r from-background to-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-foreground">Generated Code</h2>
              <Badge variant={isReady ? "default" : "secondary"} className={`px-3 py-1 rounded-full font-semibold ${isReady ? "bg-green-100 text-green-800 border-green-200" : "bg-muted text-muted-foreground"}`}>
                <CheckCircle className="w-3 h-3 mr-2" />
                {isReady ? "Ready" : "No Output"}
              </Badge>
            </div>
            <Tabs value={currentTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="relative">
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsContent value="code" className="m-0">
              <div className="flex items-center justify-between bg-slate-900 px-4 py-2">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-slate-300">HTML + Tailwind CSS</span>
                  <span className="text-xs text-slate-500">
                    {generatedCode ? `${(generatedCode.length / 1024).toFixed(1)} KB` : "0 KB"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-400 hover:text-white"
                    onClick={handleCopyCode}
                    disabled={!generatedCode}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-400 hover:text-white"
                    onClick={handleDownload}
                    disabled={!generatedCode}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              
              <div className="bg-slate-900 text-slate-300 font-mono text-sm overflow-auto h-[600px] relative">
                {generatedCode ? (
                  <>
                    {isViewOnly && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          👁️ View Only
                        </Badge>
                      </div>
                    )}
                    {canEdit ? (
                      <Textarea
                        value={editableCode}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        className="w-full h-full p-4 bg-slate-900 text-slate-300 font-mono text-sm border-none resize-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Edit your HTML code here..."
                      />
                    ) : (
                      <pre className="p-4 whitespace-pre-wrap">{generatedCode}</pre>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <div className="text-center">
                      <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No code generated yet</p>
                      <p className="text-sm mt-1">Upload a file or describe your layout to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="m-0">
              <div className="bg-slate-100 p-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-slate-700">Live Preview</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={previewDevice === "mobile" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("mobile")}
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={previewDevice === "tablet" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("tablet")}
                      >
                        <Tablet className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={previewDevice === "desktop" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("desktop")}
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-700"
                    onClick={handleOpenInNewTab}
                    disabled={!generatedCode}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-center bg-slate-100 p-4 h-[600px]">
                {editableCode ? (
                  <iframe
                    ref={iframeRef}
                    className="bg-white border border-slate-300 rounded"
                    style={{ width: getPreviewWidth(), height: "100%" }}
                    srcDoc={editableCode}
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full text-slate-500">
                    <div className="text-center">
                      <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No preview available</p>
                      <p className="text-sm mt-1">Generate code to see the preview</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            

          </Tabs>
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={handleExplain}
                disabled={!generatedCode || explainMutation.isPending || isViewOnly}
                title={isViewOnly ? "View-only users cannot explain code" : ""}
              >
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
                {explainMutation.isPending ? "Explaining..." : "Explain Code"}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleImprove}
                disabled={!generatedCode || improveMutation.isPending || isViewOnly}
                title={isViewOnly ? "View-only users cannot suggest improvements" : ""}
              >
                <Wand2 className="w-4 h-4 mr-2 text-purple-500" />
                {improveMutation.isPending ? "Improving..." : "Suggest Improvements"}
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                disabled={!generatedCode || isViewOnly}
                title={isViewOnly ? "View-only users cannot save layouts" : ""}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleDownload}
                disabled={!generatedCode || isViewOnly}
                title={isViewOnly ? "View-only users cannot export layouts" : ""}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Explanation Dialog */}
      <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Code Explanation</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{explanation}</pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Improvement Dialog */}
      <Dialog open={showImprovementDialog} onOpenChange={setShowImprovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggest Improvements</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">What would you like to improve?</label>
              <Textarea
                placeholder="E.g., Make it more modern, improve accessibility, add animations, better mobile layout..."
                value={improvementFeedback}
                onChange={(e) => setImprovementFeedback(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowImprovementDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={submitImprovement}
                disabled={improveMutation.isPending}
              >
                {improveMutation.isPending ? "Improving..." : "Improve Layout"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2, Eye, Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatbotPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  generatedCode?: string;
  title?: string;
  isGenerating?: boolean;
}

export function ChatbotPreview({ 
  isOpen, 
  onClose, 
  generatedCode = "", 
  title = "Live Preview",
  isGenerating = false 
}: ChatbotPreviewProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [previewContent, setPreviewContent] = useState(generatedCode);

  // Update preview content when new code is generated
  useEffect(() => {
    if (generatedCode) {
      setPreviewContent(generatedCode);
    }
  }, [generatedCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 w-96 max-h-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            {isGenerating ? "Generating..." : title}
          </h3>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 p-0"
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('preview')}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium transition-colors",
                activeTab === 'preview'
                  ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-b-2 border-purple-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <Eye className="h-3 w-3 mr-1 inline" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium transition-colors",
                activeTab === 'code'
                  ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-b-2 border-purple-500"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              <Code className="h-3 w-3 mr-1 inline" />
              Code
            </button>
          </div>

          {/* Content Area */}
          <div className="h-80 overflow-hidden">
            {isGenerating ? (
              <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Generating layout...</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'preview' ? (
              <div className="h-full">
                {previewContent ? (
                  <iframe
                    srcDoc={previewContent}
                    className="w-full h-full border-0"
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No preview available</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full overflow-auto p-3">
                {previewContent ? (
                  <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                    <code>{previewContent}</code>
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No code available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer with live indicator */}
          {previewContent && (
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Live Preview Active</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
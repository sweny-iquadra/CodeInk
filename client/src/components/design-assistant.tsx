import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  User, 
  Send, 
  Wand2, 
  Lightbulb, 
  Code, 
  Sparkles,
  Loader2,
  MessageSquare,
  X,
  Minimize2
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  suggestions?: string[];
  actionType?: 'generate' | 'improve' | 'recommend';
  actionData?: any;
}

interface DesignAssistantProps {
  currentCode?: string;
  onCodeGenerate?: (description: string, additionalContext?: string) => void;
  onCodeImprove?: (feedback: string) => void;
}

export function DesignAssistant({ 
  currentCode, 
  onCodeGenerate, 
  onCodeImprove 
}: DesignAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hi! I'm CodeGenie, your AI design companion. I can instantly create layouts, provide design feedback, and recommend frameworks. Just describe what you want to build and I'll generate it immediately!",
      sender: "assistant",
      timestamp: new Date(),
      suggestions: [
        "Create a landing page for my restaurant",
        "Build a dashboard for analytics", 
        "Design a portfolio website",
        "Make an e-commerce product page"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async ({ message, currentLayout, conversationHistory }: {
      message: string;
      currentLayout?: string;
      conversationHistory?: Array<{ content: string; sender: 'user' | 'assistant' }>;
    }) => {
      const response = await apiRequest("POST", "/api/design-assistant/chat", {
        message,
        currentLayout,
        conversationHistory
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: data.response,
        sender: "assistant",
        timestamp: new Date(),
        suggestions: data.suggestions,
        actionType: data.actionType,
        actionData: data.actionData
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Auto-execute actions for better interactivity
      if (data.actionType === 'generate' && data.actionData) {
        // Immediately trigger code generation for instant results
        setTimeout(() => {
          handleActionClick(assistantMessage);
        }, 500); // Quick execution for immediate feedback
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get response from AI assistant"
      });
    }
  });

  const frameworkMutation = useMutation({
    mutationFn: async (requirements: string) => {
      const response = await apiRequest("POST", "/api/design-assistant/framework-recommendation", {
        requirements
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: `framework-${Date.now()}`,
        content: `Based on your requirements, I recommend **${data.framework.toUpperCase()}**:\n\n${data.reasoning}\n\n**Alternatives:**\n${data.alternatives.map((alt: any) => `• **${alt.name}**: ${alt.reason}`).join('\n')}`,
        sender: "assistant",
        timestamp: new Date(),
        actionType: "recommend",
        actionData: data
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async (htmlCode: string) => {
      const response = await apiRequest("POST", "/api/design-assistant/analyze-layout", {
        htmlCode
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: `analysis-${Date.now()}`,
        content: `**Layout Analysis** (Priority: ${data.priority}):\n\n${data.reasoning}\n\n**Suggested Improvements:**\n${data.improvements.map((improvement: string) => `• ${improvement}`).join('\n')}`,
        sender: "assistant",
        timestamp: new Date(),
        actionType: "improve",
        actionData: data
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  });

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Prepare conversation history for context
    const conversationHistory = messages.slice(-5).map(msg => ({
      content: msg.content,
      sender: msg.sender
    }));

    await chatMutation.mutateAsync({
      message: inputValue,
      currentLayout: currentCode,
      conversationHistory
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Auto-scroll to bottom to show the input with the suggestion
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleActionClick = (message: Message) => {
    const { actionType, actionData } = message;

    switch (actionType) {
      case 'generate':
        if (onCodeGenerate && actionData?.description) {
          onCodeGenerate(actionData.description, actionData.additionalContext);
          toast({
            title: "🎨 Generating Layout",
            description: "Creating your layout based on our conversation..."
          });
          
          // Add a system message to show generation is in progress
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            content: "🔄 Generating your layout now... This will appear in the preview once complete!",
            sender: "assistant",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, systemMessage]);
        }
        break;
      
      case 'improve':
        if (onCodeImprove && actionData?.improvements && currentCode) {
          // Join all improvements into a single feedback string
          const improvementFeedback = actionData.improvements.join('. ');
          onCodeImprove(improvementFeedback);
          toast({
            title: "✨ Improving Layout",
            description: "Enhancing your current layout with AI suggestions..."
          });
          
          // Add a system message to show improvement is in progress
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            content: "🔄 Applying improvements to your layout... Check the preview for updates!",
            sender: "assistant",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, systemMessage]);
        } else if (!currentCode) {
          toast({
            variant: "destructive",
            title: "No Code to Improve",
            description: "Please generate a layout first before applying improvements."
          });
        }
        break;
      
      case 'recommend':
        toast({
          title: "📋 Framework Recommendation",
          description: `${actionData?.framework?.toUpperCase()} is recommended for your project`
        });
        break;
    }
  };

  const handleQuickAnalyze = () => {
    if (currentCode) {
      analyzeMutation.mutate(currentCode);
      toast({
        title: "Analyzing Layout",
        description: "Getting design feedback for your current layout..."
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when messages update
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    };
    
    // Use timeout to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Chat icon button when not open
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <div className="relative">
            <MessageSquare className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
          </div>
        </Button>
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            CodeGenie - AI Helper
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-xl border-2 border-violet-200 dark:border-violet-800 flex flex-col">
      <CardHeader className="pb-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Bot className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <CardTitle className="text-lg text-violet-900 dark:text-violet-100">CodeGenie</CardTitle>
          </div>
          <div className="flex space-x-1">
            {currentCode && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleQuickAnalyze}
                disabled={analyzeMutation.isPending}
                title="Analyze current layout"
                className="text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200"
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lightbulb className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                <div className="flex items-center space-x-2 mb-1">
                  {message.sender === 'assistant' ? (
                    <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  ) : (
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Separator className="my-2" />
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick suggestions:</div>
                      {message.suggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left justify-start text-xs h-auto p-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}

                  {message.actionType && message.actionData && (
                    <div className="mt-3">
                      <Separator className="my-2" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActionClick(message)}
                        className="w-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900"
                      >
                        {message.actionType === 'generate' && <Wand2 className="h-4 w-4 mr-2" />}
                        {message.actionType === 'improve' && <Code className="h-4 w-4 mr-2" />}
                        {message.actionType === 'recommend' && <Lightbulb className="h-4 w-4 mr-2" />}
                        {message.actionType === 'generate' && 'Generate Layout'}
                        {message.actionType === 'improve' && 'Apply Improvements'}
                        {message.actionType === 'recommend' && 'View Details'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="flex items-center space-x-2 mb-1">
                  <Bot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">typing...</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your layout idea..."
            className="flex-1"
            disabled={chatMutation.isPending}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || chatMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
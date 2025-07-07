import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Pen, CloudUpload, Wand2, Eye, EyeOff, Tag } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { PromptExamples } from "./prompt-examples";
import { apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

interface InputPanelProps {
  onGenerate: (data: { type: 'text' | 'image'; description?: string; additionalContext?: string; file?: File; isPublic?: boolean; categoryId?: number }) => void;
  isLoading: boolean;
}

export function InputPanel({ onGenerate, isLoading }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [description, setDescription] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get categories for dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return await response.json();
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or PDF file.",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleGenerate = () => {
    if (activeTab === "upload") {
      if (!selectedFile) {
        toast({
          variant: "destructive",
          title: "No file selected",
          description: "Please upload a file to generate code.",
        });
        return;
      }
      onGenerate({
        type: 'image',
        file: selectedFile,
        additionalContext,
        isPublic,
        categoryId: selectedCategory,
      });
    } else {
      if (!description.trim()) {
        toast({
          variant: "destructive",
          title: "No description provided",
          description: "Please describe your layout to generate code.",
        });
        return;
      }
      onGenerate({
        type: 'text',
        description,
        additionalContext,
        isPublic,
        categoryId: selectedCategory,

      });
    }
  };

  const handleUsePrompt = (prompt: string) => {
    setDescription(prompt);
    setActiveTab("describe");
  };

  return (
    <div className="space-y-6">
      <PromptExamples onUsePrompt={handleUsePrompt} />
      <Card className="border-2 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Create Your Layout</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="upload" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Upload className="w-4 h-4" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="describe" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Pen className="w-4 h-4" />
                Describe Layout
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-8">
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : selectedFile
                    ? "border-green-500 bg-green-50 shadow-lg"
                    : "border-border hover:border-primary hover:bg-primary/5"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                    <CloudUpload className="text-primary w-8 h-8" />
                  </div>
                  <div>
                    {selectedFile ? (
                      <>
                        <p className="text-foreground font-semibold text-lg">File selected: {selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground mt-2">Click to select a different file</p>
                      </>
                    ) : (
                      <>
                        <p className="text-foreground font-semibold text-lg">
                          Drop your files here, or <span className="text-primary font-bold">browse</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Supports: JPG, PNG, PDF sketches</p>
                      </>
                    )}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileInputChange}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="describe" className="mt-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="description" className="text-base font-semibold text-foreground">Layout Description</Label>
                  <Textarea
                    id="description"
                    className="mt-3 resize-none border-2 rounded-xl text-base min-h-[120px] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    rows={5}
                    placeholder="Describe your layout: 'A modern SaaS landing page with header navigation, hero section with centered text and call-to-action button, three-column feature grid with icons...'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8">
            <Label htmlFor="additionalContext" className="text-base font-semibold text-foreground">Additional Context <span className="text-muted-foreground font-normal">(Optional)</span></Label>
            <Textarea
              id="additionalContext"
              className="mt-3 resize-none border-2 rounded-xl text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              rows={3}
              placeholder="Any specific requirements, brand colors, target audience, or functionality notes..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
            />
          </div>


          {/* Category Selection */}
          <div className="mt-6">
            <Label className="text-base font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Select value={selectedCategory?.toString() || "none"} onValueChange={(value) => setSelectedCategory(value === "none" ? null : parseInt(value))}>
              <SelectTrigger className="mt-3 border-2 rounded-xl text-base focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <SelectValue placeholder="Choose a category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility Toggle */}
          <div className="mt-6 p-4 border-2 border-dashed border-border/50 rounded-xl bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isPublic ? (
                  <Eye className="w-5 h-5 text-green-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="visibility-toggle" className="text-base font-medium cursor-pointer">
                    {isPublic ? "Public Layout" : "Private Layout"}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isPublic 
                      ? "This layout will be visible in the public gallery"
                      : "This layout will only be visible to you"
                    }
                  </p>
                </div>
              </div>
              <Switch
                id="visibility-toggle"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>

          <Button 
            className="w-full mt-6 h-14 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl" 
            onClick={handleGenerate}
            disabled={isLoading}
          >
            <Wand2 className="w-5 h-5 mr-3" />
            {isLoading ? "Generating Your Code..." : "Generate Code"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

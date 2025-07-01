import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Pen, CloudUpload, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InputPanelProps {
  onGenerate: (data: { type: 'text' | 'image'; description?: string; additionalContext?: string; file?: File }) => void;
  isLoading: boolean;
}

export function InputPanel({ onGenerate, isLoading }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState("upload");
  const [description, setDescription] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Input Method</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="describe" className="flex items-center gap-2">
                <Pen className="w-4 h-4" />
                Describe
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-6">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? "border-blue-400 bg-blue-50"
                    : selectedFile
                    ? "border-green-400 bg-green-50"
                    : "border-slate-300 hover:border-blue-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <CloudUpload className="text-blue-600 text-xl w-6 h-6" />
                  </div>
                  <div>
                    {selectedFile ? (
                      <>
                        <p className="text-slate-600 font-medium">File selected: {selectedFile.name}</p>
                        <p className="text-sm text-slate-400 mt-1">Click to select a different file</p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-600 font-medium">
                          Drop your files here, or <span className="text-blue-600">browse</span>
                        </p>
                        <p className="text-sm text-slate-400 mt-1">Supports: JPG, PNG, PDF sketches</p>
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
            
            <TabsContent value="describe" className="mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Layout Description</Label>
                  <Textarea
                    id="description"
                    className="mt-2 resize-none"
                    rows={4}
                    placeholder="Describe your layout: 'A header with navigation, hero section with centered text and button, three-column feature grid...'"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
            <Textarea
              id="additionalContext"
              className="mt-2 resize-none"
              rows={3}
              placeholder="Any specific requirements, brand colors, or functionality notes..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
            />
          </div>

          <Button 
            className="w-full mt-6" 
            onClick={handleGenerate}
            disabled={isLoading}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isLoading ? "Generating..." : "Generate Code"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

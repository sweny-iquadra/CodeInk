import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, Palette, Layout, Smartphone } from "lucide-react";

export function PromptTips() {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <h3 className="font-semibold text-slate-800 text-sm">Prompt Writing Guide</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Layout className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">Structure</p>
                <p className="text-slate-600">Start with layout (header, hero, sections, footer)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Target className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">Purpose</p>
                <p className="text-slate-600">Mention the site type (landing, dashboard, blog)</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Palette className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">Style</p>
                <p className="text-slate-600">Include colors, theme (modern, professional)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Smartphone className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">Responsive</p>
                <p className="text-slate-600">Mention mobile-first, responsive behavior</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-slate-600 mb-2">
            <span className="font-medium">Example pattern:</span>
          </p>
          <div className="bg-white rounded p-2 text-xs text-slate-700 border">
            "Create a <Badge variant="outline" className="text-xs px-1 py-0 mx-1">modern SaaS landing page</Badge> with 
            <Badge variant="outline" className="text-xs px-1 py-0 mx-1">header navigation</Badge>, 
            <Badge variant="outline" className="text-xs px-1 py-0 mx-1">hero section with CTA</Badge>, 
            <Badge variant="outline" className="text-xs px-1 py-0 mx-1">3-column features</Badge>. Use 
            <Badge variant="outline" className="text-xs px-1 py-0 mx-1">blue/white colors</Badge> and 
            <Badge variant="outline" className="text-xs px-1 py-0 mx-1">responsive design</Badge>."
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
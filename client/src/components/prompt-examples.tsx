import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Copy, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PromptExample {
  title: string;
  category: string;
  prompt: string;
  tags: string[];
}

const promptExamples: PromptExample[] = [
  {
    title: "Modern SaaS Landing Page",
    category: "Landing Pages",
    prompt: "Create a modern SaaS landing page with a navigation header containing logo and menu items, a hero section with large headline 'Transform Your Business with AI', subtitle, email signup form, and two call-to-action buttons. Add a features section with 3 columns showing icons and descriptions, testimonials carousel, and footer with links. Use blue and white color scheme with gradients.",
    tags: ["SaaS", "Hero", "Features", "CTA"]
  },
  {
    title: "E-commerce Product Grid",
    category: "E-commerce",
    prompt: "Design a product listing page with a search bar at top, filter sidebar on left with categories and price ranges, main content area showing product cards in a 4-column grid. Each card should have product image, title, price, rating stars, and 'Add to Cart' button. Include pagination at bottom and breadcrumb navigation.",
    tags: ["Products", "Grid", "Filters", "Cards"]
  },
  {
    title: "Dashboard Interface",
    category: "Admin/Dashboard",
    prompt: "Create a clean admin dashboard with a sidebar navigation containing icons and menu items, top header with user profile and notifications, main content area with statistics cards showing numbers and charts, a data table with sortable columns, and action buttons. Use a professional color scheme with good contrast.",
    tags: ["Admin", "Sidebar", "Stats", "Table"]
  },
  {
    title: "Blog Homepage",
    category: "Content/Blog",
    prompt: "Design a blog homepage with header containing site logo and navigation menu, featured article section with large image and excerpt, grid of recent blog posts (3 columns) with thumbnails, titles, dates, and read more links. Add sidebar with author bio, popular posts, and newsletter signup. Include social media icons in footer.",
    tags: ["Blog", "Articles", "Sidebar", "Content"]
  },
  {
    title: "Contact & About Page",
    category: "Company Pages",
    prompt: "Create a contact page with company information section, contact form with name, email, message fields and submit button, embedded map placeholder, office address and hours, team member cards with photos and roles. Use professional styling with subtle shadows and clean typography.",
    tags: ["Contact", "Form", "Team", "Professional"]
  },
  {
    title: "Mobile App Landing",
    category: "App Promotion",
    prompt: "Design a mobile app landing page with header navigation, hero section showing app screenshots on phone mockups, key features list with icons, download buttons for App Store and Google Play, user reviews section with star ratings, and simple footer. Use vibrant colors and modern design.",
    tags: ["Mobile", "App", "Screenshots", "Download"]
  }
];

interface PromptExamplesProps {
  onUsePrompt: (prompt: string) => void;
}

export function PromptExamples({ onUsePrompt }: PromptExamplesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast({
        title: "Prompt copied!",
        description: "The prompt has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Unable to copy prompt to clipboard.",
      });
    }
  };

  const categories = Array.from(new Set(promptExamples.map(p => p.category)));

  return (
    <Card>
      <CardContent className="p-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">Sample Prompts & Examples</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <div className="space-y-4">
              <div className="text-sm text-slate-600 mb-4">
                <p className="font-medium mb-2">💡 Tips for effective prompts:</p>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  <li>Be specific about layout structure (header, hero, sections)</li>
                  <li>Mention color schemes and styling preferences</li>
                  <li>Include interactive elements (buttons, forms, navigation)</li>
                  <li>Specify responsive behavior for mobile/desktop</li>
                </ul>
              </div>

              {categories.map(category => (
                <div key={category} className="space-y-2">
                  <h4 className="font-medium text-slate-800 text-sm">{category}</h4>
                  <div className="space-y-3">
                    {promptExamples
                      .filter(example => example.category === category)
                      .map((example, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-sm text-slate-800">{example.title}</h5>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleCopyPrompt(example.prompt)}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-blue-600"
                                onClick={() => onUsePrompt(example.prompt)}
                              >
                                Use
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                            {example.prompt}
                          </p>
                          
                          <div className="flex flex-wrap gap-1">
                            {example.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Pro tip:</strong> You can combine elements from different examples or add specific requirements like "make it dark themed" or "add animations" to customize the output.
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
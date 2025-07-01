import { Moon, Github, Code, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground tracking-tight">Codink</span>
                <span className="text-xs text-muted-foreground font-medium">AI Code Generator</span>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-primary font-semibold border-b-2 border-primary pb-4 -mb-px transition-colors">
                Generator
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground pb-4 transition-colors font-medium">
                Gallery
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground pb-4 transition-colors font-medium">
                Docs
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl"
            >
              <Moon className="h-4 w-4" />
            </Button>
            <Button className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:from-primary/90 hover:to-blue-600/90 shadow-lg transition-all duration-200 rounded-xl font-semibold">
              <Github className="w-4 h-4 mr-2" />
              Star on GitHub
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

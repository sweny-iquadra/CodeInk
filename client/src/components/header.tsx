import { Moon, Github, Code } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Code className="text-white text-sm w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-slate-800">Codink</span>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-4 -mb-px">
                Generator
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-800 pb-4">
                Gallery
              </a>
              <a href="#" className="text-slate-600 hover:text-slate-800 pb-4">
                Docs
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:text-slate-800"
            >
              <Moon className="h-4 w-4" />
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <Github className="w-4 h-4 mr-2" />
              Star on GitHub
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

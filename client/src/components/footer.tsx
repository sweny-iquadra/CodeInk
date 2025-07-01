import { Sparkles, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-background to-muted/50 border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-6 md:mb-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-lg">Codink</span>
              <span className="text-sm text-muted-foreground font-medium">AI-Powered UI Code Generator</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
            <div className="flex items-center space-x-6 text-sm font-medium text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">API</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>by developers, for developers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

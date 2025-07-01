import { Code } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Code className="text-white text-xs w-3 h-3" />
            </div>
            <span className="font-semibold text-slate-800">Codink</span>
            <span className="text-slate-500">•</span>
            <span className="text-sm text-slate-600">AI-Powered UI Code Generator</span>
          </div>
          <div className="flex items-center space-x-6 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-800">Privacy</a>
            <a href="#" className="hover:text-slate-800">Terms</a>
            <a href="#" className="hover:text-slate-800">API</a>
            <a href="#" className="hover:text-slate-800">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface LoadingModalProps {
  open: boolean;
  progress?: number;
}

export function LoadingModal({ open, progress = 65 }: LoadingModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md mx-4 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Generating Your Code</h3>
          <p className="text-slate-600 mb-4">
            Our AI is analyzing your input and creating responsive HTML + Tailwind CSS...
          </p>
          <Progress value={progress} className="w-full mb-2" />
          <p className="text-sm text-slate-500">This usually takes 10-30 seconds</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

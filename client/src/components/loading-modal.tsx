import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface LoadingModalProps {
  open: boolean;
  progress?: number;
}

export function LoadingModal({ open, progress = 65 }: LoadingModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg mx-4 p-10 border-2 bg-background/95 backdrop-blur-md shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">Generating Your Code</h3>
          <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
            Our AI is analyzing your input and creating responsive HTML + Tailwind CSS...
          </p>
          <Progress value={progress} className="w-full mb-4 h-3 rounded-full" />
          <p className="text-sm text-muted-foreground font-medium">This usually takes 10-30 seconds</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

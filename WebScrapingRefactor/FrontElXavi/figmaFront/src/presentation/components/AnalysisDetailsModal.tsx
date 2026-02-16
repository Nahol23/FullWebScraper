import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import type { Analysis } from "../../domain/entities/Analysis";

interface AnalysisDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: Analysis | null;
}

export function AnalysisDetailsModal({
  isOpen,
  onClose,
  analysis,
}: AnalysisDetailsModalProps) {
  if (!analysis) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Analysis Details</DialogTitle>
        </DialogHeader>
        <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap bg-zinc-900 p-4 rounded-lg">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      </DialogContent>
    </Dialog>
  );
}

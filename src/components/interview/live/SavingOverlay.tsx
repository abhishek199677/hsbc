import { Upload, Film } from "lucide-react";
import type { SavingOverlayProps } from "./types";

export default function SavingOverlay({ saving, savingStatus }: SavingOverlayProps) {
  if (!saving) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-indigo-400 animate-bounce" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Finalizing your interview</h3>
        <p className="text-gray-400 mb-4">{savingStatus}</p>
        <div className="flex items-center gap-2 justify-center text-gray-500 text-sm">
          <Film className="w-4 h-4" />
          <span>Your video recording is being processed</span>
        </div>
      </div>
    </div>
  );
}

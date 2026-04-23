import { ChangeEvent } from "react";

interface LogInputProps {
  logText: string;
  onLogTextChange: (value: string) => void;
  onAnalyze: () => void;
  disabled?: boolean;
}

export default function LogInput({ logText, onLogTextChange, onAnalyze, disabled = false }: LogInputProps) {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onLogTextChange(text);
  };

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Paste Logs</h2>
      <textarea
        value={logText}
        onChange={(e) => onLogTextChange(e.target.value)}
        placeholder="Paste server or application logs here..."
        className="h-64 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-slate-500"
      />
      <div className="flex items-center gap-3">
        <input type="file" accept=".log,.txt,text/plain" onChange={handleFileChange} disabled={disabled} />
        <button
          onClick={onAnalyze}
          disabled={disabled || !logText.trim()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Analyze Logs
        </button>
      </div>
    </div>
  );
}

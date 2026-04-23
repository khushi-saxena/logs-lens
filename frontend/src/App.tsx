import { useEffect, useMemo, useState } from "react";
import AnalysisResult from "./components/AnalysisResult";
import HistorySidebar, { HistoryItem } from "./components/HistorySidebar";
import LogInput from "./components/LogInput";
import { useWebSocket } from "./hooks/useWebSocket";

interface AnalysisDetail {
  id: string;
  log_text: string;
  root_cause: string;
  error_chain: string;
  affected_services: string;
  severity: "critical" | "warning" | "info";
  suggested_fix: string;
  raw_response: string;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const WS_BASE = (import.meta.env.VITE_WS_BASE_URL || API_BASE).replace("http", "ws");

export default function App() {
  const [logText, setLogText] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { streamedText, isStreaming, error, connect, disconnect } = useWebSocket();

  const filteredHistory = useMemo(
    () =>
      history.filter((item) => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return true;
        return item.summary.toLowerCase().includes(keyword) || item.id.toLowerCase().includes(keyword);
      }),
    [history, search]
  );

  const loadHistory = async () => {
    const response = await fetch(`${API_BASE}/api/history`);
    const data = (await response.json()) as HistoryItem[];
    setHistory(data);
  };

  useEffect(() => {
    loadHistory().catch(console.error);
    return () => disconnect();
  }, []);

  const handleAnalyze = async () => {
    setIsSubmitting(true);
    setAnalysis(null);
    disconnect();

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_text: logText }),
      });

      if (!response.ok) {
        throw new Error("Failed to start analysis.");
      }

      const data = (await response.json()) as { analysis_id: string };
      setSelectedId(data.analysis_id);
      connect(`${WS_BASE}/ws/analyze/${data.analysis_id}`, (completed) => {
        setAnalysis({
          id: completed.id,
          log_text: logText,
          root_cause: completed.root_cause,
          error_chain: completed.error_chain,
          affected_services: completed.affected_services,
          severity: completed.severity,
          suggested_fix: completed.suggested_fix,
          raw_response: completed.raw_response,
          created_at: new Date().toISOString(),
        });
        loadHistory().catch(console.error);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectHistory = async (id: string) => {
    setSelectedId(id);
    disconnect();
    const response = await fetch(`${API_BASE}/api/history/${id}`);
    if (!response.ok) return;
    const data = (await response.json()) as AnalysisDetail;
    setAnalysis(data);
    setLogText(data.log_text);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <HistorySidebar
        items={filteredHistory}
        search={search}
        onSearchChange={setSearch}
        onSelect={handleSelectHistory}
        selectedId={selectedId}
      />

      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <header>
            <h1 className="text-3xl font-bold">LogLens</h1>
            <p className="mt-1 text-sm text-slate-600">AI-powered log analysis with real-time streaming output.</p>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </header>

          <LogInput logText={logText} onLogTextChange={setLogText} onAnalyze={handleAnalyze} disabled={isStreaming || isSubmitting} />
          <AnalysisResult analysis={analysis} streamedText={streamedText} isLoading={isStreaming || isSubmitting} />
        </div>
      </main>
    </div>
  );
}

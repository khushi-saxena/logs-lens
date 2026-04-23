import SeverityBadge from "./SeverityBadge";

interface AnalysisData {
  root_cause: string;
  error_chain: string;
  affected_services: string;
  severity: "critical" | "warning" | "info";
  suggested_fix: string;
  raw_response: string;
}

interface AnalysisResultProps {
  analysis: AnalysisData | null;
  streamedText: string;
  isLoading: boolean;
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{content || "Not available."}</p>
    </div>
  );
}

export default function AnalysisResult({ analysis, streamedText, isLoading }: AnalysisResultProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Analysis Result</h2>

      {isLoading && !analysis && (
        <div className="space-y-2">
          <p className="text-sm text-slate-500">Analyzing logs and streaming response...</p>
          <pre className="max-h-56 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
            {streamedText || "Waiting for model output..."}
          </pre>
        </div>
      )}

      {!isLoading && analysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700">Structured report</h3>
            <SeverityBadge severity={analysis.severity} />
          </div>
          <Section title="Root Cause" content={analysis.root_cause} />
          <Section title="Error Chain" content={analysis.error_chain} />
          <Section title="Affected Services" content={analysis.affected_services} />
          <Section title="Suggested Fix" content={analysis.suggested_fix} />
        </div>
      )}

      {!isLoading && !analysis && <p className="text-sm text-slate-500">No analysis yet.</p>}
    </div>
  );
}

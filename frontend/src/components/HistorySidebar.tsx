import SeverityBadge from "./SeverityBadge";

export interface HistoryItem {
  id: string;
  timestamp: string;
  summary: string;
  severity: "critical" | "warning" | "info";
}

interface HistorySidebarProps {
  items: HistoryItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export default function HistorySidebar({
  items,
  search,
  onSearchChange,
  onSelect,
  selectedId,
}: HistorySidebarProps) {
  return (
    <aside className="flex h-full w-80 flex-col border-r border-slate-200 bg-white">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-slate-900">Past Analyses</h2>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search history..."
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex-1 space-y-2 overflow-auto px-3 pb-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full rounded-lg border p-3 text-left ${
              selectedId === item.id ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
              <SeverityBadge severity={item.severity} />
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-slate-700">{item.summary}</p>
          </button>
        ))}
        {items.length === 0 && <p className="px-2 text-sm text-slate-500">No matching analyses found.</p>}
      </div>
    </aside>
  );
}

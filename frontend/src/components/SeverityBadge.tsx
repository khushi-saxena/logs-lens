type Severity = "critical" | "warning" | "info";

interface SeverityBadgeProps {
  severity: Severity;
}

const styles: Record<Severity, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-semibold capitalize ${styles[severity]}`}>
      {severity}
    </span>
  );
}

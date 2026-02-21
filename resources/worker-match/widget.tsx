import { useWidget, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";
import { useState } from "react";

const workerSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  rating: z.number(),
  completedTasks: z.number(),
  skills: z.array(z.string()),
  location: z.string(),
  hourlyRate: z.number(),
  available: z.boolean(),
  responseTime: z.string(),
  bio: z.string(),
  verified: z.boolean(),
});

const propSchema = z.object({
  workers: z.array(workerSchema),
  taskId: z.string().nullable(),
  taskTitle: z.string().nullable(),
  category: z.string(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Worker matching list with hire buttons",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;
type Worker = z.infer<typeof workerSchema>;

function WorkerCard({ worker, taskId, rank }: { worker: Worker; taskId: string | null; rank: number }) {
  const [hired, setHired] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleHire = () => {
    if (!taskId) return;
    setHired(true);
    // Copy the command to clipboard
    const cmd = `hire_worker with task_id="${taskId}" and worker_id="${worker.id}"`;
    navigator.clipboard?.writeText(cmd).catch(() => {});
  };

  return (
    <div
      style={{
        ...styles.workerCard,
        borderColor: hired ? "#7c3aed" : hovered ? "#c4b5fd" : "#f3f4f6",
        background: hired ? "#faf5ff" : "#fff",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rank badge */}
      {rank <= 3 && (
        <div style={{
          ...styles.rankBadge,
          background: rank === 1 ? "#f59e0b" : rank === 2 ? "#9ca3af" : "#cd7f32",
        }}>
          #{rank}
        </div>
      )}

      <div style={styles.workerTop}>
        {/* Avatar */}
        <div style={styles.avatar}>{worker.avatar}</div>

        {/* Info */}
        <div style={styles.workerInfo}>
          <div style={styles.workerNameRow}>
            <span style={styles.workerName}>{worker.name}</span>
            {worker.verified && <span style={styles.verifiedBadge}>Verified</span>}
          </div>
          <div style={styles.workerLocation}>{worker.location}</div>
        </div>

        {/* Rate */}
        <div style={styles.rateBox}>
          <div style={styles.rateAmount}>${worker.hourlyRate}</div>
          <div style={styles.rateLabel}>/hr</div>
        </div>
      </div>

      {/* Bio */}
      <div style={styles.bio}>{worker.bio}</div>

      {/* Skills */}
      <div style={styles.skillRow}>
        {worker.skills.map((skill) => (
          <span key={skill} style={styles.skillTag}>
            {skill}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <Stat label="Rating" value={`${worker.rating} \u2605`} color="#f59e0b" />
        <Stat label="Tasks Done" value={worker.completedTasks.toLocaleString()} color="#6b7280" />
        <Stat label="Response" value={worker.responseTime} color="#22c55e" />
      </div>

      {/* Expandable details */}
      <div
        style={styles.expandToggle}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Hide details \u25B2" : "Show details \u25BC"}
      </div>

      {expanded && (
        <div style={styles.expandedDetails}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Worker ID</span>
            <span style={styles.detailValue}>{worker.id}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Availability</span>
            <span style={{ ...styles.detailValue, color: worker.available ? "#22c55e" : "#ef4444" }}>
              {worker.available ? "Available now" : "Currently busy"}
            </span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Reliability</span>
            <div style={styles.reliabilityBar}>
              <div style={{ ...styles.reliabilityFill, width: `${Math.min(worker.rating / 5 * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Hire button */}
      {taskId && !hired && (
        <button
          onClick={handleHire}
          style={{
            ...styles.hireButton,
            opacity: hovered ? 1 : 0.9,
            transform: hovered ? "translateY(-1px)" : "none",
          }}
        >
          Hire {worker.name.split(" ")[0]} for this task
        </button>
      )}

      {hired && (
        <div style={styles.hiredConfirm}>
          {"\u2713"} Tell the AI: "Hire {worker.name.split(" ")[0]}" (command copied!)
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={styles.stat}>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const WorkerMatch: React.FC = () => {
  const { props, isPending } = useWidget<Props>();
  const [sortBy, setSortBy] = useState<"rating" | "price" | "tasks">("rating");

  if (isPending) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>
        Finding workers...
      </div>
    );
  }

  const { workers, taskId, taskTitle, category } = props;

  const sorted = [...workers].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "price") return a.hourlyRate - b.hourlyRate;
    return b.completedTasks - a.completedTasks;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerLabel}>Available Workers</div>
          <div style={styles.headerTitle}>
            {taskTitle
              ? `For: ${taskTitle}`
              : category
                ? `Category: ${category}`
                : "All Workers"}
          </div>
        </div>
        <div style={styles.headerCount}>
          <div style={styles.countNum}>{workers.length}</div>
          <div style={styles.countLabel}>matches</div>
        </div>
      </div>

      {/* Sort bar */}
      {workers.length > 1 && (
        <div style={styles.sortBar}>
          <span style={styles.sortLabel}>Sort by:</span>
          {(["rating", "price", "tasks"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                ...styles.sortBtn,
                background: sortBy === key ? "#7c3aed" : "transparent",
                color: sortBy === key ? "#fff" : "#6b7280",
              }}
            >
              {key === "rating" ? "Top Rated" : key === "price" ? "Lowest Price" : "Most Experienced"}
            </button>
          ))}
        </div>
      )}

      {/* Worker list */}
      <div style={styles.list}>
        {sorted.length === 0 ? (
          <div style={styles.empty}>
            No workers available for this category right now. Try broadening your search.
          </div>
        ) : (
          sorted.map((worker, i) => (
            <WorkerCard key={worker.id} worker={worker} taskId={taskId} rank={i + 1} />
          ))
        )}
      </div>

      {/* Footer */}
      {taskId && workers.length > 0 && (
        <div style={styles.footer}>
          Click a "Hire" button above, or tell the AI which worker you want
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { fontFamily: "system-ui, sans-serif", maxWidth: 560, margin: "0 auto" },
  header: {
    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
    borderRadius: "16px 16px 0 0",
    padding: "18px 24px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLabel: { fontSize: 11, opacity: 0.7, textTransform: "uppercase" as const, letterSpacing: 1 },
  headerTitle: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  headerCount: { textAlign: "center" as const },
  countNum: { fontSize: 28, fontWeight: 800 },
  countLabel: { fontSize: 11, opacity: 0.7 },
  sortBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 16px",
    background: "#f9fafb",
    borderLeft: "1px solid #e5e7eb",
    borderRight: "1px solid #e5e7eb",
  },
  sortLabel: { fontSize: 12, color: "#9ca3af", marginRight: 4 },
  sortBtn: {
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "4px 12px",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  list: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderTop: "none",
    borderRadius: "0 0 16px 16px",
    padding: "8px 16px 16px",
  },
  empty: { padding: 32, textAlign: "center" as const, color: "#9ca3af", fontSize: 14 },
  workerCard: {
    border: "2px solid #f3f4f6",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    transition: "all 0.2s",
    position: "relative" as const,
  },
  rankBadge: {
    position: "absolute" as const,
    top: -8,
    left: 12,
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    padding: "2px 8px",
    borderRadius: 999,
  },
  workerTop: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  workerInfo: { flex: 1 },
  workerNameRow: { display: "flex", alignItems: "center", gap: 8 },
  workerName: { fontSize: 16, fontWeight: 700, color: "#111827" },
  verifiedBadge: {
    background: "#dbeafe",
    color: "#2563eb",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 999,
  },
  workerLocation: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  rateBox: { textAlign: "right" as const },
  rateAmount: { fontSize: 22, fontWeight: 800, color: "#111827" },
  rateLabel: { fontSize: 11, color: "#9ca3af" },
  bio: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 1.5,
    marginTop: 10,
    paddingBottom: 10,
    borderBottom: "1px solid #f3f4f6",
  },
  skillRow: { display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 10 },
  skillTag: {
    background: "#f0fdf4",
    color: "#16a34a",
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 999,
  },
  statsRow: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: 12,
    padding: "10px 0 0",
    borderTop: "1px solid #f3f4f6",
  },
  stat: { textAlign: "center" as const },
  statValue: { fontSize: 14, fontWeight: 700 },
  statLabel: { fontSize: 10, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  expandToggle: {
    textAlign: "center" as const,
    fontSize: 12,
    color: "#7c3aed",
    cursor: "pointer",
    padding: "8px 0 4px",
    fontWeight: 500,
  },
  expandedDetails: {
    background: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    padding: "4px 0",
  },
  detailLabel: { color: "#9ca3af" },
  detailValue: { color: "#111827", fontWeight: 600 },
  reliabilityBar: {
    width: 80,
    height: 6,
    background: "#e5e7eb",
    borderRadius: 999,
    overflow: "hidden",
  },
  reliabilityFill: {
    height: "100%",
    background: "linear-gradient(90deg, #22c55e, #16a34a)",
    borderRadius: 999,
  },
  hireButton: {
    marginTop: 12,
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "#fff",
    textAlign: "center" as const,
    padding: "12px 0",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    border: "none",
    width: "100%",
    transition: "all 0.15s",
    boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
  },
  hiredConfirm: {
    marginTop: 12,
    background: "#f0fdf4",
    border: "2px solid #22c55e",
    color: "#16a34a",
    textAlign: "center" as const,
    padding: "12px 0",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
  },
  footer: {
    background: "#faf5ff",
    border: "1px solid #ede9fe",
    borderTop: "none",
    borderRadius: "0 0 16px 16px",
    padding: "10px 16px",
    fontSize: 12,
    color: "#7c3aed",
    textAlign: "center" as const,
  },
};

export default WorkerMatch;

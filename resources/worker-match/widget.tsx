import { useWidget, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

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

function WorkerCard({ worker, taskId }: { worker: Worker; taskId: string | null }) {
  return (
    <div style={styles.workerCard}>
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
        <Stat label="Rating" value={`${worker.rating} ★`} color="#f59e0b" />
        <Stat label="Tasks" value={String(worker.completedTasks)} color="#6b7280" />
        <Stat label="Response" value={worker.responseTime} color="#6b7280" />
      </div>

      {/* Hire button */}
      {taskId && (
        <div style={styles.hireButton}>
          Hire {worker.name.split(" ")[0]} — hire_worker({taskId}, {worker.id})
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

  if (isPending) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>
        Finding workers...
      </div>
    );
  }

  const { workers, taskId, taskTitle, category } = props;

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

      {/* Worker list */}
      <div style={styles.list}>
        {workers.length === 0 ? (
          <div style={styles.empty}>
            No workers available for this category right now. Try broadening your search.
          </div>
        ) : (
          workers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} taskId={taskId} />
          ))
        )}
      </div>

      {/* Footer */}
      {taskId && workers.length > 0 && (
        <div style={styles.footer}>
          Use <code style={styles.code}>hire_worker</code> with{" "}
          <code style={styles.code}>task_id="{taskId}"</code> and a{" "}
          <code style={styles.code}>worker_id</code> to hire
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
  list: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderTop: "none",
    borderRadius: "0 0 16px 16px",
    padding: "8px 16px 16px",
  },
  empty: { padding: 32, textAlign: "center" as const, color: "#9ca3af", fontSize: 14 },
  workerCard: {
    border: "1px solid #f3f4f6",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    transition: "border-color 0.2s",
  },
  workerTop: { display: "flex", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  workerInfo: { flex: 1 },
  workerNameRow: { display: "flex", alignItems: "center", gap: 8 },
  workerName: { fontSize: 15, fontWeight: 700, color: "#111827" },
  verifiedBadge: {
    background: "#dbeafe",
    color: "#2563eb",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 6px",
    borderRadius: 999,
  },
  workerLocation: { fontSize: 12, color: "#9ca3af" },
  rateBox: { textAlign: "right" as const },
  rateAmount: { fontSize: 20, fontWeight: 800, color: "#111827" },
  rateLabel: { fontSize: 11, color: "#9ca3af" },
  bio: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 1.4,
    marginTop: 10,
    paddingBottom: 10,
    borderBottom: "1px solid #f3f4f6",
  },
  skillRow: { display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 10 },
  skillTag: {
    background: "#f3f4f6",
    color: "#374151",
    fontSize: 11,
    fontWeight: 500,
    padding: "3px 8px",
    borderRadius: 6,
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
  statLabel: { fontSize: 10, color: "#9ca3af", textTransform: "uppercase" as const },
  hireButton: {
    marginTop: 12,
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "#fff",
    textAlign: "center" as const,
    padding: "10px 0",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
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
  code: {
    background: "#ede9fe",
    padding: "1px 5px",
    borderRadius: 4,
    fontFamily: "monospace",
    fontSize: 11,
  },
};

export default WorkerMatch;

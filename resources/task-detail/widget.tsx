import { useWidget, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  task: z.object({
    id: z.string(),
    title: z.string(),
    category: z.string(),
    location: z.string(),
    instructions: z.string(),
    budget: z.number(),
    deadline: z.string(),
    status: z.string(),
    createdAt: z.string(),
    workerId: z.string().nullable(),
    workerName: z.string().nullable(),
    proof: z
      .object({
        type: z.string(),
        url: z.string(),
        notes: z.string(),
      })
      .nullable(),
    timeline: z.array(
      z.object({
        time: z.string(),
        event: z.string(),
        actor: z.string(),
      })
    ),
    pointsEscrowed: z.number(),
    pointsPaid: z.number(),
  }),
  worker: z
    .object({
      id: z.string(),
      name: z.string(),
      avatar: z.string(),
      rating: z.number(),
      completedTasks: z.number(),
      skills: z.array(z.string()),
      hourlyRate: z.number(),
      responseTime: z.string(),
      verified: z.boolean(),
    })
    .nullable(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Task detail with status, proof viewer, and timeline",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; progress: number }> = {
  open: { label: "Open", color: "#f59e0b", bg: "#fffbeb", progress: 10 },
  matching: { label: "Matching", color: "#f59e0b", bg: "#fffbeb", progress: 20 },
  hired: { label: "Worker Hired", color: "#3b82f6", bg: "#eff6ff", progress: 35 },
  in_progress: { label: "In Progress", color: "#8b5cf6", bg: "#faf5ff", progress: 55 },
  proof_submitted: { label: "Proof Submitted", color: "#f97316", bg: "#fff7ed", progress: 75 },
  approved: { label: "Approved", color: "#22c55e", bg: "#f0fdf4", progress: 90 },
  completed: { label: "Completed", color: "#059669", bg: "#ecfdf5", progress: 100 },
  disputed: { label: "Disputed", color: "#ef4444", bg: "#fef2f2", progress: 75 },
};

const PROGRESS_STEPS = ["Open", "Hired", "Working", "Proof", "Done"];

const TaskDetail: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>
        Loading task...
      </div>
    );
  }

  const { task, worker } = props;
  const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.open;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div
        style={{
          ...styles.header,
          background:
            task.status === "completed"
              ? "linear-gradient(135deg, #059669, #047857)"
              : task.status === "disputed"
                ? "linear-gradient(135deg, #ef4444, #dc2626)"
                : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
        }}
      >
        <div style={styles.headerTop}>
          <div>
            <div style={styles.headerLabel}>Task Detail</div>
            <div style={styles.headerId}>{task.id}</div>
          </div>
          <div style={styles.statusPill}>{status.label}</div>
        </div>
        <div style={styles.headerTitle}>{task.title}</div>

        {/* Progress bar */}
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${status.progress}%` }} />
        </div>
        <div style={styles.progressLabels}>
          {PROGRESS_STEPS.map((step, i) => (
            <span
              key={step}
              style={{
                fontSize: 10,
                opacity: (i + 1) / PROGRESS_STEPS.length <= status.progress / 100 ? 1 : 0.5,
                fontWeight: (i + 1) / PROGRESS_STEPS.length <= status.progress / 100 ? 600 : 400,
              }}
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Worker section */}
        {worker && (
          <div style={styles.workerSection}>
            <div style={styles.workerAvatar}>{worker.avatar}</div>
            <div style={styles.workerInfo}>
              <div style={styles.workerNameRow}>
                <span style={styles.workerName}>{worker.name}</span>
                {worker.verified && <span style={styles.verifiedBadge}>Verified</span>}
              </div>
              <div style={styles.workerStats}>
                {worker.rating} ★ &middot; {worker.completedTasks} tasks &middot; {worker.responseTime}
              </div>
            </div>
            <div style={styles.workerRate}>${worker.hourlyRate}/hr</div>
          </div>
        )}

        {!worker && !task.workerId && (
          <div style={styles.noWorker}>
            No worker assigned yet. Use <code style={styles.code}>list_workers</code> to find matches.
          </div>
        )}

        {/* Task info */}
        <div style={styles.infoGrid}>
          <InfoRow label="Category" value={task.category} />
          <InfoRow label="Location" value={task.location} />
          <InfoRow label="Deadline" value={task.deadline} />
          <InfoRow label="Instructions" value={task.instructions} full />
        </div>

        {/* Budget / Payment */}
        <div style={styles.budgetBar}>
          <div style={styles.budgetItem}>
            <div style={styles.budgetLabel}>Budget</div>
            <div style={styles.budgetValue}>{task.budget} pts</div>
          </div>
          <div style={styles.budgetDivider} />
          <div style={styles.budgetItem}>
            <div style={styles.budgetLabel}>Escrowed</div>
            <div style={{ ...styles.budgetValue, color: "#7c3aed" }}>{task.pointsEscrowed} pts</div>
          </div>
          <div style={styles.budgetDivider} />
          <div style={styles.budgetItem}>
            <div style={styles.budgetLabel}>Paid</div>
            <div style={{ ...styles.budgetValue, color: "#059669" }}>{task.pointsPaid} pts</div>
          </div>
        </div>

        {/* Proof section */}
        {task.proof && (
          <div style={styles.proofSection}>
            <div style={styles.sectionTitle}>Submitted Proof</div>
            <div style={styles.proofCard}>
              <div style={styles.proofUrlRow}>
                <span style={styles.proofIcon}>P</span>
                <a
                  href={task.proof.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.proofLink}
                >
                  {task.proof.url}
                </a>
              </div>
              {task.proof.notes && (
                <div style={styles.proofNotes}>
                  <strong>Worker notes:</strong> {task.proof.notes}
                </div>
              )}
              {task.status === "proof_submitted" && (
                <div style={styles.reviewActions}>
                  <div style={styles.approveBtn}>
                    Approve &rarr; review_and_pay({task.id}, approve=true)
                  </div>
                  <div style={styles.rejectBtn}>
                    Request Changes &rarr; review_and_pay({task.id}, approve=false)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={styles.timelineSection}>
          <div style={styles.sectionTitle}>Activity Timeline</div>
          <div style={styles.timeline}>
            {task.timeline.map((entry, i) => {
              const isLatest = i === task.timeline.length - 1;
              const actorColor =
                entry.actor === "System"
                  ? "#9ca3af"
                  : entry.actor === "AI Agent"
                    ? "#7c3aed"
                    : "#3b82f6";
              return (
                <div key={i} style={styles.timelineEntry}>
                  {/* Connector line */}
                  {i < task.timeline.length - 1 && <div style={styles.timelineLine} />}
                  {/* Dot */}
                  <div
                    style={{
                      ...styles.timelineDot,
                      background: isLatest ? status.color : "#d1d5db",
                      boxShadow: isLatest ? `0 0 0 3px ${status.bg}` : "none",
                    }}
                  />
                  <div style={styles.timelineContent}>
                    <div style={{ fontSize: 13, color: isLatest ? "#111827" : "#6b7280", fontWeight: isLatest ? 600 : 400 }}>
                      {entry.event}
                    </div>
                    <div style={styles.timelineMeta}>
                      <span style={{ color: actorColor, fontWeight: 500 }}>{entry.actor}</span>
                      {" · "}
                      {new Date(entry.time).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next action hint */}
        {task.status !== "completed" && (
          <div style={styles.nextAction}>
            <strong>Next:</strong>{" "}
            {task.status === "open" && "Use list_workers to find and hire a worker."}
            {task.status === "hired" && "Waiting for worker to begin. Check back with get_task_status."}
            {task.status === "in_progress" && "Worker is on it. They'll submit proof when done."}
            {task.status === "proof_submitted" && "Review the proof above and use review_and_pay to approve or reject."}
            {task.status === "disputed" && "Reach out to the worker to resolve the issue."}
          </div>
        )}
      </div>
    </div>
  );
};

function InfoRow({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div style={{ ...(full ? styles.infoFull : styles.infoRow) }}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { fontFamily: "system-ui, sans-serif", maxWidth: 540, margin: "0 auto" },
  header: { borderRadius: "16px 16px 0 0", padding: "18px 24px 14px", color: "#fff" },
  headerTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  headerLabel: { fontSize: 11, opacity: 0.7, textTransform: "uppercase" as const, letterSpacing: 1 },
  headerId: { fontSize: 13, opacity: 0.85, fontWeight: 600 },
  statusPill: {
    background: "rgba(255,255,255,0.25)",
    padding: "4px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  headerTitle: { fontSize: 18, fontWeight: 800, marginTop: 8 },
  progressTrack: {
    marginTop: 14,
    background: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    height: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#fff",
    borderRadius: 999,
    transition: "width 0.5s ease",
  },
  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 4,
    color: "#fff",
  },
  body: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderTop: "none",
    borderRadius: "0 0 16px 16px",
    padding: 24,
  },
  workerSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 14,
    background: "#f9fafb",
    borderRadius: 12,
    marginBottom: 18,
  },
  workerAvatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  workerInfo: { flex: 1 },
  workerNameRow: { display: "flex", alignItems: "center", gap: 6 },
  workerName: { fontSize: 14, fontWeight: 700, color: "#111827" },
  verifiedBadge: {
    background: "#dbeafe",
    color: "#2563eb",
    fontSize: 10,
    fontWeight: 600,
    padding: "1px 5px",
    borderRadius: 999,
  },
  workerStats: { fontSize: 12, color: "#6b7280" },
  workerRate: { fontSize: 16, fontWeight: 700, color: "#111827" },
  noWorker: {
    padding: 14,
    background: "#fffbeb",
    border: "1px solid #fef3c7",
    borderRadius: 10,
    fontSize: 13,
    color: "#92400e",
    marginBottom: 18,
  },
  code: { background: "#fef3c7", padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontSize: 11 },
  infoGrid: { display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 16 },
  infoRow: { display: "flex", fontSize: 13 },
  infoFull: { fontSize: 13 },
  infoLabel: { color: "#9ca3af", fontWeight: 500, minWidth: 90 },
  infoValue: { color: "#111827", lineHeight: 1.4 },
  budgetBar: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    background: "#faf5ff",
    border: "1px solid #ede9fe",
    borderRadius: 12,
    padding: "12px 0",
    marginBottom: 18,
  },
  budgetItem: { textAlign: "center" as const },
  budgetLabel: { fontSize: 10, color: "#9ca3af", textTransform: "uppercase" as const },
  budgetValue: { fontSize: 18, fontWeight: 800, color: "#111827" },
  budgetDivider: { width: 1, height: 32, background: "#ede9fe" },
  proofSection: { marginBottom: 18 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 },
  proofCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#fafafa",
  },
  proofUrlRow: { display: "flex", alignItems: "center", gap: 10 },
  proofIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "#3b82f6",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  proofLink: { color: "#3b82f6", fontSize: 13, wordBreak: "break-all" as const },
  proofNotes: {
    marginTop: 10,
    fontSize: 13,
    color: "#374151",
    background: "#fff",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #f3f4f6",
  },
  reviewActions: { display: "flex", gap: 8, marginTop: 12 },
  approveBtn: {
    flex: 1,
    background: "linear-gradient(135deg, #059669, #047857)",
    color: "#fff",
    textAlign: "center" as const,
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  rejectBtn: {
    flex: 1,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#6b7280",
    textAlign: "center" as const,
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },
  timelineSection: {},
  timeline: { position: "relative" as const, paddingLeft: 24 },
  timelineEntry: { position: "relative" as const, paddingBottom: 16 },
  timelineLine: {
    position: "absolute" as const,
    left: -18,
    top: 16,
    bottom: 0,
    width: 2,
    background: "#e5e7eb",
  },
  timelineDot: {
    position: "absolute" as const,
    left: -22,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  timelineContent: {},
  timelineMeta: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  nextAction: {
    marginTop: 16,
    padding: 12,
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    borderRadius: 10,
    fontSize: 13,
    color: "#1e40af",
  },
};

export default TaskDetail;

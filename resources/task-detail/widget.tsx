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
    proof: z.object({ type: z.string(), url: z.string(), notes: z.string() }).nullable(),
    timeline: z.array(z.object({ time: z.string(), event: z.string(), actor: z.string() })),
    pointsEscrowed: z.number(),
    pointsPaid: z.number(),
  }),
  worker: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string(),
    rating: z.number(),
    completedTasks: z.number(),
    skills: z.array(z.string()),
    hourlyRate: z.number(),
    responseTime: z.string(),
    verified: z.boolean(),
  }).nullable(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Task detail view",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;

function parseInstructions(raw: string): string[] {
  return raw
    .split(/[\n•\-\d+\.]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const STATUS_CONFIG: Record<string, { label: string; step: number }> = {
  open: { label: "Open", step: 1 },
  matching: { label: "Matching", step: 1 },
  hired: { label: "Hired", step: 2 },
  in_progress: { label: "In Progress", step: 3 },
  proof_submitted: { label: "Review", step: 4 },
  approved: { label: "Approved", step: 4 },
  completed: { label: "Completed", step: 5 },
  disputed: { label: "Disputed", step: 4 },
};

const STEPS = ["Created", "Hired", "Working", "Review", "Done"];

const TaskDetail: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Loading task</span>
      </div>
    );
  }

  const { task, worker } = props;
  const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.open;
  const isCompleted = task.status === "completed";
  const isDisputed = task.status === "disputed";

  return (
    <div style={styles.container}>
      {/* Status pill */}
      <div style={styles.statusRow}>
        <div style={{
          ...styles.statusPill,
          background: isCompleted ? "#E8F5E9" : isDisputed ? "#FFEBEE" : "#F5F5F5",
          color: isCompleted ? "#1B5E20" : isDisputed ? "#B71C1C" : "#000",
        }}>
          {status.label}
        </div>
        <span style={styles.taskIdSmall}>{task.id}</span>
      </div>

      {/* Title */}
      <h1 style={styles.title}>{task.title}</h1>

      {/* Progress steps */}
      <div style={styles.progressContainer}>
        {STEPS.map((step, i) => {
          const isActive = i + 1 <= status.step;
          const isCurrent = i + 1 === status.step;
          return (
            <div key={step} style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                background: isActive ? "#000" : "#E0E0E0",
                transform: isCurrent ? "scale(1.3)" : "scale(1)",
              }} />
              <span style={{
                ...styles.stepLabel,
                color: isActive ? "#000" : "#9E9E9E",
                fontWeight: isCurrent ? 600 : 400,
              }}>{step}</span>
              {i < STEPS.length - 1 && (
                <div style={{
                  ...styles.stepLine,
                  background: i + 1 < status.step ? "#000" : "#E0E0E0",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Main card */}
      <div style={styles.card}>
        {/* Worker section */}
        {worker && (
          <>
            <div style={styles.workerSection}>
              <div style={styles.avatar}>{worker.avatar}</div>
              <div style={styles.workerInfo}>
                <div style={styles.workerNameRow}>
                  <span style={styles.workerName}>{worker.name}</span>
                  {worker.verified && <span style={styles.verifiedBadge}>✓</span>}
                </div>
                <span style={styles.workerMeta}>
                  {worker.rating.toFixed(1)} ★ · {worker.completedTasks} tasks · {worker.responseTime}
                </span>
              </div>
              <div style={styles.workerRate}>
                <span style={styles.rateAmount}>${worker.hourlyRate}</span>
                <span style={styles.rateUnit}>/hr</span>
              </div>
            </div>
            <div style={styles.divider} />
          </>
        )}

        {!worker && !task.workerId && (
          <>
            <div style={styles.noWorkerBanner}>
              <span style={styles.noWorkerText}>No worker assigned</span>
              <span style={styles.noWorkerHint}>Use list_workers to find matches</span>
            </div>
            <div style={styles.divider} />
          </>
        )}

        {/* Task details */}
        <div style={styles.detailsGrid}>
          <DetailItem label="Category" value={task.category} />
          <DetailItem label="Location" value={task.location} />
          <DetailItem label="Deadline" value={task.deadline} />
        </div>

        <div style={styles.instructionsSection}>
          <label style={styles.label}>Instructions</label>
          <div style={styles.instructionsList}>
            {parseInstructions(task.instructions).map((step, i) => (
              <div key={i} style={styles.instructionItem}>
                <div style={styles.stepNumber}>{i + 1}</div>
                <span style={styles.stepText}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.divider} />

        {/* Budget bar */}
        <div style={styles.budgetGrid}>
          <BudgetItem label="Budget" value={task.budget} />
          <BudgetItem label="Escrowed" value={task.pointsEscrowed} />
          <BudgetItem label="Paid" value={task.pointsPaid} highlight />
        </div>
      </div>

      {/* Proof section */}
      {task.proof && (
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Proof submitted</h2>

          <a href={task.proof.url} target="_blank" rel="noopener noreferrer" style={styles.proofLink}>
            <span style={styles.proofIcon}>📎</span>
            <span style={styles.proofUrl}>{task.proof.url}</span>
            <span style={styles.proofArrow}>↗</span>
          </a>

          {task.proof.notes && (
            <div style={styles.proofNotes}>
              <label style={styles.label}>Worker notes</label>
              <p style={styles.notesText}>{task.proof.notes}</p>
            </div>
          )}

          {task.status === "proof_submitted" && (
            <div style={styles.actionButtons}>
              <button style={styles.approveButton}>
                Approve & Pay
              </button>
              <button style={styles.rejectButton}>
                Request Changes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Activity</h2>

        <div style={styles.timeline}>
          {task.timeline.map((entry, i) => {
            const isLatest = i === task.timeline.length - 1;
            return (
              <div key={i} style={styles.timelineItem}>
                <div style={styles.timelineLeft}>
                  <div style={{
                    ...styles.timelineDot,
                    background: isLatest ? "#000" : "#E0E0E0",
                  }} />
                  {i < task.timeline.length - 1 && <div style={styles.timelineConnector} />}
                </div>
                <div style={styles.timelineContent}>
                  <span style={{
                    ...styles.timelineEvent,
                    fontWeight: isLatest ? 600 : 400,
                    color: isLatest ? "#000" : "#6B6B6B",
                  }}>{entry.event}</span>
                  <span style={styles.timelineMeta}>
                    {entry.actor} · {new Date(entry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next action hint */}
      {task.status !== "completed" && (
        <div style={styles.hintCard}>
          <span style={styles.hintLabel}>Next step</span>
          <span style={styles.hintText}>
            {task.status === "open" && "Use list_workers to find and hire a worker"}
            {task.status === "hired" && "Waiting for worker to begin"}
            {task.status === "in_progress" && "Worker is completing the task"}
            {task.status === "proof_submitted" && "Review proof and approve or request changes"}
            {task.status === "disputed" && "Resolve the dispute with the worker"}
          </span>
        </div>
      )}
    </div>
  );
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

function BudgetItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div style={styles.budgetItem}>
      <span style={styles.budgetLabel}>{label}</span>
      <span style={{
        ...styles.budgetValue,
        color: highlight && value > 0 ? "#1B5E20" : "#000",
      }}>{value} pts</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 520,
    margin: "0 auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 80,
    gap: 16,
  },
  spinner: {
    width: 24,
    height: 24,
    border: "2px solid #E5E5E5",
    borderTopColor: "#000",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    fontSize: 15,
    color: "#6B6B6B",
    letterSpacing: "-0.01em",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  statusPill: {
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: 20,
    letterSpacing: "-0.01em",
  },
  taskIdSmall: {
    fontSize: 13,
    color: "#9E9E9E",
    fontFamily: "monospace",
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: "#000",
    margin: 0,
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    padding: "24px 0",
    gap: 0,
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    flex: 1,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    transition: "all 0.2s ease",
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    transition: "all 0.2s ease",
  },
  stepLine: {
    position: "absolute",
    top: 4,
    left: "50%",
    width: "100%",
    height: 2,
    transition: "all 0.2s ease",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.03)",
  },
  workerSection: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "#F5F5F5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
  },
  workerInfo: {
    flex: 1,
  },
  workerNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 600,
    color: "#000",
    letterSpacing: "-0.02em",
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#000",
    color: "#fff",
    fontSize: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  workerMeta: {
    fontSize: 14,
    color: "#6B6B6B",
    marginTop: 2,
  },
  workerRate: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
  },
  rateAmount: {
    fontSize: 24,
    fontWeight: 700,
    color: "#000",
    letterSpacing: "-0.02em",
  },
  rateUnit: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  noWorkerBanner: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "16px 20px",
    background: "#FAFAFA",
    borderRadius: 12,
  },
  noWorkerText: {
    fontSize: 15,
    fontWeight: 500,
    color: "#000",
  },
  noWorkerHint: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  divider: {
    height: 1,
    background: "#F0F0F0",
    margin: "24px 0",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 20,
    marginBottom: 24,
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: "#9E9E9E",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: 500,
    color: "#000",
    letterSpacing: "-0.01em",
  },
  instructionsSection: {
    marginBottom: 0,
  },
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 500,
    color: "#9E9E9E",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 8,
  },
  instructionsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  instructionItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "#000",
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepText: {
    fontSize: 15,
    color: "#000",
    lineHeight: 1.6,
    paddingTop: 3,
  },
  budgetGrid: {
    display: "flex",
    justifyContent: "space-between",
  },
  budgetItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: "#9E9E9E",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  budgetValue: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#000",
    margin: "0 0 20px 0",
    letterSpacing: "-0.02em",
  },
  proofLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 20px",
    background: "#FAFAFA",
    borderRadius: 12,
    textDecoration: "none",
    transition: "background 0.15s ease",
  },
  proofIcon: {
    fontSize: 18,
  },
  proofUrl: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  proofArrow: {
    fontSize: 16,
    color: "#6B6B6B",
  },
  proofNotes: {
    marginTop: 20,
  },
  notesText: {
    fontSize: 15,
    color: "#000",
    lineHeight: 1.6,
    margin: 0,
  },
  actionButtons: {
    display: "flex",
    gap: 12,
    marginTop: 24,
  },
  approveButton: {
    flex: 1,
    padding: "16px 24px",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.1s ease, box-shadow 0.1s ease",
  },
  rejectButton: {
    flex: 1,
    padding: "16px 24px",
    background: "#fff",
    color: "#000",
    border: "1px solid #E0E0E0",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "border-color 0.1s ease",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
  },
  timelineItem: {
    display: "flex",
    gap: 16,
    minHeight: 48,
  },
  timelineLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    flexShrink: 0,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    background: "#E0E0E0",
    marginTop: 4,
    marginBottom: 4,
  },
  timelineContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    paddingBottom: 16,
  },
  timelineEvent: {
    fontSize: 15,
    letterSpacing: "-0.01em",
  },
  timelineMeta: {
    fontSize: 13,
    color: "#9E9E9E",
  },
  hintCard: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "20px 24px",
    background: "#F5F5F5",
    borderRadius: 12,
  },
  hintLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  hintText: {
    fontSize: 15,
    color: "#000",
    letterSpacing: "-0.01em",
  },
};

export default TaskDetail;

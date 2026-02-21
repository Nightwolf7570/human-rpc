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
  description: "Task detail with status, proof viewer, and timeline",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;

const STATUS: Record<string, { label: string; color: string; bg: string; pct: number }> = {
  open: { label: "Open", color: "#f59e0b", bg: "#fffbeb", pct: 10 },
  matching: { label: "Matching", color: "#f59e0b", bg: "#fffbeb", pct: 20 },
  hired: { label: "Hired", color: "#3b82f6", bg: "#eff6ff", pct: 35 },
  in_progress: { label: "In Progress", color: "#7c3aed", bg: "#f5f3ff", pct: 55 },
  proof_submitted: { label: "Proof Submitted", color: "#f97316", bg: "#fff7ed", pct: 75 },
  approved: { label: "Approved", color: "#059669", bg: "#ecfdf5", pct: 90 },
  completed: { label: "Completed", color: "#059669", bg: "#ecfdf5", pct: 100 },
  disputed: { label: "Disputed", color: "#ef4444", bg: "#fef2f2", pct: 75 },
};

const STEPS = [
  { key: "open", label: "Created" },
  { key: "hired", label: "Hired" },
  { key: "in_progress", label: "Working" },
  { key: "proof_submitted", label: "Proof" },
  { key: "completed", label: "Done" },
];

const TaskDetail: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>Loading task...</div>;
  }

  const { task, worker } = props;
  const st = STATUS[task.status] ?? STATUS.open;

  // Figure out which step index we're at
  const stepKeys = STEPS.map((s) => s.key);
  const currentIdx = stepKeys.indexOf(task.status);
  const activeStep = currentIdx >= 0 ? currentIdx : task.status === "matching" ? 0 : task.status === "approved" ? 4 : 2;

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      maxWidth: 500,
      margin: "0 auto",
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.07)",
      overflow: "hidden",
    }}>
      {/* Accent bar colored by status */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${st.color}, ${st.color}88)` }} />

      <div style={{ padding: "20px 24px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#9ca3af" }}>{task.id}</div>
          <span style={{
            background: st.bg,
            color: st.color,
            fontSize: 12,
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: 999,
          }}>
            {st.label}
          </span>
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1.3, marginBottom: 16 }}>
          {task.title}
        </div>

        {/* Progress steps */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 0 }}>
          {STEPS.map((step, i) => {
            const done = i <= activeStep;
            const isCurrent = i === activeStep;
            return (
              <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
                  <div style={{
                    width: isCurrent ? 28 : 22,
                    height: isCurrent ? 28 : 22,
                    borderRadius: "50%",
                    background: done ? st.color : "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s",
                    boxShadow: isCurrent ? `0 0 0 4px ${st.bg}` : "none",
                  }}>
                    {done && (
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                        <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: isCurrent ? 700 : 500,
                    color: done ? st.color : "#9ca3af",
                    marginTop: 4,
                    whiteSpace: "nowrap" as const,
                  }}>
                    {step.label}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: 2,
                    background: i < activeStep ? st.color : "#e5e7eb",
                    margin: "0 4px",
                    marginBottom: 18,
                    borderRadius: 999,
                    transition: "background 0.3s",
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Info pills */}
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 16 }}>
          <Pill label={task.category} />
          <Pill label={task.location} />
          <Pill label={task.deadline} />
        </div>

        {/* Worker card */}
        {worker && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 14,
            background: "#f9fafb",
            borderRadius: 12,
            marginBottom: 16,
            border: "1px solid #f3f4f6",
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 15,
            }}>
              {worker.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{worker.name}</span>
                {worker.verified && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#2563eb">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                )}
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                {worker.rating} \u2605 &middot; {worker.completedTasks} tasks &middot; {worker.responseTime}
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>${worker.hourlyRate}/hr</div>
          </div>
        )}

        {/* Budget bar */}
        <div style={{
          display: "flex",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #f3f4f6",
          marginBottom: 16,
        }}>
          <BudgetCell label="Budget" value={`${task.budget} pts`} color="#111827" />
          <BudgetCell label="Escrowed" value={`${task.pointsEscrowed} pts`} color="#7c3aed" />
          <BudgetCell label="Paid" value={`${task.pointsPaid} pts`} color="#059669" />
        </div>

        {/* Proof section */}
        {task.proof && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 8 }}>
              Submitted Proof
            </div>
            <div style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                background: "#f9fafb",
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#3b82f6",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7z" stroke="#fff" strokeWidth="2"/>
                    <path d="M13 2v7h7" stroke="#fff" strokeWidth="2"/>
                  </svg>
                </div>
                <a href={task.proof.url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: "#3b82f6", fontWeight: 500, textDecoration: "none", wordBreak: "break-all" as const, flex: 1 }}>
                  {task.proof.url}
                </a>
              </div>
              {task.proof.notes && (
                <div style={{ padding: "10px 14px", fontSize: 13, color: "#374151", borderTop: "1px solid #f3f4f6" }}>
                  {task.proof.notes}
                </div>
              )}
              {task.status === "proof_submitted" && (
                <div style={{
                  display: "flex",
                  gap: 8,
                  padding: "10px 14px",
                  borderTop: "1px solid #f3f4f6",
                  background: "#fffbeb",
                }}>
                  <div style={{
                    flex: 1,
                    textAlign: "center" as const,
                    padding: "8px 0",
                    background: "#059669",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}>
                    Approve & Pay
                  </div>
                  <div style={{
                    flex: 1,
                    textAlign: "center" as const,
                    padding: "8px 0",
                    background: "#fff",
                    color: "#6b7280",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                  }}>
                    Request Changes
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 10 }}>
            Activity
          </div>
          <div style={{ paddingLeft: 16, position: "relative" as const }}>
            {/* Vertical line */}
            <div style={{
              position: "absolute" as const,
              left: 4,
              top: 8,
              bottom: 8,
              width: 2,
              background: "#f3f4f6",
            }} />

            {[...task.timeline].reverse().map((entry, i) => {
              const isFirst = i === 0;
              const actorColor =
                entry.actor === "System" ? "#9ca3af" :
                entry.actor === "AI Agent" ? "#7c3aed" : "#3b82f6";
              return (
                <div key={i} style={{
                  position: "relative" as const,
                  paddingLeft: 18,
                  paddingBottom: i < task.timeline.length - 1 ? 14 : 0,
                }}>
                  <div style={{
                    position: "absolute" as const,
                    left: -1,
                    top: 5,
                    width: isFirst ? 12 : 8,
                    height: isFirst ? 12 : 8,
                    borderRadius: "50%",
                    background: isFirst ? st.color : "#d1d5db",
                    border: isFirst ? `3px solid ${st.bg}` : "none",
                  }} />
                  <div style={{ fontSize: 13, color: isFirst ? "#111827" : "#6b7280", fontWeight: isFirst ? 600 : 400 }}>
                    {entry.event}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                    <span style={{ color: actorColor, fontWeight: 500 }}>{entry.actor}</span>
                    {" \u00B7 "}
                    {new Date(entry.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next action hint */}
        {task.status !== "completed" && (
          <div style={{
            marginTop: 16,
            padding: "10px 14px",
            background: "#eff6ff",
            border: "1px solid #dbeafe",
            borderRadius: 10,
            fontSize: 13,
            color: "#1e40af",
          }}>
            <strong>Next:</strong>{" "}
            {task.status === "open" && "Find and hire a worker with list_workers"}
            {task.status === "hired" && "Worker notified — waiting for them to start"}
            {task.status === "in_progress" && "Worker is on it — they'll submit proof when done"}
            {task.status === "proof_submitted" && "Review the proof and use review_and_pay to approve or request changes"}
            {task.status === "matching" && "Matching you with workers..."}
            {task.status === "disputed" && "Resolve the dispute with the worker"}
          </div>
        )}
      </div>
    </div>
  );
};

function Pill({ label }: { label: string }) {
  return (
    <span style={{
      background: "#f3f4f6",
      color: "#6b7280",
      fontSize: 12,
      fontWeight: 500,
      padding: "4px 10px",
      borderRadius: 999,
    }}>
      {label}
    </span>
  );
}

function BudgetCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" as const, padding: "12px 8px", background: "#f9fafb" }}>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" as const }}>{label}</div>
    </div>
  );
}

export default TaskDetail;

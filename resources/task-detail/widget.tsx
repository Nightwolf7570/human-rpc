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

const STATUS_MAP: Record<string, { label: string; step: number }> = {
  open: { label: "Open", step: 0 },
  matching: { label: "Matching", step: 0 },
  hired: { label: "Hired", step: 1 },
  in_progress: { label: "In Progress", step: 2 },
  proof_submitted: { label: "Review", step: 3 },
  approved: { label: "Done", step: 4 },
  completed: { label: "Done", step: 4 },
  disputed: { label: "Disputed", step: 3 },
};

const STEPS = ["Created", "Hired", "Working", "Review", "Done"];

const TaskDetail: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return <div style={{ padding: 48, textAlign: "center", color: "#aaa", fontFamily: f }}>Loading...</div>;
  }

  const { task, worker } = props;
  const st = STATUS_MAP[task.status] ?? { label: task.status, step: 0 };

  return (
    <div style={{
      fontFamily: f,
      maxWidth: 480,
      margin: "0 auto",
      background: "#fff",
      borderRadius: 12,
      border: "1px solid #e8e8e8",
      padding: "24px 28px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#bbb", fontFamily: "monospace" }}>{task.id}</span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: task.status === "completed" ? "#22c55e" : task.status === "disputed" ? "#ef4444" : "#111",
          background: task.status === "completed" ? "#f0fdf4" : task.status === "disputed" ? "#fef2f2" : "#f5f5f5",
          padding: "3px 10px",
          borderRadius: 4,
        }}>
          {st.label}
        </span>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: -0.3, lineHeight: 1.3, marginBottom: 20 }}>
        {task.title}
      </div>

      {/* Progress */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24, gap: 0 }}>
        {STEPS.map((step, i) => (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
              <div style={{
                width: i === st.step ? 24 : 18,
                height: i === st.step ? 24 : 18,
                borderRadius: "50%",
                background: i <= st.step ? "#111" : "#e5e5e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}>
                {i < st.step && (
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                    <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {i === st.step && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
              </div>
              <div style={{ fontSize: 10, fontWeight: i === st.step ? 700 : 500, color: i <= st.step ? "#111" : "#ccc", marginTop: 4 }}>
                {step}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1,
                height: 2,
                background: i < st.step ? "#111" : "#e5e5e5",
                margin: "0 6px",
                marginBottom: 18,
                borderRadius: 999,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Meta */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20, fontSize: 13, color: "#666" }}>
        <div><span style={lbl}>Category</span><br/>{task.category}</div>
        <div><span style={lbl}>Location</span><br/>{task.location}</div>
        <div><span style={lbl}>Deadline</span><br/>{task.deadline}</div>
      </div>

      {/* Worker */}
      {worker && (
        <>
          <div style={divider} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#111",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
            }}>
              {worker.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
                {worker.name}
                {worker.verified && <span style={{ fontSize: 10, color: "#888", background: "#f5f5f5", padding: "1px 6px", borderRadius: 3, fontWeight: 600, marginLeft: 6 }}>Verified</span>}
              </div>
              <div style={{ fontSize: 12, color: "#999" }}>
                {worker.rating} \u2605 &middot; {worker.completedTasks} tasks &middot; {worker.responseTime}
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>${worker.hourlyRate}/hr</div>
          </div>
        </>
      )}

      {/* Budget */}
      <div style={divider} />
      <div style={{ display: "flex", marginBottom: 20 }}>
        <NumCell label="Budget" value={`${task.budget}`} unit="pts" />
        <NumCell label="Escrowed" value={`${task.pointsEscrowed}`} unit="pts" />
        <NumCell label="Paid" value={`${task.pointsPaid}`} unit="pts" />
      </div>

      {/* Proof */}
      {task.proof && (
        <>
          <div style={divider} />
          <div style={{ ...lbl, marginBottom: 8 }}>Proof</div>
          <div style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: "12px 14px",
            marginBottom: 20,
          }}>
            <a href={task.proof.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: "#111", fontWeight: 500, wordBreak: "break-all" as const, textDecoration: "underline" }}>
              {task.proof.url}
            </a>
            {task.proof.notes && (
              <div style={{ fontSize: 13, color: "#666", marginTop: 8, lineHeight: 1.5 }}>
                {task.proof.notes}
              </div>
            )}
            {task.status === "proof_submitted" && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button style={{ ...btn, background: "#111", color: "#fff" }}>Approve & Pay</button>
                <button style={{ ...btn, background: "#fff", color: "#666", border: "1px solid #ddd" }}>Request Changes</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Timeline */}
      <div style={divider} />
      <div style={{ ...lbl, marginBottom: 10 }}>Activity</div>
      <div style={{ paddingLeft: 14, position: "relative" as const }}>
        <div style={{ position: "absolute" as const, left: 3, top: 6, bottom: 6, width: 1.5, background: "#eee" }} />
        {[...task.timeline].reverse().map((entry, i) => {
          const isFirst = i === 0;
          return (
            <div key={i} style={{ position: "relative" as const, paddingLeft: 16, paddingBottom: i < task.timeline.length - 1 ? 14 : 0 }}>
              <div style={{
                position: "absolute" as const,
                left: -3,
                top: 5,
                width: isFirst ? 10 : 7,
                height: isFirst ? 10 : 7,
                borderRadius: "50%",
                background: isFirst ? "#111" : "#ddd",
                border: isFirst ? "2px solid #e5e5e5" : "none",
              }} />
              <div style={{ fontSize: 13, color: isFirst ? "#111" : "#888", fontWeight: isFirst ? 600 : 400 }}>
                {entry.event}
              </div>
              <div style={{ fontSize: 11, color: "#ccc", marginTop: 1 }}>
                {entry.actor} &middot; {new Date(entry.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next action */}
      {task.status !== "completed" && (
        <div style={{
          marginTop: 20,
          padding: "10px 14px",
          background: "#fafafa",
          borderRadius: 8,
          fontSize: 13,
          color: "#666",
          border: "1px solid #f0f0f0",
        }}>
          <strong style={{ color: "#111" }}>Next:</strong>{" "}
          {task.status === "open" && "Find and hire a worker"}
          {task.status === "hired" && "Waiting for worker to start"}
          {task.status === "in_progress" && "Worker is on it \u2014 proof coming soon"}
          {task.status === "proof_submitted" && "Review proof above, then approve or request changes"}
          {task.status === "matching" && "Finding a match..."}
          {task.status === "disputed" && "Resolve with worker"}
        </div>
      )}
    </div>
  );
};

function NumCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" as const }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>{value}<span style={{ fontSize: 12, fontWeight: 500, color: "#bbb", marginLeft: 3 }}>{unit}</span></div>
      <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase" as const, letterSpacing: 0.4 }}>{label}</div>
    </div>
  );
}

const f = "'Inter', system-ui, -apple-system, sans-serif";
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.6 };
const divider: React.CSSProperties = { height: 1, background: "#f0f0f0", margin: "0 0 20px" };
const btn: React.CSSProperties = { flex: 1, padding: "8px 0", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", textAlign: "center" };

export default TaskDetail;

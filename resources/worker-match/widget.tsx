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
  description: "Worker matching list",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;
type Worker = z.infer<typeof workerSchema>;

function WorkerRow({ worker, taskId }: { worker: Worker; taskId: string | null }) {
  const [hired, setHired] = useState(false);
  const [open, setOpen] = useState(false);

  const handleHire = () => {
    setHired(true);
    navigator.clipboard?.writeText(`Hire ${worker.name} for task ${taskId}`).catch(() => {});
  };

  return (
    <div style={{
      border: hired ? "1.5px solid #111" : "1px solid #eee",
      borderRadius: 10,
      overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      {/* Main row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        cursor: "pointer",
      }} onClick={() => setOpen(!open)}>
        {/* Avatar */}
        <div style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          background: "#111",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}>
          {worker.avatar}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{worker.name}</span>
            {worker.verified && <span style={{ fontSize: 10, color: "#888", background: "#f5f5f5", padding: "1px 6px", borderRadius: 3, fontWeight: 600 }}>Verified</span>}
          </div>
          <div style={{ fontSize: 12, color: "#999", marginTop: 1 }}>
            {worker.rating} \u2605 &middot; {worker.completedTasks} tasks &middot; {worker.location}
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>${worker.hourlyRate}</div>
          <div style={{ fontSize: 11, color: "#bbb" }}>/hour</div>
        </div>

        {/* Chevron */}
        <span style={{ fontSize: 12, color: "#ccc", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}>\u25BC</span>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f5f5f5" }}>
          <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5, padding: "12px 0 10px" }}>
            {worker.bio}
          </div>

          {/* Skills */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 12 }}>
            {worker.skills.map((s) => (
              <span key={s} style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#555",
                background: "#f5f5f5",
                padding: "3px 10px",
                borderRadius: 4,
              }}>
                {s}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div style={{
            display: "flex",
            gap: 1,
            background: "#eee",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 12,
          }}>
            <StatCell label="Rating" value={`${worker.rating}/5`} />
            <StatCell label="Response" value={worker.responseTime} />
            <StatCell label="Completed" value={String(worker.completedTasks)} />
          </div>

          {/* Hire */}
          {taskId && !hired && (
            <button onClick={handleHire} style={{
              width: "100%",
              padding: "10px 0",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 0.2,
            }}>
              Hire {worker.name.split(" ")[0]}
            </button>
          )}

          {hired && (
            <div style={{
              textAlign: "center" as const,
              padding: "10px 0",
              background: "#f5f5f5",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "#111",
            }}>
              \u2713 Tell the AI: "Hire {worker.name.split(" ")[0]}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" as const, padding: "8px 4px", background: "#fafafa" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase" as const, letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}

const WorkerMatch: React.FC = () => {
  const { props, isPending } = useWidget<Props>();
  const [sortBy, setSortBy] = useState<"rating" | "price" | "tasks">("rating");

  if (isPending) {
    return <div style={{ padding: 48, textAlign: "center", color: "#aaa", fontFamily: f }}>Finding workers...</div>;
  }

  const { workers, taskId, taskTitle, category } = props;

  const sorted = [...workers].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "price") return a.hourlyRate - b.hourlyRate;
    return b.completedTasks - a.completedTasks;
  });

  return (
    <div style={{
      fontFamily: f,
      maxWidth: 500,
      margin: "0 auto",
      background: "#fff",
      borderRadius: 12,
      border: "1px solid #e8e8e8",
      padding: "24px 24px 20px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa", textTransform: "uppercase" as const, letterSpacing: 0.6 }}>
            Available Workers
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginTop: 2 }}>
            {taskTitle || category || "All"}
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#111" }}>
          {workers.length}
        </div>
      </div>

      {/* Sort */}
      {workers.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {([
            { key: "rating" as const, label: "Top Rated" },
            { key: "price" as const, label: "Best Price" },
            { key: "tasks" as const, label: "Most Experienced" },
          ]).map(({ key, label }) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              background: sortBy === key ? "#111" : "#f5f5f5",
              color: sortBy === key ? "#fff" : "#888",
              cursor: "pointer",
              transition: "all 0.15s",
            }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
        {sorted.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center" as const, color: "#aaa" }}>No workers available</div>
        ) : (
          sorted.map((w) => <WorkerRow key={w.id} worker={w} taskId={taskId} />)
        )}
      </div>

      {/* Footer */}
      {taskId && workers.length > 0 && (
        <div style={{ textAlign: "center" as const, fontSize: 12, color: "#aaa", marginTop: 14 }}>
          Click a worker to expand, then hire
        </div>
      )}
    </div>
  );
};

const f = "'Inter', system-ui, -apple-system, sans-serif";

export default WorkerMatch;

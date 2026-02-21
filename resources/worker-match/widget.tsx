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
  description: "Worker matching list with hire actions",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;
type Worker = z.infer<typeof workerSchema>;

function StarBar({ rating }: { rating: number }) {
  const pct = (rating / 5) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 60, height: 5, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#f59e0b", borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>{rating}</span>
    </div>
  );
}

function WorkerCard({ worker, taskId, rank }: { worker: Worker; taskId: string | null; rank: number }) {
  const [hired, setHired] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleHire = () => {
    if (!taskId) return;
    setHired(true);
    const cmd = `Hire ${worker.name} for task ${taskId}`;
    navigator.clipboard?.writeText(cmd).catch(() => {});
  };

  const isTop = rank <= 3;
  const medalColor = rank === 1 ? "#f59e0b" : rank === 2 ? "#94a3b8" : rank === 3 ? "#d97706" : "transparent";

  return (
    <div style={{
      background: hired ? "#f5f3ff" : "#fff",
      border: hired ? "2px solid #7c3aed" : "1px solid #e5e7eb",
      borderRadius: 14,
      padding: 0,
      overflow: "hidden",
      transition: "all 0.2s",
    }}>
      {/* Card header with avatar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px 12px",
      }}>
        {/* Avatar */}
        <div style={{ position: "relative" as const }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${rank === 1 ? "#7c3aed" : rank === 2 ? "#3b82f6" : "#6b7280"}, ${rank === 1 ? "#a78bfa" : rank === 2 ? "#93c5fd" : "#9ca3af"})`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 17,
          }}>
            {worker.avatar}
          </div>
          {isTop && (
            <div style={{
              position: "absolute" as const,
              top: -6,
              right: -6,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: medalColor,
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #fff",
            }}>
              {rank}
            </div>
          )}
        </div>

        {/* Name + location */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{worker.name}</span>
            {worker.verified && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563eb">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>{worker.location}</div>
          <StarBar rating={worker.rating} />
        </div>

        {/* Price */}
        <div style={{ textAlign: "right" as const }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>${worker.hourlyRate}</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>per hour</div>
        </div>
      </div>

      {/* Bio */}
      <div style={{
        padding: "0 18px 12px",
        fontSize: 13,
        color: "#6b7280",
        lineHeight: 1.5,
      }}>
        {worker.bio}
      </div>

      {/* Skills + Stats */}
      <div style={{ padding: "0 18px 14px" }}>
        {/* Skills */}
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 12 }}>
          {worker.skills.map((skill) => (
            <span key={skill} style={{
              background: "#f5f3ff",
              color: "#7c3aed",
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 999,
            }}>
              {skill}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex",
          gap: 1,
          background: "#f9fafb",
          borderRadius: 10,
          overflow: "hidden",
        }}>
          <StatCell label="Completed" value={worker.completedTasks.toLocaleString()} />
          <StatCell label="Response" value={worker.responseTime} />
          <StatCell label="Status" value={worker.available ? "Available" : "Busy"} valueColor={worker.available ? "#059669" : "#ef4444"} />
        </div>
      </div>

      {/* Expandable details */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: "8px 18px",
          fontSize: 12,
          color: "#7c3aed",
          cursor: "pointer",
          textAlign: "center" as const,
          background: "#faf5ff",
          fontWeight: 500,
          borderTop: "1px solid #f3f4f6",
        }}
      >
        {expanded ? "Hide details \u25B2" : "More details \u25BC"}
      </div>

      {expanded && (
        <div style={{ padding: "12px 18px", background: "#faf5ff", fontSize: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#9ca3af" }}>Worker ID</span>
            <span style={{ fontFamily: "monospace", color: "#7c3aed", fontWeight: 600 }}>{worker.id}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#9ca3af" }}>Success Rate</span>
            <span style={{ color: "#111827", fontWeight: 600 }}>{Math.min(95 + Math.floor(worker.rating * 1.05), 100)}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#9ca3af" }}>Member Since</span>
            <span style={{ color: "#111827", fontWeight: 600 }}>2024</span>
          </div>
        </div>
      )}

      {/* Hire button */}
      {taskId && !hired && (
        <div style={{ padding: "0 18px 16px", background: expanded ? "#faf5ff" : "#fff" }}>
          <button
            onClick={handleHire}
            style={{
              width: "100%",
              padding: "12px 0",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(124,58,237,0.35)",
              transition: "transform 0.1s",
            }}
          >
            Hire {worker.name.split(" ")[0]}
          </button>
        </div>
      )}

      {hired && (
        <div style={{
          margin: "0 18px 16px",
          background: "#ecfdf5",
          border: "1px solid #bbf7d0",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#059669">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#059669" }}>
            Tell the AI: "Hire {worker.name.split(" ")[0]}"
          </span>
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" as const, padding: "8px 4px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: valueColor ?? "#111827" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: 0.3 }}>{label}</div>
    </div>
  );
}

const WorkerMatch: React.FC = () => {
  const { props, isPending } = useWidget<Props>();
  const [sortBy, setSortBy] = useState<"rating" | "price" | "tasks">("rating");

  if (isPending) {
    return <div style={{ padding: 48, textAlign: "center", color: "#9ca3af" }}>Finding workers...</div>;
  }

  const { workers, taskId, taskTitle, category } = props;

  const sorted = [...workers].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "price") return a.hourlyRate - b.hourlyRate;
    return b.completedTasks - a.completedTasks;
  });

  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      maxWidth: 520,
      margin: "0 auto",
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.07)",
      overflow: "hidden",
    }}>
      {/* Accent */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #7c3aed, #2563eb, #059669)" }} />

      {/* Header */}
      <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: 0.8 }}>
              Worker Matches
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginTop: 2 }}>
              {taskTitle ? taskTitle : category || "All Workers"}
            </div>
          </div>
          <div style={{
            background: "#f5f3ff",
            borderRadius: 12,
            padding: "8px 16px",
            textAlign: "center" as const,
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#7c3aed" }}>{workers.length}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase" as const }}>found</div>
          </div>
        </div>

        {/* Sort */}
        {workers.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {([
              { key: "rating" as const, label: "Top Rated" },
              { key: "price" as const, label: "Best Price" },
              { key: "tasks" as const, label: "Most Experienced" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  border: sortBy === key ? "none" : "1px solid #e5e7eb",
                  background: sortBy === key ? "#7c3aed" : "#fff",
                  color: sortBy === key ? "#fff" : "#6b7280",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Worker list */}
      <div style={{ padding: "12px 18px 18px", display: "flex", flexDirection: "column" as const, gap: 14 }}>
        {sorted.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center" as const, color: "#9ca3af" }}>
            No workers available right now
          </div>
        ) : (
          sorted.map((w, i) => (
            <WorkerCard key={w.id} worker={w} taskId={taskId} rank={i + 1} />
          ))
        )}
      </div>

      {/* Footer */}
      {taskId && workers.length > 0 && (
        <div style={{
          padding: "12px 18px",
          background: "#f9fafb",
          borderTop: "1px solid #f3f4f6",
          textAlign: "center" as const,
          fontSize: 12,
          color: "#6b7280",
        }}>
          Click <strong>Hire</strong> or tell the AI which worker you want
        </div>
      )}
    </div>
  );
};

export default WorkerMatch;

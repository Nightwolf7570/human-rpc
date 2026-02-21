import { useWidget, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  task: z.object({
    id: z.string(),
    serviceId: z.string(),
    serviceName: z.string(),
    status: z.enum(["pending", "matched", "in_progress", "completed"]),
    location: z.string(),
    details: z.string(),
    humanName: z.string(),
    humanRating: z.number(),
    price: z.number(),
    createdAt: z.string(),
    eta: z.string(),
    updates: z.array(z.object({ time: z.string(), message: z.string() })),
  }),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Real-time task tracking with timeline",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; progress: number }
> = {
  pending: { label: "Pending", color: "#9ca3af", bg: "#f3f4f6", progress: 15 },
  matched: { label: "Human Matched", color: "#f59e0b", bg: "#fffbeb", progress: 35 },
  in_progress: { label: "In Progress", color: "#3b82f6", bg: "#eff6ff", progress: 65 },
  completed: { label: "Completed", color: "#22c55e", bg: "#f0fdf4", progress: 100 },
};

const TaskTracker: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
        Loading task status...
      </div>
    );
  }

  const { task } = props;
  const status = statusConfig[task.status] ?? statusConfig.pending;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          background:
            task.status === "completed"
              ? "linear-gradient(135deg, #22c55e, #16a34a)"
              : "linear-gradient(135deg, #3b82f6, #2563eb)",
          borderRadius: "16px 16px 0 0",
          padding: "20px 24px",
          color: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 11, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>
              Task Tracker
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
              {task.id}
            </div>
          </div>
          <span
            style={{
              background: "rgba(255,255,255,0.25)",
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {status.label}
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginTop: 16,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 999,
            height: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${status.progress}%`,
              height: "100%",
              background: "#fff",
              borderRadius: 999,
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            opacity: 0.7,
            marginTop: 4,
          }}
        >
          <span>Created</span>
          <span>Matched</span>
          <span>In Progress</span>
          <span>Done</span>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderTop: "none",
          borderRadius: "0 0 16px 16px",
          padding: 24,
        }}
      >
        {/* Human info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            padding: 14,
            background: "#f9fafb",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 17,
            }}
          >
            {task.humanName.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
              {task.humanName}
            </div>
            <div style={{ fontSize: 12, color: "#f59e0b" }}>
              {"★".repeat(Math.floor(task.humanRating))} {task.humanRating}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#7c3aed" }}>
              ${task.price.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>ETA: {task.eta}</div>
          </div>
        </div>

        {/* Task details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <DetailRow label="Service" value={task.serviceName} />
          <DetailRow label="Location" value={task.location} />
          <DetailRow label="Details" value={task.details} />
        </div>

        {/* Timeline */}
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#374151",
              marginBottom: 12,
            }}
          >
            Activity Timeline
          </div>
          <div style={{ position: "relative", paddingLeft: 20 }}>
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                left: 5,
                top: 6,
                bottom: 6,
                width: 2,
                background: "#e5e7eb",
              }}
            />

            {task.updates.map((update, i) => {
              const isLatest = i === task.updates.length - 1;
              return (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    paddingBottom: i < task.updates.length - 1 ? 16 : 0,
                  }}
                >
                  {/* Dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: -17,
                      top: 4,
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: isLatest ? status.color : "#d1d5db",
                      border: isLatest
                        ? `3px solid ${status.bg}`
                        : "3px solid #f3f4f6",
                    }}
                  />

                  <div
                    style={{
                      fontSize: 13,
                      color: isLatest ? "#111827" : "#6b7280",
                      fontWeight: isLatest ? 600 : 400,
                    }}
                  >
                    {update.message}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                    {new Date(update.time).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", fontSize: 13 }}>
      <span
        style={{
          color: "#9ca3af",
          fontWeight: 500,
          minWidth: 80,
        }}
      >
        {label}
      </span>
      <span style={{ color: "#111827" }}>{value}</span>
    </div>
  );
}

export default TaskTracker;

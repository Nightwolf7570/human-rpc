import { useWidget, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const propSchema = z.object({
  task: z.object({
    id: z.string(),
    serviceId: z.string(),
    serviceName: z.string(),
    status: z.string(),
    location: z.string(),
    details: z.string(),
    humanName: z.string(),
    humanRating: z.number(),
    price: z.number(),
    createdAt: z.string(),
    eta: z.string(),
    updates: z.array(z.object({ time: z.string(), message: z.string() })),
  }),
  service: z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    emoji: z.string(),
    basePrice: z.number(),
    unit: z.string(),
  }),
  urgency: z.string(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Task request confirmation with human match",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;

const TaskRequest: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
        Finding a human...
      </div>
    );
  }

  const { task, service, urgency } = props;

  const urgencyColor =
    urgency === "urgent"
      ? "#ef4444"
      : urgency === "rush"
        ? "#f59e0b"
        : "#22c55e";

  const urgencyLabel = urgency.charAt(0).toUpperCase() + urgency.slice(1);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Success banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #22c55e, #16a34a)",
          borderRadius: "16px 16px 0 0",
          padding: "20px 24px",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>&#10003;</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Human Matched!</div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
          Task {task.id} has been created
        </div>
      </div>

      {/* Main card */}
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
            padding: 16,
            background: "#f9fafb",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            {task.humanName.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
              {task.humanName}
            </div>
            <div style={{ fontSize: 13, color: "#f59e0b" }}>
              {"★".repeat(Math.floor(task.humanRating))} {task.humanRating}
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <span
              style={{
                background: "#f0fdf4",
                color: "#16a34a",
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Accepted
            </span>
          </div>
        </div>

        {/* Service & details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Row label="Service" value={`${service.emoji} ${service.name}`} />
          <Row label="Location" value={task.location} />
          <Row
            label="Instructions"
            value={task.details}
            multiline
          />
          <Row label="ETA" value={task.eta} />
          <Row
            label="Urgency"
            value={
              <span style={{ color: urgencyColor, fontWeight: 600 }}>
                {urgencyLabel}
              </span>
            }
          />
        </div>

        {/* Price */}
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: "linear-gradient(135deg, #faf5ff, #f3e8ff)",
            borderRadius: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600 }}>
            Total Price
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#7c3aed" }}>
            ${task.price.toFixed(2)}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
            Timeline
          </div>
          {task.updates.map((update, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                padding: "6px 0",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: i === task.updates.length - 1 ? "#22c55e" : "#d1d5db",
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {update.message}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div
      style={{
        display: multiline ? "block" : "flex",
        justifyContent: "space-between",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#9ca3af", fontWeight: 500 }}>{label}</span>
      <span
        style={{
          color: "#111827",
          fontWeight: 500,
          textAlign: multiline ? undefined : "right",
          marginTop: multiline ? 4 : 0,
          display: multiline ? "block" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default TaskRequest;

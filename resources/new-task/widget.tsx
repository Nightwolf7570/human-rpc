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
    pointsEscrowed: z.number(),
  }),
  matchCount: z.number(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "New task confirmation card",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;

function parseInstructions(raw: string): string[] {
  return raw.split(/[-\n\u2022]/).map((s) => s.trim()).filter((s) => s.length > 0);
}

const NewTask: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return <div style={{ padding: 48, textAlign: "center", color: "#a0a0a0", fontFamily: f }}>Creating task...</div>;
  }

  const { task, matchCount } = props;
  const bullets = parseInstructions(task.instructions);

  return (
    <div style={card}>
      {/* Top */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#888" }}>Task Created</span>
          <span style={{ fontSize: 12, color: "#bbb", fontFamily: "monospace" }}>{task.id}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", background: "#f0fdf4", padding: "3px 10px", borderRadius: 4 }}>Open</span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: -0.3, marginBottom: 16, lineHeight: 1.3 }}>
        {task.title}
      </div>

      {/* Meta */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20, fontSize: 13, color: "#666" }}>
        <div><span style={label}>Category</span><br/>{task.category}</div>
        <div><span style={label}>Location</span><br/>{task.location}</div>
        <div><span style={label}>Deadline</span><br/>{task.deadline}</div>
      </div>

      {/* Divider */}
      <div style={divider} />

      {/* Instructions */}
      <div style={{ ...label, marginBottom: 10 }}>Instructions</div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 20 }}>
        {bullets.map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, color: "#bbb", fontWeight: 600, minWidth: 18, fontFamily: "monospace" }}>{i + 1}.</span>
            <span style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{b}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={divider} />

      {/* Bottom */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#111" }}>{task.pointsEscrowed}<span style={{ fontSize: 13, fontWeight: 500, color: "#999", marginLeft: 4 }}>pts escrowed</span></div>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          background: "#f5f5f5",
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{matchCount}</span>
          <span style={{ fontSize: 13, color: "#888" }}>workers ready</span>
        </div>
      </div>
    </div>
  );
};

const f = "'Inter', system-ui, -apple-system, sans-serif";
const card: React.CSSProperties = {
  fontFamily: f,
  maxWidth: 480,
  margin: "0 auto",
  background: "#fff",
  borderRadius: 12,
  border: "1px solid #e8e8e8",
  padding: "24px 28px",
};
const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#aaa",
  textTransform: "uppercase",
  letterSpacing: 0.6,
};
const divider: React.CSSProperties = {
  height: 1,
  background: "#f0f0f0",
  margin: "0 0 20px",
};

export default NewTask;

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

const NewTask: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        Creating task...
      </div>
    );
  }

  const { task, matchCount } = props;

  return (
    <div style={styles.container}>
      {/* Success header */}
      <div style={styles.header}>
        <div style={styles.checkCircle}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={styles.headerTitle}>Task Created</div>
          <div style={styles.headerSubtitle}>{task.id}</div>
        </div>
        <div style={styles.statusBadge}>Open</div>
      </div>

      {/* Task card */}
      <div style={styles.card}>
        {/* Title */}
        <div style={styles.taskTitle}>{task.title}</div>

        {/* Meta grid */}
        <div style={styles.metaGrid}>
          <MetaItem icon="C" label="Category" value={task.category} />
          <MetaItem icon="L" label="Location" value={task.location} />
          <MetaItem icon="D" label="Deadline" value={task.deadline} />
          <MetaItem
            icon="B"
            label="Budget"
            value={`${task.budget} pts`}
            highlight
          />
        </div>

        {/* Instructions */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Instructions</div>
          <div style={styles.instructionsBox}>{task.instructions}</div>
        </div>

        {/* Escrow notice */}
        <div style={styles.escrowBar}>
          <div style={styles.escrowLeft}>
            <span style={styles.escrowDot} />
            {task.pointsEscrowed} pts escrowed
          </div>
          <div style={styles.escrowRight}>
            Released on approval
          </div>
        </div>

        {/* Workers available */}
        <div style={styles.matchBar}>
          <div style={styles.matchCount}>{matchCount}</div>
          <div style={styles.matchText}>
            <div style={styles.matchTitle}>Workers Available</div>
            <div style={styles.matchSub}>
              Use <code style={styles.code}>list_workers</code> to see matches
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function MetaItem({
  icon,
  label,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={styles.metaItem}>
      <div
        style={{
          ...styles.metaIcon,
          background: highlight ? "#7c3aed" : "#6b7280",
        }}
      >
        {icon}
      </div>
      <div>
        <div style={styles.metaLabel}>{label}</div>
        <div
          style={{
            ...styles.metaValue,
            color: highlight ? "#7c3aed" : "#111827",
            fontWeight: highlight ? 700 : 500,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { fontFamily: "system-ui, sans-serif", maxWidth: 520, margin: "0 auto" },
  loading: {
    padding: 48,
    textAlign: "center",
    color: "#9ca3af",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #e5e7eb",
    borderTopColor: "#7c3aed",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    background: "linear-gradient(135deg, #059669, #047857)",
    borderRadius: "16px 16px 0 0",
    padding: "18px 24px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    color: "#fff",
  },
  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: 700 },
  headerSubtitle: { fontSize: 13, opacity: 0.8 },
  statusBadge: {
    marginLeft: "auto",
    background: "rgba(255,255,255,0.25)",
    padding: "4px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderTop: "none",
    borderRadius: "0 0 16px 16px",
    padding: 24,
  },
  taskTitle: { fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 16 },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 16,
  },
  metaItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  metaIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  metaLabel: { fontSize: 11, color: "#9ca3af", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  metaValue: { fontSize: 13, color: "#111827", fontWeight: 500 },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  instructionsBox: {
    background: "#f9fafb",
    border: "1px solid #f3f4f6",
    borderRadius: 10,
    padding: 14,
    fontSize: 13,
    color: "#374151",
    lineHeight: 1.5,
  },
  escrowBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#faf5ff",
    border: "1px solid #ede9fe",
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 12,
  },
  escrowLeft: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#7c3aed" },
  escrowDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#7c3aed",
  },
  escrowRight: { fontSize: 11, color: "#9ca3af" },
  matchBar: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 14px",
    background: "#f0fdf4",
    border: "1px solid #dcfce7",
    borderRadius: 10,
  },
  matchCount: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "#22c55e",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 800,
  },
  matchText: {},
  matchTitle: { fontSize: 14, fontWeight: 600, color: "#111827" },
  matchSub: { fontSize: 12, color: "#6b7280" },
  code: {
    background: "#f3f4f6",
    padding: "1px 5px",
    borderRadius: 4,
    fontFamily: "monospace",
    fontSize: 11,
  },
};

export default NewTask;

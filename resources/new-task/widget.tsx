import { useWidget, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";
import { useState } from "react";

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
  // Split on newlines, bullet points, or numbered lists (e.g., "1.", "2.")
  // But NOT on periods within sentences
  const lines = raw.split(/\n|(?:^|\s)[•\-]\s|(?:^|\s)\d+\.\s/);
  return lines
    .map((s) => s.trim())
    .filter((s) => s.length > 10); // Filter out fragments
}

const NewTask: React.FC = () => {
  const { props, isPending } = useWidget<Props>();
  const [copied, setCopied] = useState(false);

  const handleWorkersClick = (taskId: string) => {
    const cmd = `list_workers for task "${taskId}"`;
    navigator.clipboard?.writeText(cmd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPending) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Creating task</span>
      </div>
    );
  }

  const { task, matchCount } = props;

  return (
    <div style={styles.container}>
      {/* Success indicator */}
      <div style={styles.successBanner}>
        <div style={styles.checkIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={styles.successText}>Task created</span>
      </div>

      {/* Main card */}
      <div style={styles.card}>
        {/* Task title */}
        <h1 style={styles.title}>{task.title}</h1>

        {/* Task ID */}
        <p style={styles.taskId}>{task.id}</p>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Info grid */}
        <div style={styles.infoGrid}>
          <InfoItem label="Category" value={task.category} />
          <InfoItem label="Location" value={task.location} />
          <InfoItem label="Deadline" value={task.deadline} />
          <InfoItem label="Budget" value={`${task.budget} pts`} accent />
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Instructions */}
        <div style={styles.section}>
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

        {/* Escrow notice */}
        <div style={styles.escrowCard}>
          <div style={styles.escrowLeft}>
            <span style={styles.escrowAmount}>{task.pointsEscrowed}</span>
            <span style={styles.escrowUnit}>pts in escrow</span>
          </div>
          <span style={styles.escrowNote}>Released on approval</span>
        </div>

        {/* Workers available */}
        <div
          style={styles.workersCard}
          onClick={() => handleWorkersClick(task.id)}
        >
          <div style={styles.workersCount}>{matchCount}</div>
          <div style={styles.workersInfo}>
            <span style={styles.workersTitle}>workers available</span>
            <span style={styles.workersHint}>
              {copied ? "✓ Copied! Tell the AI to list workers" : "Click to copy command"}
            </span>
          </div>
          <div style={styles.arrowIcon}>{copied ? "✓" : "→"}</div>
        </div>
      </div>
    </div>
  );
};

function InfoItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={styles.infoItem}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={{ ...styles.infoValue, ...(accent && styles.infoValueAccent) }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 480,
    margin: "0 auto",
    padding: 24,
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
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#E8F5E9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    fontSize: 17,
    fontWeight: 600,
    color: "#000",
    letterSpacing: "-0.02em",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 32,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#000",
    margin: 0,
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
  },
  taskId: {
    fontSize: 14,
    color: "#6B6B6B",
    margin: "8px 0 0 0",
    fontFamily: "monospace",
  },
  divider: {
    height: 1,
    background: "#F0F0F0",
    margin: "24px 0",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 500,
    color: "#000",
    letterSpacing: "-0.01em",
  },
  infoValueAccent: {
    fontWeight: 700,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "#6B6B6B",
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
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#000",
    color: "#fff",
    fontSize: 13,
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
    paddingTop: 4,
  },
  escrowCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#FAFAFA",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 12,
  },
  escrowLeft: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
  },
  escrowAmount: {
    fontSize: 24,
    fontWeight: 700,
    color: "#000",
    letterSpacing: "-0.02em",
  },
  escrowUnit: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  escrowNote: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  workersCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "#000",
    borderRadius: 12,
    padding: "20px 24px",
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  workersCount: {
    fontSize: 32,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.02em",
  },
  workersInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  workersTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#fff",
    letterSpacing: "-0.01em",
  },
  workersHint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
  },
  arrowIcon: {
    fontSize: 20,
    color: "#fff",
    fontWeight: 300,
  },
};

export default NewTask;

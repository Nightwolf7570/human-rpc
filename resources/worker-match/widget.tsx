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

function WorkerCard({ worker, taskId, rank }: { worker: Worker; taskId: string | null; rank: number }) {
  const [hired, setHired] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleHire = () => {
    if (!taskId) return;
    setHired(true);
    const cmd = `hire_worker with task_id="${taskId}" and worker_id="${worker.id}"`;
    navigator.clipboard?.writeText(cmd).catch(() => {});
  };

  return (
    <div style={{
      ...styles.workerCard,
      borderColor: hired ? "#000" : "transparent",
      background: hired ? "#FAFAFA" : "#fff",
    }}>
      {/* Top row */}
      <div style={styles.workerTop}>
        <div style={styles.avatarContainer}>
          <div style={styles.avatar}>{worker.avatar}</div>
          {rank <= 3 && (
            <div style={styles.rankBadge}>#{rank}</div>
          )}
        </div>

        <div style={styles.workerInfo}>
          <div style={styles.nameRow}>
            <span style={styles.workerName}>{worker.name}</span>
            {worker.verified && (
              <span style={styles.verifiedBadge}>✓</span>
            )}
          </div>
          <span style={styles.location}>{worker.location}</span>
        </div>

        <div style={styles.rateContainer}>
          <span style={styles.rateAmount}>${worker.hourlyRate}</span>
          <span style={styles.rateUnit}>/hr</span>
        </div>
      </div>

      {/* Skills */}
      <div style={styles.skillsRow}>
        {worker.skills.slice(0, 3).map((skill) => (
          <span key={skill} style={styles.skillTag}>{skill}</span>
        ))}
        {worker.skills.length > 3 && (
          <span style={styles.moreSkills}>+{worker.skills.length - 3}</span>
        )}
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{worker.rating.toFixed(1)}</span>
          <span style={styles.statLabel}>Rating</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.stat}>
          <span style={styles.statValue}>{worker.completedTasks}</span>
          <span style={styles.statLabel}>Tasks</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.stat}>
          <span style={styles.statValue}>{worker.responseTime}</span>
          <span style={styles.statLabel}>Response</span>
        </div>
      </div>

      {/* Expandable */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={styles.expandButton}
      >
        {expanded ? "Less" : "More details"}
      </button>

      {expanded && (
        <div style={styles.expandedSection}>
          <p style={styles.bio}>{worker.bio}</p>
          <div style={styles.expandedRow}>
            <span style={styles.expandedLabel}>Status</span>
            <span style={{
              ...styles.expandedValue,
              color: worker.available ? "#1B5E20" : "#B71C1C",
            }}>
              {worker.available ? "Available now" : "Busy"}
            </span>
          </div>
        </div>
      )}

      {/* Hire button */}
      {taskId && !hired && (
        <button onClick={handleHire} style={styles.hireButton}>
          Hire {worker.name.split(" ")[0]}
        </button>
      )}

      {hired && (
        <div style={styles.hiredBanner}>
          <span style={styles.hiredCheck}>✓</span>
          <span>Tell the AI: "Hire {worker.name.split(" ")[0]}"</span>
        </div>
      )}
    </div>
  );
}

const WorkerMatch: React.FC = () => {
  const { props, isPending } = useWidget<Props>();
  const [sortBy, setSortBy] = useState<"rating" | "price" | "tasks">("rating");

  if (isPending) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <span style={styles.loadingText}>Finding workers</span>
      </div>
    );
  }

  const { workers, taskId, taskTitle, category } = props;

  const sorted = [...workers].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "price") return a.hourlyRate - b.hourlyRate;
    return b.completedTasks - a.completedTasks;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.headerLabel}>Available workers</span>
          <h1 style={styles.headerTitle}>
            {taskTitle || (category ? category : "All categories")}
          </h1>
        </div>
        <div style={styles.countBadge}>
          <span style={styles.countNumber}>{workers.length}</span>
        </div>
      </div>

      {/* Sort */}
      {workers.length > 1 && (
        <div style={styles.sortBar}>
          {(["rating", "price", "tasks"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                ...styles.sortButton,
                background: sortBy === key ? "#000" : "transparent",
                color: sortBy === key ? "#fff" : "#6B6B6B",
              }}
            >
              {key === "rating" ? "Top rated" : key === "price" ? "Price" : "Experience"}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div style={styles.list}>
        {sorted.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyText}>No workers available</span>
            <span style={styles.emptyHint}>Try a different category</span>
          </div>
        ) : (
          sorted.map((worker, i) => (
            <WorkerCard key={worker.id} worker={worker} taskId={taskId} rank={i + 1} />
          ))
        )}
      </div>

      {/* Footer hint */}
      {taskId && workers.length > 0 && (
        <div style={styles.footer}>
          Click "Hire" or tell the AI which worker you want
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: 520,
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerContent: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#000",
    margin: 0,
    letterSpacing: "-0.03em",
  },
  countBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  countNumber: {
    fontSize: 24,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.02em",
  },
  sortBar: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
  },
  sortButton: {
    padding: "10px 18px",
    border: "1px solid #E0E0E0",
    borderRadius: 24,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    letterSpacing: "-0.01em",
  },
  list: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: 64,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: 600,
    color: "#000",
  },
  emptyHint: {
    fontSize: 15,
    color: "#6B6B6B",
  },
  workerCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.03)",
    border: "2px solid transparent",
    transition: "all 0.15s ease",
    display: "flex",
    flexDirection: "column",
  },
  workerTop: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#F5F5F5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
  },
  rankBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#000",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  workerInfo: {
    flex: 1,
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#000",
    letterSpacing: "-0.02em",
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#000",
    color: "#fff",
    fontSize: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  location: {
    fontSize: 14,
    color: "#6B6B6B",
    marginTop: 2,
  },
  rateContainer: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
  },
  rateAmount: {
    fontSize: 20,
    fontWeight: 700,
    color: "#000",
    letterSpacing: "-0.02em",
  },
  rateUnit: {
    fontSize: 14,
    color: "#6B6B6B",
  },
  bio: {
    fontSize: 15,
    color: "#6B6B6B",
    lineHeight: 1.5,
    margin: "0 0 16px 0",
  },
  skillsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  skillTag: {
    padding: "4px 10px",
    background: "#F5F5F5",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 500,
    color: "#000",
    letterSpacing: "-0.01em",
  },
  moreSkills: {
    padding: "6px 14px",
    background: "#F5F5F5",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    color: "#6B6B6B",
  },
  statsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    padding: "10px 0",
    borderTop: "1px solid #F0F0F0",
    borderBottom: "1px solid #F0F0F0",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: 700,
    color: "#000",
    letterSpacing: "-0.01em",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: "#9E9E9E",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  statDivider: {
    width: 1,
    height: 32,
    background: "#F0F0F0",
  },
  expandButton: {
    width: "100%",
    padding: "12px",
    background: "transparent",
    border: "none",
    fontSize: 14,
    fontWeight: 500,
    color: "#6B6B6B",
    cursor: "pointer",
    transition: "color 0.15s ease",
  },
  expandedSection: {
    background: "#FAFAFA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  expandedRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  expandedLabel: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  expandedValue: {
    fontSize: 13,
    fontWeight: 500,
    color: "#000",
    textAlign: "right",
    maxWidth: "60%",
  },
  hireButton: {
    width: "100%",
    padding: "18px 24px",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.1s ease, opacity 0.1s ease",
    letterSpacing: "-0.01em",
  },
  hiredBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "18px 24px",
    background: "#F5F5F5",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 500,
    color: "#000",
  },
  hiredCheck: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "#000",
    color: "#fff",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 14,
    color: "#6B6B6B",
  },
};

export default WorkerMatch;

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
  return raw
    .split(/[-\n•]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const NewTask: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <div style={s.loadingWrap}>
        <div style={s.loadingPulse} />
        <div style={s.loadingText}>Creating task...</div>
      </div>
    );
  }

  const { task, matchCount } = props;
  const bullets = parseInstructions(task.instructions);

  return (
    <div style={s.root}>
      {/* Top accent bar */}
      <div style={s.accent} />

      <div style={s.inner}>
        {/* Success row */}
        <div style={s.successRow}>
          <div style={s.successIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={s.successTitle}>Task Created</div>
            <div style={s.successId}>{task.id}</div>
          </div>
          <div style={s.statusChip}>Open</div>
        </div>

        {/* Title */}
        <div style={s.title}>{task.title}</div>

        {/* Info pills */}
        <div style={s.pillRow}>
          <Pill label={task.category} color="#7c3aed" bg="#f5f3ff" />
          <Pill label={task.deadline} color="#0369a1" bg="#f0f9ff" />
          <Pill label={`${task.budget} pts`} color="#059669" bg="#ecfdf5" />
        </div>

        {/* Location */}
        <div style={s.locationRow}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" fill="#6b7280"/>
          </svg>
          <span style={s.locationText}>{task.location}</span>
        </div>

        {/* Divider */}
        <div style={s.divider} />

        {/* Instructions */}
        <div style={s.sectionLabel}>Instructions for worker</div>
        <div style={s.instructionsList}>
          {bullets.map((b, i) => (
            <div key={i} style={s.bulletRow}>
              <div style={s.bulletNum}>{i + 1}</div>
              <div style={s.bulletText}>{b}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={s.divider} />

        {/* Bottom row */}
        <div style={s.bottomRow}>
          {/* Escrow */}
          <div style={s.escrowBox}>
            <div style={s.escrowIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#7c3aed" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div>
              <div style={s.escrowAmount}>{task.pointsEscrowed} pts</div>
              <div style={s.escrowLabel}>Held in escrow</div>
            </div>
          </div>

          {/* Workers */}
          <div style={s.matchBox}>
            <div style={s.matchNum}>{matchCount}</div>
            <div>
              <div style={s.matchTitle}>Workers ready</div>
              <div style={s.matchSub}>View matches &rarr;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ background: bg, color, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999 }}>
      {label}
    </span>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    maxWidth: 480,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.07)",
    overflow: "hidden",
  },
  accent: {
    height: 4,
    background: "linear-gradient(90deg, #7c3aed, #2563eb, #059669)",
  },
  inner: { padding: "20px 24px 24px" },

  successRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  successIcon: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#059669",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  successTitle: { fontSize: 15, fontWeight: 700, color: "#111827" },
  successId: { fontSize: 12, color: "#6b7280", fontFamily: "monospace" },
  statusChip: {
    marginLeft: "auto",
    background: "#ecfdf5",
    color: "#059669",
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 12px",
    borderRadius: 999,
  },

  title: { fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1.3, marginBottom: 12 },

  pillRow: { display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 12 },

  locationRow: { display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 16 },
  locationText: { fontSize: 13, color: "#6b7280" },

  divider: { height: 1, background: "#f3f4f6", margin: "0 0 16px" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  instructionsList: { display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 16 },
  bulletRow: { display: "flex", gap: 10, alignItems: "flex-start" },
  bulletNum: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#f5f3ff",
    color: "#7c3aed",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bulletText: { fontSize: 13, color: "#374151", lineHeight: 1.5 },

  bottomRow: { display: "flex", gap: 12 },
  escrowBox: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "#f5f3ff",
    borderRadius: 12,
  },
  escrowIcon: { flexShrink: 0 },
  escrowAmount: { fontSize: 16, fontWeight: 800, color: "#7c3aed" },
  escrowLabel: { fontSize: 11, color: "#9ca3af" },
  matchBox: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    background: "#ecfdf5",
    borderRadius: 12,
  },
  matchNum: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#059669",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 800,
    flexShrink: 0,
  },
  matchTitle: { fontSize: 13, fontWeight: 700, color: "#111827" },
  matchSub: { fontSize: 11, color: "#059669" },

  loadingWrap: {
    padding: 48,
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12,
  },
  loadingPulse: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#e5e7eb",
  },
  loadingText: { fontSize: 14, color: "#9ca3af" },
};

export default NewTask;

import { useWidget, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  basePrice: z.number(),
  unit: z.string(),
  emoji: z.string(),
  eta: z.string(),
  rating: z.number(),
  completedTasks: z.number(),
});

const propSchema = z.object({
  services: z.array(serviceSchema),
  categories: z.array(z.string()),
  activeCategory: z.string(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Browse available human services catalog",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;
type Service = z.infer<typeof serviceSchema>;

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ color: "#f59e0b", fontSize: 12 }}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      <span style={{ color: "#d1d5db" }}>{"★".repeat(5 - full - (half ? 1 : 0))}</span>
      <span style={{ color: "#6b7280", marginLeft: 4 }}>{rating}</span>
    </span>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "box-shadow 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 28 }}>{service.emoji}</span>
        <span
          style={{
            background: "#f0fdf4",
            color: "#16a34a",
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          {service.category}
        </span>
      </div>

      <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>
        {service.name}
      </div>

      <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.4, flex: 1 }}>
        {service.description}
      </div>

      <Stars rating={service.rating} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #f3f4f6",
          paddingTop: 8,
          marginTop: 4,
        }}
      >
        <div>
          <span style={{ fontWeight: 700, fontSize: 18, color: "#7c3aed" }}>
            ${service.basePrice}
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 4 }}>
            {service.unit}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af" }}>
          ETA: {service.eta}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#9ca3af" }}>
        {service.completedTasks.toLocaleString()} tasks completed
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
          color: "#fff",
          textAlign: "center",
          padding: "8px 0",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          marginTop: 4,
        }}
      >
        Rent a Human
      </div>
    </div>
  );
}

const ServiceBrowser: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
        Loading services...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 20,
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          HumanRPC
        </div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>
          Remote Procedure Calls to Real Humans
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          {["All", ...props.categories].map((cat) => (
            <span
              key={cat}
              style={{
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background:
                  (cat === "All" && props.activeCategory === "All") ||
                  cat === props.activeCategory
                    ? "#fff"
                    : "rgba(255,255,255,0.2)",
                color:
                  (cat === "All" && props.activeCategory === "All") ||
                  cat === props.activeCategory
                    ? "#7c3aed"
                    : "#fff",
                cursor: "pointer",
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Services grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {props.services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {props.services.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#9ca3af",
          }}
        >
          No services found in this category.
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "16px 0",
          marginTop: 16,
          fontSize: 12,
          color: "#9ca3af",
        }}
      >
        {props.services.length} services available &middot; Powered by HumanRPC
      </div>
    </div>
  );
};

export default ServiceBrowser;

import { useWidget, type WidgetMetadata } from "mcp-use/react";
import { z } from "zod";

const pricingTierSchema = z.object({
  subtotal: z.number(),
  platformFee: z.number(),
  total: z.number(),
});

const propSchema = z.object({
  service: z.object({
    id: z.string(),
    name: z.string(),
    emoji: z.string(),
    basePrice: z.number(),
    unit: z.string(),
    eta: z.string(),
    rating: z.number(),
  }),
  quantity: z.number(),
  location: z.string(),
  pricing: z.object({
    standard: pricingTierSchema,
    rush: pricingTierSchema,
    urgent: pricingTierSchema,
  }),
  validFor: z.string(),
});

export const widgetMetadata: WidgetMetadata = {
  description: "Price quote display with tier comparison",
  props: propSchema as any,
};

type Props = z.infer<typeof propSchema>;

const QuoteDisplay: React.FC = () => {
  const { props, isPending } = useWidget<Props>();

  if (isPending) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
        Calculating quote...
      </div>
    );
  }

  const { service, quantity, location, pricing, validFor } = props;

  const tiers = [
    {
      name: "Standard",
      key: "standard" as const,
      color: "#22c55e",
      bg: "#f0fdf4",
      multiplier: "1x",
      eta: service.eta,
    },
    {
      name: "Rush",
      key: "rush" as const,
      color: "#f59e0b",
      bg: "#fffbeb",
      multiplier: "1.5x",
      eta: "Faster",
    },
    {
      name: "Urgent",
      key: "urgent" as const,
      color: "#ef4444",
      bg: "#fef2f2",
      multiplier: "2x",
      eta: "ASAP",
    },
  ];

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
          borderRadius: "16px 16px 0 0",
          padding: "20px 24px",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.8, textTransform: "uppercase", letterSpacing: 1 }}>
          Price Quote
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>
          {service.emoji} {service.name}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
          Quantity: {quantity} &middot; {location}
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
        {/* Pricing tiers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tiers.map((tier) => {
            const p = pricing[tier.key];
            return (
              <div
                key={tier.key}
                style={{
                  border: `2px solid ${tier.key === "standard" ? tier.color : "#e5e7eb"}`,
                  borderRadius: 12,
                  padding: 16,
                  background: tier.key === "standard" ? tier.bg : "#fff",
                  position: "relative",
                }}
              >
                {tier.key === "standard" && (
                  <span
                    style={{
                      position: "absolute",
                      top: -10,
                      right: 12,
                      background: "#22c55e",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    RECOMMENDED
                  </span>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 15,
                          color: tier.color,
                        }}
                      >
                        {tier.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          background: "#f3f4f6",
                          padding: "1px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {tier.multiplier} price
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                      ETA: {tier.eta}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      ${p.total.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      ${p.subtotal.toFixed(2)} + ${p.platformFee.toFixed(2)} fee
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info row */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#faf5ff",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
          }}
        >
          <span style={{ color: "#7c3aed" }}>
            Quote valid for <strong>{validFor}</strong>
          </span>
          <span style={{ color: "#9ca3af" }}>
            {service.rating} ★ rated service
          </span>
        </div>

        {/* Base info */}
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "#9ca3af",
            textAlign: "center",
          }}
        >
          Base rate: ${service.basePrice}/{service.unit} &middot; 10% platform fee
        </div>
      </div>
    </div>
  );
};

export default QuoteDisplay;

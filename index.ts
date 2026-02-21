import { MCPServer, widget, text, object } from "mcp-use/server";
import { z } from "zod";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const server = new MCPServer({
  name: "human-rpc",
  title: "HumanRPC",
  version: "1.0.0",
  description:
    "Remote Procedure Calls to Real Humans. AI agents rent human hands to complete physical-world tasks like picking up packages, buying billboards, flyering, photography, and more.",
  host: process.env.HOST ?? "0.0.0.0",
  baseUrl: process.env.MCP_URL ?? `http://localhost:${port}`,
});

// ─── Data Layer (simulated) ──────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  unit: string;
  emoji: string;
  eta: string;
  rating: number;
  completedTasks: number;
}

const SERVICES: Service[] = [
  {
    id: "pkg-pickup",
    name: "Package Pickup & Delivery",
    category: "Logistics",
    description:
      "A human picks up a package from one location and delivers it to another within the same city.",
    basePrice: 25,
    unit: "per trip",
    emoji: "\u{1F4E6}",
    eta: "1-3 hours",
    rating: 4.8,
    completedTasks: 12453,
  },
  {
    id: "billboard-buy",
    name: "Billboard Advertising",
    category: "Marketing",
    description:
      "A human scouts, negotiates, and purchases billboard ad space in your target area.",
    basePrice: 150,
    unit: "per billboard",
    emoji: "\u{1F4CB}",
    eta: "2-5 days",
    rating: 4.6,
    completedTasks: 892,
  },
  {
    id: "flyering",
    name: "Street Flyering",
    category: "Marketing",
    description:
      "A human distributes your flyers/brochures in high-traffic areas in your chosen neighborhood.",
    basePrice: 35,
    unit: "per hour",
    emoji: "\u{1F4C4}",
    eta: "Same day",
    rating: 4.5,
    completedTasks: 6721,
  },
  {
    id: "photo-scout",
    name: "Location Photography",
    category: "Media",
    description:
      "A human photographer visits a location and takes professional photos per your specifications.",
    basePrice: 75,
    unit: "per session",
    emoji: "\u{1F4F7}",
    eta: "1-2 days",
    rating: 4.9,
    completedTasks: 3104,
  },
  {
    id: "errand-run",
    name: "Errand Running",
    category: "Personal",
    description:
      "A human runs errands for you \u2014 grocery shopping, dry cleaning pickup, returns, bank deposits, etc.",
    basePrice: 20,
    unit: "per errand",
    emoji: "\u{1F3C3}",
    eta: "1-4 hours",
    rating: 4.7,
    completedTasks: 18290,
  },
  {
    id: "event-staff",
    name: "Event Staffing",
    category: "Events",
    description:
      "Hire on-demand humans for event setup, registration desks, ushering, or teardown.",
    basePrice: 30,
    unit: "per hour per person",
    emoji: "\u{1F389}",
    eta: "1-3 days advance booking",
    rating: 4.6,
    completedTasks: 2567,
  },
  {
    id: "install-hw",
    name: "Physical Installation",
    category: "Technical",
    description:
      "A human installs physical hardware, signage, sensors, cameras, or equipment at a specified location.",
    basePrice: 85,
    unit: "per installation",
    emoji: "\u{1F527}",
    eta: "1-3 days",
    rating: 4.7,
    completedTasks: 1843,
  },
  {
    id: "mystery-shop",
    name: "Mystery Shopping",
    category: "Research",
    description:
      "A human visits a business undercover and provides a detailed experience report with photos.",
    basePrice: 45,
    unit: "per visit",
    emoji: "\u{1F575}\u{FE0F}",
    eta: "1-3 days",
    rating: 4.8,
    completedTasks: 4210,
  },
  {
    id: "queue-wait",
    name: "Queue Waiting",
    category: "Personal",
    description:
      "A human waits in line for you \u2014 DMV, product launches, restaurant reservations, government offices.",
    basePrice: 22,
    unit: "per hour",
    emoji: "\u{1F9CD}",
    eta: "Same day",
    rating: 4.4,
    completedTasks: 7832,
  },
  {
    id: "notarize",
    name: "Document Notarization",
    category: "Legal",
    description:
      "A human takes your documents to a notary public and returns the notarized copies.",
    basePrice: 40,
    unit: "per document set",
    emoji: "\u{1F4DD}",
    eta: "1-2 days",
    rating: 4.9,
    completedTasks: 5621,
  },
];

interface TaskRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  status: "pending" | "matched" | "in_progress" | "completed";
  location: string;
  details: string;
  humanName: string;
  humanRating: number;
  price: number;
  createdAt: string;
  eta: string;
  updates: { time: string; message: string }[];
}

const ACTIVE_TASKS: Map<string, TaskRecord> = new Map();

let taskCounter = 1000;

function generateTaskId(): string {
  return `HRPC-${++taskCounter}`;
}

const HUMAN_NAMES = [
  "Sarah K.",
  "Marcus T.",
  "Priya S.",
  "Jake R.",
  "Aisha M.",
  "Tom W.",
  "Luna C.",
  "Diego F.",
];

function randomHuman() {
  const name = HUMAN_NAMES[Math.floor(Math.random() * HUMAN_NAMES.length)];
  const rating = +(4.3 + Math.random() * 0.7).toFixed(1);
  return { name, rating };
}

// ─── Tools ───────────────────────────────────────────────────────────────────

server.tool(
  {
    name: "browse_services",
    description:
      "Browse all available human services that AI can rent. Optionally filter by category. Returns a visual catalog of services with pricing, ratings, and ETAs.",
    schema: z.object({
      category: z
        .string()
        .optional()
        .describe(
          "Filter by category: Logistics, Marketing, Media, Personal, Events, Technical, Research, Legal"
        ),
    }) as any,
    widget: {
      name: "service-browser",
      invoking: "Loading services...",
      invoked: "Services loaded",
    },
  },
  async ({ category }) => {
    const filtered = category
      ? SERVICES.filter(
          (s) => s.category.toLowerCase() === category.toLowerCase()
        )
      : SERVICES;

    const categories = [...new Set(SERVICES.map((s) => s.category))];

    return widget({
      props: {
        services: filtered,
        categories,
        activeCategory: category ?? "All",
      },
      output: text(
        `Found ${filtered.length} human services${category ? ` in "${category}"` : ""}:\n\n` +
          filtered
            .map(
              (s) =>
                `- ${s.emoji} **${s.name}** ($${s.basePrice} ${s.unit}) - ${s.description}`
            )
            .join("\n")
      ),
    });
  }
);

server.tool(
  {
    name: "request_task",
    description:
      "Request a human to perform a physical-world task. Specify the service, location, and task details. Returns a task ID for tracking.",
    schema: z.object({
      service_id: z
        .string()
        .describe(
          "Service ID (e.g. pkg-pickup, billboard-buy, flyering, photo-scout, errand-run, event-staff, install-hw, mystery-shop, queue-wait, notarize)"
        ),
      location: z
        .string()
        .describe("Physical location/address where the task needs to be performed"),
      details: z
        .string()
        .describe(
          "Detailed instructions for the human performing the task"
        ),
      urgency: z
        .enum(["standard", "rush", "urgent"])
        .optional()
        .describe("Urgency level: standard (default), rush (1.5x), urgent (2x)"),
    }) as any,
    widget: {
      name: "task-request",
      invoking: "Finding a human...",
      invoked: "Human matched!",
    },
  },
  async ({ service_id, location, details, urgency }) => {
    const service = SERVICES.find((s) => s.id === service_id);
    if (!service) {
      return text(`Unknown service: "${service_id}". Use browse_services to see available options.`);
    }

    const multiplier =
      urgency === "urgent" ? 2.0 : urgency === "rush" ? 1.5 : 1.0;
    const price = +(service.basePrice * multiplier).toFixed(2);
    const human = randomHuman();
    const taskId = generateTaskId();

    const task: TaskRecord = {
      id: taskId,
      serviceId: service.id,
      serviceName: service.name,
      status: "matched",
      location,
      details,
      humanName: human.name,
      humanRating: human.rating,
      price,
      createdAt: new Date().toISOString(),
      eta: service.eta,
      updates: [
        {
          time: new Date().toISOString(),
          message: "Task created and submitted to HumanRPC network",
        },
        {
          time: new Date(Date.now() + 15000).toISOString(),
          message: `${human.name} accepted your task`,
        },
      ],
    };

    ACTIVE_TASKS.set(taskId, task);

    return widget({
      props: {
        task,
        service,
        urgency: urgency ?? "standard",
      },
      output: text(
        `Task ${taskId} created!\n\n` +
          `**Service:** ${service.emoji} ${service.name}\n` +
          `**Human:** ${human.name} (${human.rating} stars)\n` +
          `**Location:** ${location}\n` +
          `**Price:** $${price} (${urgency ?? "standard"})\n` +
          `**ETA:** ${service.eta}\n\n` +
          `Use \`track_task\` with ID "${taskId}" to monitor progress.`
      ),
    });
  }
);

server.tool(
  {
    name: "get_quote",
    description:
      "Get a price quote for a human task before committing. Shows pricing breakdown with urgency tiers.",
    schema: z.object({
      service_id: z
        .string()
        .describe("Service ID to get a quote for"),
      quantity: z
        .number()
        .optional()
        .describe("Quantity/hours needed (default 1)"),
      location: z
        .string()
        .optional()
        .describe("Location for distance-based pricing adjustments"),
    }) as any,
    widget: {
      name: "quote-display",
      invoking: "Calculating quote...",
      invoked: "Quote ready",
    },
  },
  async ({ service_id, quantity, location }) => {
    const service = SERVICES.find((s) => s.id === service_id);
    if (!service) {
      return text(`Unknown service: "${service_id}". Use browse_services to see available options.`);
    }

    const qty = quantity ?? 1;
    const base = service.basePrice * qty;
    const rush = +(base * 1.5).toFixed(2);
    const urgent = +(base * 2.0).toFixed(2);
    const platformFee = +(base * 0.1).toFixed(2);

    const quote = {
      service,
      quantity: qty,
      location: location ?? "Not specified",
      pricing: {
        standard: { subtotal: base, platformFee, total: +(base + platformFee).toFixed(2) },
        rush: { subtotal: rush, platformFee: +(rush * 0.1).toFixed(2), total: +(rush + rush * 0.1).toFixed(2) },
        urgent: { subtotal: urgent, platformFee: +(urgent * 0.1).toFixed(2), total: +(urgent + urgent * 0.1).toFixed(2) },
      },
      validFor: "30 minutes",
    };

    return widget({
      props: quote,
      output: text(
        `**Quote for ${service.emoji} ${service.name}** (x${qty})\n\n` +
          `| Tier | Subtotal | Fee | Total |\n` +
          `|------|----------|-----|-------|\n` +
          `| Standard | $${base} | $${platformFee} | **$${quote.pricing.standard.total}** |\n` +
          `| Rush (1.5x) | $${rush} | $${quote.pricing.rush.platformFee} | **$${quote.pricing.rush.total}** |\n` +
          `| Urgent (2x) | $${urgent} | $${quote.pricing.urgent.platformFee} | **$${quote.pricing.urgent.total}** |\n\n` +
          `Quote valid for ${quote.validFor}.`
      ),
    });
  }
);

server.tool(
  {
    name: "track_task",
    description:
      "Track the status of a previously requested human task. Shows real-time status, human info, and timeline updates.",
    schema: z.object({
      task_id: z.string().describe("Task ID (e.g. HRPC-1001)"),
    }) as any,
    widget: {
      name: "task-tracker",
      invoking: "Loading task status...",
      invoked: "Status loaded",
    },
  },
  async ({ task_id }) => {
    const task = ACTIVE_TASKS.get(task_id);
    if (!task) {
      return text(
        `Task "${task_id}" not found. Make sure you have the correct task ID from a previous request_task call.`
      );
    }

    // Simulate progress
    if (task.status === "matched") {
      task.status = "in_progress";
      task.updates.push({
        time: new Date().toISOString(),
        message: `${task.humanName} is en route to ${task.location}`,
      });
    }

    return widget({
      props: { task },
      output: text(
        `**Task ${task.id}** - ${task.serviceName}\n\n` +
          `**Status:** ${task.status.replace("_", " ").toUpperCase()}\n` +
          `**Human:** ${task.humanName} (${task.humanRating} stars)\n` +
          `**Location:** ${task.location}\n` +
          `**Price:** $${task.price}\n\n` +
          `**Timeline:**\n` +
          task.updates.map((u) => `- ${u.message}`).join("\n")
      ),
    });
  }
);

server.tool(
  {
    name: "complete_task",
    description:
      "Mark a task as completed. The assigned human confirms the task is done.",
    schema: z.object({
      task_id: z.string().describe("Task ID to mark as completed"),
      notes: z.string().optional().describe("Completion notes from the human"),
    }) as any,
  },
  async ({ task_id, notes }) => {
    const task = ACTIVE_TASKS.get(task_id);
    if (!task) {
      return text(`Task "${task_id}" not found.`);
    }

    task.status = "completed";
    task.updates.push({
      time: new Date().toISOString(),
      message: `Task completed by ${task.humanName}${notes ? `: ${notes}` : ""}`,
    });

    return text(
      `Task ${task.id} marked as **completed**!\n\n` +
        `**Service:** ${task.serviceName}\n` +
        `**Human:** ${task.humanName}\n` +
        `**Final Price:** $${task.price}\n` +
        (notes ? `**Notes:** ${notes}` : "")
    );
  }
);

server.tool(
  {
    name: "list_active_tasks",
    description: "List all active (non-completed) tasks with their current status.",
    schema: z.object({}) as any,
  },
  async () => {
    const tasks = [...ACTIVE_TASKS.values()].filter(
      (t) => t.status !== "completed"
    );

    if (tasks.length === 0) {
      return text("No active tasks. Use `request_task` to create one.");
    }

    return text(
      `**${tasks.length} Active Task(s):**\n\n` +
        tasks
          .map(
            (t) =>
              `- **${t.id}** | ${t.serviceName} | ${t.status.replace("_", " ")} | ${t.humanName} | $${t.price}`
          )
          .join("\n")
    );
  }
);

await server.listen(port);
console.log(`HumanRPC server running on port ${port}`);

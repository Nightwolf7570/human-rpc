import { MCPServer, widget, text } from "mcp-use/server";
import { z } from "zod";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const server = new MCPServer({
  name: "human-rpc",
  title: "HumanRPC",
  version: "2.0.0",
  description:
    "Remote Procedure Calls to Real Humans. A two-sided marketplace where AI agents post physical-world tasks and vetted human workers complete them. Supports task creation, worker matching, hiring, proof submission, and review/payment.",
  host: process.env.HOST ?? "0.0.0.0",
  baseUrl: process.env.MCP_URL ?? `http://localhost:${port}`,
});

// ─── Data Layer ──────────────────────────────────────────────────────────────

interface Worker {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  completedTasks: number;
  skills: string[];
  location: string;
  tokenRate: number;
  available: boolean;
  responseTime: string;
  bio: string;
  verified: boolean;
}

const WORKERS: Worker[] = [
  {
    id: "w-001",
    name: "Sarah Kim",
    avatar: "SK",
    rating: 4.9,
    completedTasks: 347,
    skills: ["Photography", "Real Estate", "Inspections"],
    location: "San Francisco, CA",
    tokenRate: 35,
    available: true,
    responseTime: "< 15 min",
    bio: "Professional photographer with 5 years of real estate experience. Own DSLR + drone.",
    verified: true,
  },
  {
    id: "w-002",
    name: "Marcus Thompson",
    avatar: "MT",
    rating: 4.8,
    completedTasks: 512,
    skills: ["Delivery", "Errands", "Queue Waiting", "Shopping"],
    location: "San Francisco, CA",
    tokenRate: 25,
    available: true,
    responseTime: "< 10 min",
    bio: "Reliable runner. Have a car and bike. Available most days 8am-8pm.",
    verified: true,
  },
  {
    id: "w-003",
    name: "Priya Sharma",
    avatar: "PS",
    rating: 4.7,
    completedTasks: 189,
    skills: ["Marketing", "Flyering", "Event Staffing", "Street Teams"],
    location: "Oakland, CA",
    tokenRate: 28,
    available: true,
    responseTime: "< 30 min",
    bio: "Marketing student at UC Berkeley. Great with people, always on time.",
    verified: true,
  },
  {
    id: "w-004",
    name: "Jake Rivera",
    avatar: "JR",
    rating: 4.6,
    completedTasks: 94,
    skills: ["Installation", "Hardware", "Assembly", "Signage"],
    location: "San Jose, CA",
    tokenRate: 45,
    available: true,
    responseTime: "< 1 hour",
    bio: "Handyman with full tool kit. Electrical, mounting, assembly, you name it.",
    verified: true,
  },
  {
    id: "w-005",
    name: "Aisha Morales",
    avatar: "AM",
    rating: 4.9,
    completedTasks: 276,
    skills: ["Mystery Shopping", "Research", "Inspections", "Documentation"],
    location: "Palo Alto, CA",
    tokenRate: 30,
    available: false,
    responseTime: "< 2 hours",
    bio: "Detail-oriented researcher. Excellent written reports with photo evidence.",
    verified: true,
  },
  {
    id: "w-006",
    name: "Tom Walsh",
    avatar: "TW",
    rating: 4.5,
    completedTasks: 631,
    skills: ["Delivery", "Errands", "Queue Waiting", "Notarization"],
    location: "San Francisco, CA",
    tokenRate: 22,
    available: true,
    responseTime: "< 5 min",
    bio: "Full-time gig worker. Fastest response time on the platform. Never missed a deadline.",
    verified: true,
  },
  {
    id: "w-007",
    name: "Luna Chen",
    avatar: "LC",
    rating: 4.8,
    completedTasks: 158,
    skills: ["Photography", "Videography", "Social Media", "Marketing"],
    location: "Berkeley, CA",
    tokenRate: 40,
    available: true,
    responseTime: "< 20 min",
    bio: "Content creator & photographer. Specialize in property tours and product shots.",
    verified: true,
  },
  {
    id: "w-008",
    name: "Diego Fuentes",
    avatar: "DF",
    rating: 4.4,
    completedTasks: 82,
    skills: ["Billboard", "Advertising", "Signage", "Negotiations"],
    location: "San Francisco, CA",
    tokenRate: 50,
    available: true,
    responseTime: "< 1 hour",
    bio: "Former ad sales rep. Know every billboard vendor in the Bay Area.",
    verified: true,
  },
];

type TaskStatus =
  | "open"
  | "matching"
  | "hired"
  | "in_progress"
  | "proof_submitted"
  | "approved"
  | "disputed"
  | "completed";

interface Task {
  id: string;
  title: string;
  category: string;
  location: string;
  instructions: string;
  budget: number;
  deadline: string;
  status: TaskStatus;
  createdAt: string;
  workerId: string | null;
  workerName: string | null;
  proof: { type: string; url: string; notes: string } | null;
  timeline: { time: string; event: string; actor: string }[];
  pointsEscrowed: number;
  pointsPaid: number;
}

const TASKS = new Map<string, Task>();
let taskSeq = 1000;

const TASK_CATEGORIES = [
  "Photography & Inspection",
  "Delivery & Pickup",
  "Marketing & Flyering",
  "Errands & Shopping",
  "Queue Waiting",
  "Installation & Hardware",
  "Mystery Shopping & Research",
  "Billboard & Advertising",
  "Event Staffing",
  "Document & Legal",
];

function generateId(): string {
  return `HRPC-${++taskSeq}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Tool: create_task ───────────────────────────────────────────────────────

server.tool(
  {
    name: "create_task",
    description:
      "Create a new task for a human worker to complete. IMPORTANT: The 'instructions' field is shown directly to a HUMAN worker, not an AI. Keep instructions short (3-5 bullet points max), casual, and in plain English. Do NOT write overly detailed robotic instructions. Example: '- Take 10 exterior photos of the house\\n- Include front, back, sides, and roof\\n- Upload to Google Drive and share the link'. Workers are experienced humans who understand context.",
    schema: z.object({
      title: z.string().describe("Short title, max 10 words (e.g. 'Photograph house at 123 Main St')"),
      category: z
        .string()
        .describe(
          `Task category. One of: ${TASK_CATEGORIES.join(", ")}`
        ),
      location: z.string().describe("Physical address or area where the task takes place"),
      instructions: z
        .string()
        .describe("Brief, casual instructions for a human worker. 3-5 bullet points MAX. Write like you're texting a friend, not programming a robot. Workers are smart humans who don't need every detail spelled out."),
      budget: z
        .number()
        .describe("Budget in points (1 point = ~$1 USD). Workers see this amount."),
      deadline: z
        .string()
        .describe("Simple deadline like 'Today by 5pm' or 'Within 4 hours' or 'Tomorrow morning'"),
    }) as any,
    widget: {
      name: "new-task",
      invoking: "Creating task...",
      invoked: "Task created",
    },
  },
  async ({ title, category, location, instructions, budget, deadline }) => {
    const id = generateId();
    const task: Task = {
      id,
      title,
      category,
      location,
      instructions,
      budget,
      deadline,
      status: "open",
      createdAt: now(),
      workerId: null,
      workerName: null,
      proof: null,
      timeline: [
        { time: now(), event: "Task created", actor: "AI Agent" },
        { time: now(), event: `${budget} points escrowed`, actor: "System" },
      ],
      pointsEscrowed: budget,
      pointsPaid: 0,
    };

    TASKS.set(id, task);

    return widget({
      props: { task, matchCount: matchWorkers(category, location).length },
      output: text(
        `Task **${id}** created!\n\n` +
          `**${title}**\n` +
          `Category: ${category}\n` +
          `Location: ${location}\n` +
          `Budget: ${budget} pts | Deadline: ${deadline}\n\n` +
          `${matchWorkers(category, location).length} workers available. Use \`list_workers\` to see matches.`
      ),
    });
  }
);

// ─── Tool: list_workers ──────────────────────────────────────────────────────

function matchWorkers(category: string, location: string, budget?: number): Worker[] {
  const categorySkillMap: Record<string, string[]> = {
    "Photography & Inspection": ["Photography", "Inspections", "Real Estate"],
    "Delivery & Pickup": ["Delivery", "Errands"],
    "Marketing & Flyering": ["Marketing", "Flyering", "Street Teams"],
    "Errands & Shopping": ["Errands", "Shopping", "Queue Waiting"],
    "Queue Waiting": ["Queue Waiting", "Errands"],
    "Installation & Hardware": ["Installation", "Hardware", "Assembly", "Signage"],
    "Mystery Shopping & Research": ["Mystery Shopping", "Research", "Documentation"],
    "Billboard & Advertising": ["Billboard", "Advertising", "Signage", "Negotiations"],
    "Event Staffing": ["Event Staffing", "Marketing", "Street Teams"],
    "Document & Legal": ["Notarization", "Documentation", "Errands"],
  };

  const relevantSkills = categorySkillMap[category] ?? [];

  return WORKERS.filter((w) => {
    const hasSkill =
      relevantSkills.length === 0 ||
      w.skills.some((s) => relevantSkills.includes(s));
    const withinBudget = budget === undefined || w.tokenRate <= budget;
    return hasSkill && w.available && withinBudget;
  }).sort((a, b) => b.rating - a.rating);
}

server.tool(
  {
    name: "list_workers",
    description:
      "List available workers who can complete a task. Filters by task category and location. Shows ratings, skills, pricing, and availability. Use this to find candidates before hiring.",
    schema: z.object({
      task_id: z
        .string()
        .optional()
        .describe("Task ID to match workers for (auto-filters by task category)"),
      category: z
        .string()
        .optional()
        .describe("Manual category filter (overrides task_id)"),
      location: z.string().optional().describe("Location preference"),
    }) as any,
    widget: {
      name: "worker-match",
      invoking: "Finding workers...",
      invoked: "Workers found",
    },
  },
  async ({ task_id, category, location }) => {
    let cat = category ?? "";
    let loc = location ?? "";
    let budget: number | undefined;
    let task: Task | undefined;

    if (task_id) {
      task = TASKS.get(task_id);
      if (task) {
        cat = cat || task.category;
        loc = loc || task.location;
        budget = task.budget;
      }
    }

    const workers = matchWorkers(cat, loc, budget);

    return widget({
      props: {
        workers,
        taskId: task_id ?? null,
        taskTitle: task?.title ?? null,
        category: cat,
        budget: budget ?? null,
      },
      output: text(
        `**${workers.length} workers** available${cat ? ` for "${cat}"` : ""}:\n\n` +
          workers
            .map(
              (w) =>
                `- **${w.name}** (${w.id}) | ${w.rating} stars | ${w.completedTasks} tasks | ${w.tokenRate} tokens | ${w.responseTime}\n  Skills: ${w.skills.join(", ")}`
            )
            .join("\n") +
          (task_id ? `\n\nUse \`hire_worker\` with task_id="${task_id}" and worker_id to hire.` : "")
      ),
    });
  }
);

// ─── Tool: hire_worker ───────────────────────────────────────────────────────

server.tool(
  {
    name: "hire_worker",
    description:
      "Hire a specific worker for a task. The worker is notified and the task moves to 'hired' status. Points are held in escrow until task completion.",
    schema: z.object({
      task_id: z.string().describe("Task ID"),
      worker_id: z.string().describe("Worker ID to hire (e.g. w-001)"),
    }) as any,
  },
  async ({ task_id, worker_id }) => {
    const task = TASKS.get(task_id);
    if (!task) return text(`Task "${task_id}" not found.`);
    if (task.status !== "open" && task.status !== "matching")
      return text(`Task ${task_id} is already in status "${task.status}" and cannot be assigned.`);

    const worker = WORKERS.find((w) => w.id === worker_id);
    if (!worker) return text(`Worker "${worker_id}" not found.`);
    if (!worker.available) return text(`${worker.name} is currently unavailable.`);

    task.status = "hired";
    task.workerId = worker.id;
    task.workerName = worker.name;
    task.timeline.push(
      { time: now(), event: `${worker.name} hired for the task`, actor: "AI Agent" },
      { time: now(), event: `Notification sent to ${worker.name}`, actor: "System" }
    );

    return text(
      `**${worker.name}** has been hired for task **${task_id}**!\n\n` +
        `**Task:** ${task.title}\n` +
        `**Worker:** ${worker.name} (${worker.rating} stars, ${worker.completedTasks} completed)\n` +
        `**Budget:** ${task.budget} pts (escrowed)\n` +
        `**Response time:** ${worker.responseTime}\n\n` +
        `The worker has been notified. Use \`get_task_status\` to track progress.`
    );
  }
);

// ─── Tool: submit_proof ──────────────────────────────────────────────────────

server.tool(
  {
    name: "submit_proof",
    description:
      "Submit proof of task completion. Workers provide links to photos/files and notes about the work done. Moves the task to 'proof_submitted' for review.",
    schema: z.object({
      task_id: z.string().describe("Task ID"),
      proof_url: z
        .string()
        .describe("URL to proof (photos, documents, files). Can be a Google Drive link, Dropbox, etc."),
      notes: z
        .string()
        .describe("Worker's notes about the completed work, any issues encountered, etc."),
    }) as any,
  },
  async ({ task_id, proof_url, notes }) => {
    const task = TASKS.get(task_id);
    if (!task) return text(`Task "${task_id}" not found.`);
    if (task.status !== "hired" && task.status !== "in_progress")
      return text(`Task ${task_id} is in status "${task.status}". Can only submit proof for hired/in_progress tasks.`);

    task.status = "proof_submitted";
    task.proof = { type: "url", url: proof_url, notes };
    task.timeline.push(
      { time: now(), event: `Proof submitted by ${task.workerName}`, actor: task.workerName ?? "Worker" },
      { time: now(), event: "Awaiting AI agent review", actor: "System" },
    );

    return text(
      `Proof submitted for task **${task_id}**!\n\n` +
        `**Proof:** ${proof_url}\n` +
        `**Notes:** ${notes}\n\n` +
        `Use \`review_and_pay\` to approve or request changes.`
    );
  }
);

// ─── Tool: review_and_pay ────────────────────────────────────────────────────

server.tool(
  {
    name: "review_and_pay",
    description:
      "Review completed work and approve/reject. If approved, escrowed points are released to the worker. If rejected, provide feedback for the worker to retry.",
    schema: z.object({
      task_id: z.string().describe("Task ID to review"),
      approve: z
        .boolean()
        .describe("true to approve and pay, false to request changes"),
      feedback: z
        .string()
        .optional()
        .describe("Feedback for the worker (required if rejecting)"),
      tip_points: z
        .number()
        .optional()
        .describe("Optional tip in points on top of the budget"),
    }) as any,
  },
  async ({ task_id, approve, feedback, tip_points }) => {
    const task = TASKS.get(task_id);
    if (!task) return text(`Task "${task_id}" not found.`);
    if (task.status !== "proof_submitted")
      return text(`Task ${task_id} is in status "${task.status}". Can only review tasks with submitted proof.`);

    if (approve) {
      const tip = tip_points ?? 0;
      const totalPaid = task.budget + tip;
      task.status = "completed";
      task.pointsPaid = totalPaid;
      task.timeline.push(
        { time: now(), event: `Work approved by AI Agent`, actor: "AI Agent" },
        {
          time: now(),
          event: `${totalPaid} pts released to ${task.workerName}${tip > 0 ? ` (includes ${tip} pt tip)` : ""}`,
          actor: "System",
        },
        { time: now(), event: "Task completed", actor: "System" },
      );

      return text(
        `Task **${task_id}** approved and paid!\n\n` +
          `**Paid:** ${totalPaid} pts to ${task.workerName}${tip > 0 ? ` (${task.budget} + ${tip} tip)` : ""}\n` +
          `**Status:** Completed\n\n` +
          `Thank you for using HumanRPC!`
      );
    } else {
      task.status = "hired";
      task.proof = null;
      task.timeline.push(
        {
          time: now(),
          event: `Changes requested: ${feedback ?? "No specific feedback"}`,
          actor: "AI Agent",
        },
        { time: now(), event: `${task.workerName} notified of required changes`, actor: "System" },
      );

      return text(
        `Changes requested for task **${task_id}**.\n\n` +
          `**Feedback:** ${feedback ?? "Not specified"}\n` +
          `**Status:** Sent back to ${task.workerName} for revision.\n\n` +
          `The worker will resubmit proof after making changes.`
      );
    }
  }
);

// ─── Tool: get_task_status ───────────────────────────────────────────────────

server.tool(
  {
    name: "get_task_status",
    description:
      "Get the full status of a task including timeline, worker info, proof, and payment status. Shows an interactive task detail widget.",
    schema: z.object({
      task_id: z.string().describe("Task ID (e.g. HRPC-1001)"),
    }) as any,
    widget: {
      name: "task-detail",
      invoking: "Loading task...",
      invoked: "Task loaded",
    },
  },
  async ({ task_id }) => {
    const task = TASKS.get(task_id);
    if (!task)
      return text(`Task "${task_id}" not found.`);

    // Simulate progress for demo
    if (task.status === "hired") {
      task.status = "in_progress";
      task.timeline.push({
        time: now(),
        event: `${task.workerName} started working on the task`,
        actor: task.workerName ?? "Worker",
      });
    }

    const worker = task.workerId ? WORKERS.find((w) => w.id === task.workerId) : null;

    return widget({
      props: { task, worker },
      output: text(
        `**Task ${task.id}: ${task.title}**\n\n` +
          `**Status:** ${task.status.replace(/_/g, " ").toUpperCase()}\n` +
          `**Category:** ${task.category}\n` +
          `**Location:** ${task.location}\n` +
          `**Budget:** ${task.budget} pts | **Paid:** ${task.pointsPaid} pts\n` +
          (task.workerName ? `**Worker:** ${task.workerName}\n` : "**Worker:** Not assigned\n") +
          (task.proof ? `**Proof:** ${task.proof.url}\n**Notes:** ${task.proof.notes}\n` : "") +
          `\n**Timeline:**\n` +
          task.timeline.map((t) => `- [${t.actor}] ${t.event}`).join("\n")
      ),
    });
  }
);

// ─── Tool: list_tasks ────────────────────────────────────────────────────────

server.tool(
  {
    name: "list_tasks",
    description: "List all tasks with their current status, worker, and budget.",
    schema: z.object({
      status: z
        .string()
        .optional()
        .describe("Filter by status: open, matching, hired, in_progress, proof_submitted, approved, completed"),
    }) as any,
  },
  async ({ status }) => {
    const all = [...TASKS.values()];
    const filtered = status
      ? all.filter((t) => t.status === status)
      : all;

    if (filtered.length === 0)
      return text(status ? `No tasks with status "${status}".` : "No tasks yet. Use `create_task` to get started.");

    return text(
      `**${filtered.length} task(s)${status ? ` (${status})` : ""}:**\n\n` +
        filtered
          .map(
            (t) =>
              `- **${t.id}** | ${t.title} | ${t.status.replace(/_/g, " ")} | ${t.workerName ?? "unassigned"} | ${t.budget} pts`
          )
          .join("\n")
    );
  }
);

// ─── Tool: cancel_task ───────────────────────────────────────────────────────

server.tool(
  {
    name: "cancel_task",
    description: "Cancel an open or hired task. Escrowed points are refunded. Cannot cancel tasks that are already in progress or completed.",
    schema: z.object({
      task_id: z.string().describe("Task ID to cancel"),
      reason: z.string().optional().describe("Reason for cancellation"),
    }) as any,
  },
  async ({ task_id, reason }) => {
    const task = TASKS.get(task_id);
    if (!task) return text(`Task "${task_id}" not found.`);
    if (task.status === "in_progress" || task.status === "completed")
      return text(`Cannot cancel task ${task_id} — it's already ${task.status.replace(/_/g, " ")}.`);

    const refund = task.pointsEscrowed;
    task.status = "completed";
    task.pointsEscrowed = 0;
    task.timeline.push(
      { time: now(), event: `Task cancelled${reason ? `: ${reason}` : ""}`, actor: "AI Agent" },
      { time: now(), event: `${refund} pts refunded`, actor: "System" },
    );

    return text(
      `Task **${task_id}** cancelled.\n\n` +
        `**Refunded:** ${refund} pts\n` +
        (reason ? `**Reason:** ${reason}` : "")
    );
  }
);

// ─── Tool: rate_worker ───────────────────────────────────────────────────────

server.tool(
  {
    name: "rate_worker",
    description: "Rate a worker after task completion. Provide a 1-5 star rating and optional review.",
    schema: z.object({
      task_id: z.string().describe("Completed task ID"),
      rating: z.number().describe("Rating from 1 to 5 stars"),
      review: z.string().optional().describe("Optional written review"),
    }) as any,
  },
  async ({ task_id, rating, review }) => {
    const task = TASKS.get(task_id);
    if (!task) return text(`Task "${task_id}" not found.`);
    if (task.status !== "completed")
      return text(`Can only rate workers on completed tasks. Task ${task_id} is "${task.status}".`);

    const worker = WORKERS.find((w) => w.id === task.workerId);
    if (worker) {
      // Update worker's rating (weighted average simulation)
      worker.rating = +((worker.rating * worker.completedTasks + rating) / (worker.completedTasks + 1)).toFixed(1);
      worker.completedTasks += 1;
    }

    task.timeline.push({
      time: now(),
      event: `Rated ${task.workerName} ${rating}/5 stars${review ? ` — "${review}"` : ""}`,
      actor: "AI Agent",
    });

    return text(
      `Rated **${task.workerName}** ${"\u2B50".repeat(rating)} (${rating}/5)\n\n` +
        (review ? `**Review:** "${review}"\n\n` : "") +
        `Thank you! This helps other AI agents find great workers.`
    );
  }
);

await server.listen(port);
console.log(`HumanRPC v2 server running on port ${port}`);

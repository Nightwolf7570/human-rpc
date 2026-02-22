import { MCPServer, widget, text } from "mcp-use/server";
import { z } from "zod";
import { Resend } from "resend";
import twilio from "twilio";
import crypto from "crypto";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const baseUrl = process.env.MCP_URL ?? `http://localhost:${port}`;

// Response tokens for worker accept/decline email flow
const RESPONSE_TOKENS = new Map<string, { taskId: string; workerId: string }>();

// ─── Notifications ──────────────────────────────────────────────────────────

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getTwilio() {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return null;
  return { client: twilio(sid, token), from };
}

async function notifyWorker(worker: Worker, task: Task, responseToken?: string): Promise<{ sms: string; email: string }> {
  const results = { sms: "skipped", email: "skipped" };

  // SMS via Twilio
  const tw = getTwilio();
  if (tw && worker.phone) {
    try {
      await tw.client.messages.create({
        body: `HumanRPC: You've been hired!\n\nTask: ${task.title}\nLocation: ${task.location}\nDeadline: ${task.deadline}\nBudget: ${task.budget} pts\n\nInstructions:\n${task.instructions}\n\nTask ID: ${task.id}\n\nReply to this text or check your email to accept or decline.`,
        from: tw.from,
        to: worker.phone,
      });
      results.sms = `sent to ${worker.phone}`;
    } catch (err: any) {
      results.sms = `failed: ${err.message ?? "unknown"}`;
    }
  }

  // Email via Resend
  const resend = getResend();
  if (resend && worker.email) {
    try {
      await resend.emails.send({
        from: "HumanRPC <onboarding@resend.dev>",
        to: [worker.email],
        subject: `You're hired: ${task.title}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#111;margin-bottom:4px">You've been hired!</h2>
            <p style="color:#666;font-size:14px;margin-top:0">A new task is waiting for you on HumanRPC.</p>
            <div style="background:#fafafa;border-radius:10px;padding:20px;margin:20px 0">
              <div style="font-size:18px;font-weight:700;color:#111;margin-bottom:12px">${task.title}</div>
              <div style="font-size:13px;color:#666;margin-bottom:6px"><strong>Category:</strong> ${task.category}</div>
              <div style="font-size:13px;color:#666;margin-bottom:6px"><strong>Location:</strong> ${task.location}</div>
              <div style="font-size:13px;color:#666;margin-bottom:6px"><strong>Deadline:</strong> ${task.deadline}</div>
              <div style="font-size:13px;color:#666;margin-bottom:6px"><strong>Budget:</strong> ${task.budget} points</div>
            </div>
            <div style="margin-bottom:20px">
              <div style="font-size:12px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Instructions</div>
              <div style="font-size:14px;color:#333;line-height:1.6;white-space:pre-line">${task.instructions}</div>
            </div>
            ${responseToken ? `
            <div style="margin-bottom:20px;text-align:center">
              <div style="font-size:12px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">Do you accept this job?</div>
              <a href="${baseUrl}/api/worker-response?token=${responseToken}&action=accept" style="display:inline-block;padding:14px 32px;background:#22c55e;border-radius:8px;color:#fff;font-weight:700;font-size:16px;text-decoration:none;margin-right:12px">Accept Job</a>
              <a href="${baseUrl}/api/worker-response?token=${responseToken}&action=decline" style="display:inline-block;padding:14px 32px;background:#ef4444;border-radius:8px;color:#fff;font-weight:700;font-size:16px;text-decoration:none">Decline</a>
            </div>` : ""}
            <div style="text-align:center;padding:16px;background:#111;border-radius:8px">
              <span style="color:#fff;font-weight:700;font-size:14px">Task ID: ${task.id}</span>
            </div>
            <p style="font-size:12px;color:#aaa;text-align:center;margin-top:20px">HumanRPC — Remote Procedure Calls to Real Humans</p>
          </div>`,
      });
      results.email = `sent to ${worker.email}`;
    } catch (err: any) {
      results.email = `failed: ${err.message ?? "unknown"}`;
    }
  }

  return results;
}

// ─── Dropbox ────────────────────────────────────────────────────────────────

function getDropboxToken(): string | null {
  return process.env.DROPBOX_ACCESS_TOKEN ?? null;
}

async function createDropboxFileRequest(taskId: string, taskTitle: string): Promise<{ url: string; path: string } | null> {
  const token = getDropboxToken();
  if (!token) return null;

  const destPath = `/HumanRPC/${taskId}`;

  try {
    const res = await fetch("https://api.dropboxapi.com/2/file_requests/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `${taskId}: ${taskTitle}`,
        destination: destPath,
        open: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Dropbox file request failed:", err);
      return null;
    }

    const data = await res.json() as { url: string };
    return { url: data.url, path: destPath };
  } catch (err) {
    console.error("Dropbox file request error:", err);
    return null;
  }
}

async function listDropboxFiles(path: string): Promise<{ name: string; size: number; modified: string }[]> {
  const token = getDropboxToken();
  if (!token) return [];

  try {
    const res = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ path, recursive: false }),
    });

    if (!res.ok) return [];

    const data = await res.json() as { entries: { ".tag": string; name: string; size: number; client_modified: string }[] };
    return data.entries
      .filter((e) => e[".tag"] === "file")
      .map((e) => ({ name: e.name, size: e.size, modified: e.client_modified }));
  } catch {
    return [];
  }
}

// ─── Server ─────────────────────────────────────────────────────────────────

const server = new MCPServer({
  name: "human-rpc",
  title: "HumanRPC",
  version: "2.0.0",
  description:
    "Remote Procedure Calls to Real Humans. A two-sided marketplace where AI agents post physical-world tasks and vetted human workers complete them. Supports task creation, worker matching, hiring, proof submission, and review/payment.",
  host: process.env.HOST ?? "0.0.0.0",
  baseUrl,
});

// ─── Data Layer ──────────────────────────────────────────────────────────────

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  rating: number;
  completedTasks: number;
  skills: string[];
  location: string;
  hourlyRate: number;
  available: boolean;
  responseTime: string;
  bio: string;
  verified: boolean;
}

const WORKERS: Worker[] = [];
let workerSeq = 0;

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
  dropboxUploadUrl: string | null;
  dropboxPath: string | null;
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

// ─── Tool: add_worker ────────────────────────────────────────────────────────

server.tool(
  {
    name: "add_worker",
    description:
      "Register a new worker on the platform. Requires name, email, and phone number so they can receive task notifications via SMS and email.",
    schema: z.object({
      name: z.string().describe("Worker's full name"),
      email: z.string().describe("Worker's email address (required for notifications)"),
      phone: z.string().describe("Worker's phone number with country code (e.g. +14155551234)"),
      skills: z.array(z.string()).describe("List of skills (e.g. ['Photography', 'Delivery'])"),
      location: z.string().describe("Worker's city/area"),
      hourly_rate: z.number().describe("Hourly rate in USD"),
      bio: z.string().describe("Short bio (1-2 sentences)"),
    }) as any,
  },
  async ({ name, email, phone, skills, location, hourly_rate, bio }) => {
    const id = `w-${String(++workerSeq).padStart(3, "0")}`;
    const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
    const worker: Worker = {
      id,
      name,
      email,
      phone,
      avatar: initials,
      rating: 5.0,
      completedTasks: 0,
      skills,
      location,
      hourlyRate: hourly_rate,
      available: true,
      responseTime: "New",
      bio,
      verified: false,
    };
    WORKERS.push(worker);

    return text(
      `Worker **${name}** registered!\n\n` +
        `**ID:** ${id}\n` +
        `**Email:** ${email}\n` +
        `**Phone:** ${phone}\n` +
        `**Skills:** ${skills.join(", ")}\n` +
        `**Rate:** $${hourly_rate}/hr\n\n` +
        `They will receive SMS + email notifications when hired for tasks.`
    );
  }
);

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
      dropboxUploadUrl: null,
      dropboxPath: null,
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

function matchWorkers(category: string, location: string): Worker[] {
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
    return hasSkill && w.available;
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
    let task: Task | undefined;

    if (task_id) {
      task = TASKS.get(task_id);
      if (task) {
        cat = cat || task.category;
        loc = loc || task.location;
      }
    }

    const workers = matchWorkers(cat, loc);

    return widget({
      props: {
        workers,
        taskId: task_id ?? null,
        taskTitle: task?.title ?? null,
        category: cat,
      },
      output: text(
        `**${workers.length} workers** available${cat ? ` for "${cat}"` : ""}:\n\n` +
          workers
            .map(
              (w) =>
                `- **${w.name}** (${w.id}) | ${w.rating} stars | ${w.completedTasks} tasks | $${w.hourlyRate}/hr | ${w.responseTime}\n  Skills: ${w.skills.join(", ")}`
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
      "Hire a specific worker for a task. The worker is notified via SMS and email. The task moves to 'hired' status. Points are held in escrow until task completion.",
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
    );

    // Generate response token for accept/decline flow
    const responseToken = crypto.randomUUID();
    RESPONSE_TOKENS.set(responseToken, { taskId: task_id, workerId: worker.id });

    // Send notifications (include accept/decline links)
    const notify = await notifyWorker(worker, task, responseToken);

    if (notify.sms !== "skipped") {
      task.timeline.push({ time: now(), event: `SMS ${notify.sms}`, actor: "System" });
    }
    if (notify.email !== "skipped") {
      task.timeline.push({ time: now(), event: `Email ${notify.email}`, actor: "System" });
    }
    if (notify.sms === "skipped" && notify.email === "skipped") {
      task.timeline.push({ time: now(), event: `Notification sent to ${worker.name}`, actor: "System" });
    }

    return text(
      `**${worker.name}** has been hired for task **${task_id}**!\n\n` +
        `**Task:** ${task.title}\n` +
        `**Worker:** ${worker.name} (${worker.rating} stars, ${worker.completedTasks} completed)\n` +
        `**Budget:** ${task.budget} pts (escrowed)\n` +
        `**Response time:** ${worker.responseTime}\n` +
        `**SMS:** ${notify.sms}\n` +
        `**Email:** ${notify.email}\n\n` +
        `Waiting for worker to **accept or decline** via email. Use \`get_task_status\` to check their response.`
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

// ─── Tool: check_uploads ─────────────────────────────────────────────────────

server.tool(
  {
    name: "check_uploads",
    description:
      "Check what files a worker has uploaded to Dropbox for a task. Use this to verify proof of work before approving payment.",
    schema: z.object({
      task_id: z.string().describe("Task ID to check uploads for"),
    }) as any,
  },
  async ({ task_id }) => {
    const task = TASKS.get(task_id);
    if (!task) return text(`Task "${task_id}" not found.`);

    if (!task.dropboxPath) {
      return text(
        `No Dropbox folder for task **${task_id}**.\n\n` +
          (getDropboxToken()
            ? "This task was created before Dropbox was configured."
            : "Set the `DROPBOX_ACCESS_TOKEN` env var to enable Dropbox integration.")
      );
    }

    const files = await listDropboxFiles(task.dropboxPath);

    if (files.length === 0) {
      return text(
        `No files uploaded yet for task **${task_id}**.\n\n` +
          `**Upload link:** ${task.dropboxUploadUrl}\n` +
          `Share this link with the worker if they haven't received it.`
      );
    }

    return text(
      `**${files.length} file(s)** uploaded for task **${task_id}**:\n\n` +
        files
          .map((f) => `- **${f.name}** (${(f.size / 1024).toFixed(1)} KB) — ${new Date(f.modified).toLocaleString()}`)
          .join("\n") +
        `\n\n**Dropbox folder:** ${task.dropboxPath}\n` +
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

// ─── Worker Accept/Decline Route ─────────────────────────────────────────

server.app.get("/api/worker-response", async (c) => {
  const token = c.req.query("token");
  const action = c.req.query("action");

  if (!token || !action || (action !== "accept" && action !== "decline")) {
    return c.html("<h2>Invalid link.</h2>", 400);
  }

  const entry = RESPONSE_TOKENS.get(token);
  if (!entry) {
    return c.html(
      `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;text-align:center;padding:32px">
        <h2 style="color:#111">Link Expired</h2>
        <p style="color:#666">This link has already been used or is no longer valid.</p>
      </div>`
    );
  }

  const task = TASKS.get(entry.taskId);
  const worker = WORKERS.find((w) => w.id === entry.workerId);
  RESPONSE_TOKENS.delete(token);

  if (!task || !worker) {
    return c.html("<h2>Task or worker not found.</h2>", 404);
  }

  if (action === "accept") {
    task.status = "in_progress";
    task.timeline.push({
      time: now(),
      event: `${worker.name} accepted the job`,
      actor: worker.name,
    });

    // Create Dropbox file request now that worker accepted
    const dbx = await createDropboxFileRequest(entry.taskId, task.title);
    if (dbx) {
      task.dropboxUploadUrl = dbx.url;
      task.dropboxPath = dbx.path;
      task.timeline.push({ time: now(), event: `Dropbox upload link created`, actor: "System" });
    } else {
      console.error("Dropbox file request failed for task", entry.taskId);
    }

    // Send follow-up email with Dropbox upload link and full instructions
    const resend = getResend();
    if (resend && worker.email) {
      try {
        await resend.emails.send({
          from: "HumanRPC <onboarding@resend.dev>",
          to: [worker.email],
          subject: `You're on! Upload proof for: ${task.title}`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <div style="text-align:center;margin-bottom:24px">
                <div style="display:inline-block;width:48px;height:48px;background:#22c55e;border-radius:50%;line-height:48px;font-size:24px;color:#fff">&#10003;</div>
              </div>
              <h2 style="color:#111;text-align:center;margin-bottom:4px">You're on the job!</h2>
              <p style="color:#666;font-size:14px;text-align:center;margin-top:0">Here's everything you need to complete <strong>${task.title}</strong>.</p>
              <div style="background:#fafafa;border-radius:10px;padding:20px;margin:20px 0">
                <div style="font-size:18px;font-weight:700;color:#111;margin-bottom:12px">${task.title}</div>
                <div style="font-size:13px;color:#666;margin-bottom:6px"><strong>Location:</strong> ${task.location}</div>
                <div style="font-size:13px;color:#666;margin-bottom:6px"><strong>Deadline:</strong> ${task.deadline}</div>
                <div style="font-size:13px;color:#666;margin-bottom:6px"><strong>Budget:</strong> ${task.budget} points</div>
                <div style="font-size:13px;color:#666"><strong>Task ID:</strong> ${task.id}</div>
              </div>
              <div style="margin-bottom:20px">
                <div style="font-size:12px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Instructions</div>
                <div style="font-size:14px;color:#333;line-height:1.6;white-space:pre-line">${task.instructions}</div>
              </div>
              ${task.dropboxUploadUrl ? `
              <div style="margin-bottom:20px">
                <div style="font-size:12px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">Upload Your Proof</div>
                <p style="font-size:14px;color:#333;margin:0 0 12px 0">When you're done, upload your photos/files here:</p>
                <a href="${task.dropboxUploadUrl}" style="display:block;text-align:center;padding:16px;background:#0061FF;border-radius:10px;color:#fff;font-weight:700;font-size:16px;text-decoration:none">Upload to Dropbox</a>
              </div>` : ""}
              <div style="background:#fffbeb;border-radius:10px;padding:16px;margin-bottom:20px">
                <div style="font-size:13px;color:#92400e"><strong>Reminder:</strong> Upload your proof before the deadline. Payment is released once the client approves your work.</div>
              </div>
              <p style="font-size:12px;color:#aaa;text-align:center;margin-top:20px">HumanRPC — Remote Procedure Calls to Real Humans</p>
            </div>`,
        });
        task.timeline.push({ time: now(), event: `Proof upload email sent to ${worker.name}`, actor: "System" });
      } catch (err: any) {
        task.timeline.push({ time: now(), event: `Proof upload email failed: ${err.message ?? "unknown"}`, actor: "System" });
      }
    }

    return c.html(
      `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;text-align:center;padding:32px">
        <div style="font-size:48px;margin-bottom:16px">&#9989;</div>
        <h2 style="color:#22c55e">Job Accepted!</h2>
        <p style="color:#666">Thanks, ${worker.name}! You've accepted <strong>${task.title}</strong>.</p>
        <p style="color:#666">Check your email for instructions and the Dropbox upload link.</p>
        <div style="background:#fafafa;border-radius:10px;padding:16px;margin-top:20px;text-align:left">
          <div style="font-size:13px;color:#666;margin-bottom:4px"><strong>Task ID:</strong> ${task.id}</div>
          <div style="font-size:13px;color:#666;margin-bottom:4px"><strong>Deadline:</strong> ${task.deadline}</div>
          <div style="font-size:13px;color:#666"><strong>Budget:</strong> ${task.budget} points</div>
        </div>
        ${task.dropboxUploadUrl ? `
        <a href="${task.dropboxUploadUrl}" style="display:block;text-align:center;padding:14px;background:#0061FF;border-radius:8px;color:#fff;font-weight:700;font-size:14px;text-decoration:none;margin-top:16px">Upload Proof to Dropbox</a>` : ""}
      </div>`
    );
  } else {
    task.status = "open";
    task.workerId = null;
    task.workerName = null;
    task.timeline.push({
      time: now(),
      event: `${worker.name} declined the job`,
      actor: worker.name,
    });

    return c.html(
      `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;text-align:center;padding:32px">
        <div style="font-size:48px;margin-bottom:16px">&#128075;</div>
        <h2 style="color:#ef4444">Job Declined</h2>
        <p style="color:#666">No worries, ${worker.name}. The task <strong>${task.title}</strong> has been released back to the pool.</p>
      </div>`
    );
  }
});

await server.listen(port);
console.log(`HumanRPC v2 server running on port ${port}`);

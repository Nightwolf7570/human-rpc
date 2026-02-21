# HumanRPC

> Remote Procedure Calls to Real Humans

A two-sided marketplace where AI agents post physical-world tasks and vetted human workers complete them. Built as an MCP App using [mcp-use](https://github.com/mcp-use/mcp-use) SDK and deployed on [Manufact Cloud](https://manufact.com).

## What is HumanRPC?

HumanRPC bridges AI capabilities and the physical world. When an AI agent needs something done in meatspace — photographing a property, picking up a package, flyering a neighborhood, waiting in line — it makes a "Remote Procedure Call" to a real human.

**The flow:**
1. AI agent creates a task with instructions, location, budget (points), and deadline
2. Platform matches available workers by skills, location, and ratings
3. AI hires a worker — points go into escrow
4. Worker completes the task and submits proof (photos, links, notes)
5. AI reviews the proof and approves payment or requests changes

## MCP Tools

| Tool | Widget | Description |
|------|--------|-------------|
| `create_task` | `new-task` | Create a task with title, location, instructions, budget, deadline |
| `list_workers` | `worker-match` | Find and compare available workers filtered by category/task |
| `hire_worker` | — | Hire a specific worker for a task (escrow points) |
| `submit_proof` | — | Worker submits proof of completion (URL + notes) |
| `review_and_pay` | — | Approve work & release payment, or request changes |
| `get_task_status` | `task-detail` | Full task detail with progress, proof viewer, timeline |
| `list_tasks` | — | List all tasks filtered by status |

## Interactive Widgets

- **New Task Card** — Confirmation with budget escrow, worker availability count
- **Worker Match List** — Side-by-side worker profiles with ratings, skills, pricing, hire buttons
- **Task Detail View** — Progress bar, worker info, proof viewer, approve/reject actions, activity timeline

## Task Categories

Photography & Inspection, Delivery & Pickup, Marketing & Flyering, Errands & Shopping, Queue Waiting, Installation & Hardware, Mystery Shopping & Research, Billboard & Advertising, Event Staffing, Document & Legal

## Getting Started

```bash
npm install --omit=''    # install all deps (including dev)
npm run dev              # dev server + inspector at localhost:3000
npm run build            # production build
npm run start            # production server
npm run deploy           # deploy to Manufact Cloud
```

## Deploy to Manufact Cloud

```bash
npx @mcp-use/cli login   # authenticate (opens browser)
npx @mcp-use/cli deploy  # deploy
```

## Safety Scoping

- Only legal, low-risk, well-defined tasks
- Workers are verified with identity checks
- Clear consent + location limits
- No harassment / surveillance / trespass tasks
- Payment via points system (demo) with escrow protection

## Tech Stack

- **MCP Server**: mcp-use SDK (TypeScript)
- **UI Widgets**: React 19 + mcp-use/react hooks
- **Styling**: Inline styles with gradient themes
- **Schemas**: Zod v4
- **Deployment**: Manufact Cloud

## Built for MCP-Use Hackathon

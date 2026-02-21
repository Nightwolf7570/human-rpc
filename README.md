# HumanRPC

> Remote Procedure Calls to Real Humans

AI agents can rent human hands to complete physical-world tasks. Built as an MCP App using [mcp-use](https://github.com/mcp-use/mcp-use) SDK and deployed on [Manufact Cloud](https://manufact.com).

## What is HumanRPC?

HumanRPC bridges the gap between AI capabilities and the physical world. When an AI agent needs something done in meatspace — picking up a package, buying a billboard, flyering a neighborhood, waiting in line — it makes a "Remote Procedure Call" to a real human.

## Available Tools

| Tool | Description |
|------|-------------|
| `browse_services` | Browse the catalog of rentable human services with interactive widget UI |
| `request_task` | Request a human to perform a physical task (returns task ID for tracking) |
| `get_quote` | Get pricing breakdown across Standard/Rush/Urgent tiers |
| `track_task` | Real-time task status tracking with timeline |
| `complete_task` | Mark a task as completed |
| `list_active_tasks` | List all active tasks |

## Service Categories

- **Logistics** — Package pickup & delivery
- **Marketing** — Billboard advertising, street flyering
- **Media** — Location photography
- **Personal** — Errand running, queue waiting
- **Events** — On-demand event staffing
- **Technical** — Physical hardware installation
- **Research** — Mystery shopping
- **Legal** — Document notarization

## Getting Started

```bash
npm install
npm run dev     # Dev server with hot reload + inspector at localhost:3000
npm run build   # Production build
npm run start   # Production server
npm run deploy  # Deploy to Manufact Cloud
```

## Tech Stack

- **MCP Server**: mcp-use SDK (TypeScript)
- **UI Widgets**: React 19 with mcp-use/react hooks
- **Styling**: Tailwind CSS
- **Schemas**: Zod v4
- **Deployment**: Manufact Cloud

## Built for MCP-Use Hackathon

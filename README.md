# Agents MCP Server

An MCP server that serves agent definitions from markdown files.

## Setup

```bash
npm install
```

### Claude Code CLI

```bash
claude mcp add agents-mcp node /path/to/mcp-agents-server/server.js
```

### Manual

Add to your MCP config:

```json
{
  "mcpServers": {
    "agents-mcp": {
      "command": "node",
      "args": ["/path/to/mcp-agents-server/server.js"]
    }
  }
}
```

## Configuration

Edit `agents.config.json` to point to your agents directory:

```json
{
  "agentsDir": "./agents"
}
```

Supports relative paths, absolute paths, and `~` for home directory.

### Keeping Agents Private

By default, agents are stored in `./agents` within the project. If you'd prefer to keep your agents local to your machine rather than committed to the repo, you have a couple options:

**Point to a local directory** by updating `agents.config.json`:

```json
{
  "agentsDir": "~/.claude/agents"
}
```

**Or keep using `./agents` but add it to `.gitignore`:**

```
agents/
```

This way each collaborator can have their own agents without affecting the shared repo.

## Creating Agents

Add `.md` files to your agents directory. Each file defines an agent. See `agents/hello-world.md` for an example.

## Tools

- **list_agents** — lists all available agents
- **read_agent** — reads the content of a specific agent by name

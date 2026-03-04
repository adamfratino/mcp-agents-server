import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getAgentsDir() {
  const configPath = path.join(__dirname, "agents.config.json");
  let agentsDir = "./agents";

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (config.agentsDir) agentsDir = config.agentsDir;
  }

  if (agentsDir.startsWith("~")) {
    agentsDir = path.join(os.homedir(), agentsDir.slice(2));
  }

  return path.resolve(__dirname, agentsDir);
}

const AGENTS_DIR = getAgentsDir();

const server = new Server(
  {
    name: "agents-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_agent",
        description:
          "Read and return the full content of a specific agent markdown file",
        inputSchema: {
          type: "object",
          properties: {
            agent_name: {
              type: "string",
              description:
                'The name of the agent file (without .md extension). E.g., "ticket-groomer"',
            },
          },
          required: ["agent_name"],
        },
      },
      {
        name: "list_agents",
        description: "List all available agents in the agents directory",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "read_agent") {
    const agentName = args.agent_name;
    const filePath = path.join(AGENTS_DIR, `${agentName}.md`);

    if (!fs.existsSync(filePath)) {
      return {
        content: [
          {
            type: "text",
            text: `Error: Agent "${agentName}" not found. Use list_agents to see available agents.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (err) {
      return {
        content: [
          { type: "text", text: `Error reading agent: ${err.message}` },
        ],
        isError: true,
      };
    }
  }

  if (name === "list_agents") {
    if (!fs.existsSync(AGENTS_DIR)) {
      return {
        content: [
          {
            type: "text",
            text: `Agents directory not found at ${AGENTS_DIR}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const files = fs.readdirSync(AGENTS_DIR);
      const agents = files
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(".md", ""));

      if (agents.length === 0) {
        return {
          content: [
            { type: "text", text: `No agents found in ${AGENTS_DIR}` },
          ],
        };
      }

      const agentList = agents.map((a) => `- ${a}`).join("\n");
      return {
        content: [
          { type: "text", text: `Available agents:\n${agentList}` },
        ],
      };
    } catch (err) {
      return {
        content: [
          { type: "text", text: `Error listing agents: ${err.message}` },
        ],
        isError: true,
      };
    }
  }

  return {
    content: [{ type: "text", text: "Unknown tool" }],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Agents MCP server running on stdio");
}

main().catch(console.error);

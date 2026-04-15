import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z, ZodTypeAny } from 'zod';
import { patientTools } from './tools/patients';
import { appointmentTools } from './tools/appointments';
import {
  documentTools,
  conversationTools,
  chartNoteTools,
  taskTools,
  tagTools,
  providerTools,
} from './tools/clinical';

const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'iwmc-healthie-mcp',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'IWMC Healthie MCP Server',
    version: '2.0.0',
    description: 'Railway-native MCP server for Healthie EHR integration',
    endpoints: { health: '/health', mcp: '/mcp (POST)' },
  });
});

const allTools: Record<string, any> = {
  ...patientTools,
  ...appointmentTools,
  ...documentTools,
  ...conversationTools,
  ...chartNoteTools,
  ...taskTools,
  ...tagTools,
  ...providerTools,
};

function jsonPropToZod(def: any): ZodTypeAny {
  let schema: ZodTypeAny;
  switch (def?.type) {
    case 'string':
      schema = Array.isArray(def.enum) && def.enum.length > 0
        ? z.enum(def.enum as [string, ...string[]])
        : z.string();
      break;
    case 'number':
    case 'integer':
      schema = z.number();
      break;
    case 'boolean':
      schema = z.boolean();
      break;
    case 'array':
      schema = z.array(z.any());
      break;
    case 'object':
      schema = z.record(z.string(), z.any());
      break;
    default:
      schema = z.any();
  }
  if (def?.description) schema = schema.describe(def.description);
  return schema;
}

function buildZodShape(inputSchema: any): Record<string, ZodTypeAny> {
  const properties = inputSchema?.properties || {};
  const required: string[] = inputSchema?.required || [];
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, def] of Object.entries(properties)) {
    let s = jsonPropToZod(def);
    if (!required.includes(key)) s = s.optional();
    shape[key] = s;
  }
  return shape;
}

app.post('/mcp', async (req, res) => {
  try {
    const server = new McpServer({ name: 'iwmc-healthie-mcp', version: '2.0.0' });
    for (const [toolName, toolDef] of Object.entries(allTools)) {
      const zodShape = buildZodShape(toolDef.inputSchema);
      server.tool(
        toolName,
        toolDef.description,
        zodShape,
        async (args: any) => {
          try {
            const result = await toolDef.handler(args);
            return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
          } catch (error: any) {
            return {
              content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
              isError: true,
            };
          }
        }
      );
    }
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error: any) {
    console.error('MCP request error:', error);
    if (!res.headersSent) res.status(500).json({ error: error.message });
  }
});

app.get('/mcp', (_req, res) => {
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed. Use POST for MCP requests.' },
    id: null,
  }));
});

app.delete('/mcp', (_req, res) => {
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Session termination not supported in stateless mode.' },
    id: null,
  }));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`IWMC Healthie MCP Server v2.0.0 running on port ${PORT}`);
  console.log(`Tools: ${Object.keys(allTools).length} registered`);
});

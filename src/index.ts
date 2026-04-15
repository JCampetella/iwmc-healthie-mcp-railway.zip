import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
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

// Create Express app
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    server: 'iwmc-healthie-mcp',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'IWMC Healthie MCP Server',
    version: '2.0.0',
    description: 'Railway-native MCP server for Healthie EHR integration',
    endpoints: {
      health: '/health',
      mcp: '/mcp (POST)',
    },
  });
});

// Collect all tools into a flat registry
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

// MCP endpoint handler
app.post('/mcp', async (req, res) => {
  try {
    // Create a fresh MCP server instance per request (stateless)
    const server = new McpServer({
      name: 'iwmc-healthie-mcp',
      version: '2.0.0',
    });

    // Register all tools
    for (const [toolName, toolDef] of Object.entries(allTools)) {
      server.tool(
        toolName,
        toolDef.description,
        toolDef.inputSchema.properties || {},
        async (args: any) => {
          try {
            const result = await toolDef.handler(args);
            return {
              content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
            };
          } catch (error: any) {
            return {
              content: [{ type: 'text' as const, text: `Error: ${error.message}` }],
              isError: true,
            };
          }
        }
      );
    }

    // Create transport for this request
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode
    });

    // Connect server to transport
    await server.connect(transport);

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error: any) {
    console.error('MCP request error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

// Handle MCP GET and DELETE for session management
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

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ IWMC Healthie MCP Server v2.0.0 running on port ${PORT}`);
  console.log(`   Health: http://0.0.0.0:${PORT}/health`);
  console.log(`   MCP:    http://0.0.0.0:${PORT}/mcp`);
  console.log(`   Tools:  ${Object.keys(allTools).length} registered`);
  console.log(`   Mode:   Railway (persistent)`);
});

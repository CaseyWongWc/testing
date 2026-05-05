import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);

const wss = new WebSocketServer({ server, path: "/ws" });

const clients = new Map<WebSocket, { id: string; color: string }>();

function broadcastMessage(message: object) {
  const messageStr = JSON.stringify(message);
  clients.forEach((_client, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

wss.on("connection", (ws) => {
  const clientId = Math.random().toString(36).substring(2, 10);
  logger.info({ clientId }, "WebSocket client connected");

  clients.set(ws, {
    id: clientId,
    color: "#" + Math.floor(Math.random() * 16777215).toString(16),
  });

  ws.send(
    JSON.stringify({
      type: "connect",
      clientId,
      message: "Welcome to the WebSocket server",
      timestamp: new Date().toISOString(),
    }),
  );

  broadcastMessage({
    type: "user_joined",
    clientId,
    message: `Client ${clientId} joined`,
    timestamp: new Date().toISOString(),
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString()) as Record<string, unknown>;
      if (!data.clientId) data.clientId = clientId;
      if (!data.timestamp) data.timestamp = new Date().toISOString();
      broadcastMessage(data);
    } catch {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format. Expected JSON.",
          timestamp: new Date().toISOString(),
        }),
      );
    }
  });

  ws.on("close", () => {
    logger.info({ clientId }, "WebSocket client disconnected");
    const client = clients.get(ws);
    clients.delete(ws);
    if (client) {
      broadcastMessage({
        type: "user_left",
        clientId: client.id,
        message: `Client ${client.id} left`,
        timestamp: new Date().toISOString(),
      });
    }
  });
});

app.get("/api/ws-status", (_req, res) => {
  const clientList = Array.from(clients.values()).map((c) => c.id);
  res.json({
    status: "ok",
    message: "WebSocket server is running",
    clientCount: clients.size,
    clients: clientList,
    timestamp: new Date().toISOString(),
  });
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});

server.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening");
  logger.info({ port }, "WebSocket server available at /ws");
});

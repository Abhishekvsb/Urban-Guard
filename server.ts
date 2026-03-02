import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("urban_guard.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    full_name TEXT
  );

  CREATE TABLE IF NOT EXISTS infrastructure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    status TEXT,
    location TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    health_score INTEGER DEFAULT 100
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT,
    resource TEXT,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const insertUser = db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)");
  insertUser.run("admin", "admin123", "ADMIN", "System Administrator");
  insertUser.run("operator", "op123", "OPERATOR", "Grid Operator");
  insertUser.run("viewer", "view123", "VIEWER", "Public Auditor");
  insertUser.run("emergency", "em123", "EMERGENCY", "Emergency Response Lead");

  const insertInfra = db.prepare("INSERT INTO infrastructure (name, type, status, location, health_score) VALUES (?, ?, ?, ?, ?)");
  insertInfra.run("Central Power Grid", "Power", "Active", "Sector A-1", 98);
  insertInfra.run("Main Water Filtration", "Water", "Active", "Sector B-4", 95);
  insertInfra.run("Traffic Control Hub", "Traffic", "Active", "Downtown", 100);
  insertInfra.run("Waste Management Plant", "Waste", "Maintenance", "Industrial Zone", 72);
  insertInfra.run("Smart Street Lighting", "Lighting", "Active", "Citywide", 99);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // Simple Auth Middleware (Mocking session with a header for simplicity in this demo)
  const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    (req as any).user = user;
    next();
  };

  const rbacMiddleware = (roles: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const user = (req as any).user;
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }
      next();
    };
  };

  const logAction = (userId: number, username: string, action: string, resource: string, details: string) => {
    const insertLog = db.prepare("INSERT INTO audit_logs (user_id, username, action, resource, details) VALUES (?, ?, ?, ?, ?)");
    insertLog.run(userId, username, action, resource, details);
  };

  // API Routes
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id, username, role, full_name FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      logAction(user.id, user.username, "LOGIN", "AUTH", "User logged in successfully");
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/infrastructure", authMiddleware, (req, res) => {
    const items = db.prepare("SELECT * FROM infrastructure").all();
    res.json(items);
  });

  app.post("/api/infrastructure/:id/toggle", authMiddleware, rbacMiddleware(["ADMIN", "OPERATOR", "EMERGENCY"]), (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = (req as any).user;

    const item = db.prepare("SELECT * FROM infrastructure WHERE id = ?").get(id) as any;
    if (!item) return res.status(404).json({ error: "Not found" });

    db.prepare("UPDATE infrastructure SET status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
    logAction(user.id, user.username, "UPDATE_STATUS", `INFRA:${id}`, `Changed status of ${item.name} to ${status}`);
    
    res.json({ success: true });
  });

  app.get("/api/logs", authMiddleware, rbacMiddleware(["ADMIN"]), (req, res) => {
    const logs = db.prepare("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100").all();
    res.json(logs);
  });

  app.get("/api/stats", authMiddleware, (req, res) => {
    const stats = {
      total: db.prepare("SELECT COUNT(*) as count FROM infrastructure").get() as any,
      active: db.prepare("SELECT COUNT(*) as count FROM infrastructure WHERE status = 'Active'").get() as any,
      maintenance: db.prepare("SELECT COUNT(*) as count FROM infrastructure WHERE status = 'Maintenance'").get() as any,
      logsCount: db.prepare("SELECT COUNT(*) as count FROM audit_logs").get() as any,
    };
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

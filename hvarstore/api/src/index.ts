import { Hono } from "hono";
import { cors } from "hono/cors";
import { loadEnv } from "./env";
import { authMiddleware } from "./middleware/auth";
import products from "./routes/products";
import categories from "./routes/categories";
import locations from "./routes/locations";
import authRoutes from "./routes/auth";
import orders from "./routes/orders";
import payments from "./routes/payments";
import tickets from "./routes/tickets";
import { startOutboxWorker } from "./lib/webhook-outbox";
import admin from "./routes/admin";

const app = new Hono();
const env = loadEnv();

// CORS
app.use(
	"/*",
	cors({
		origin: [
			"http://localhost:4321",
			"http://localhost:5173",
			"https://hvarstore.com",
			"https://mcrm.hvarstore.com",
		],
		credentials: true,
	}),
);

// Auth routes: public except /me
app.route("/api/auth", authRoutes);
app.use("/api/auth/me", authMiddleware);
app.route("/api/products", products);
app.route("/api/categories", categories);
app.route("/api/locations", locations);

// Protected routes
app.use("/api/orders/*", authMiddleware);
app.use("/api/tickets/*", authMiddleware);
app.route("/api/orders", orders);
app.route("/api/tickets", tickets);

// Payments: initiate requires auth, callback is public
app.route("/api/payments", payments);

startOutboxWorker(env);

// Admin routes (requires auth + phone allowlist — see ADMIN_PHONES env var)
app.use("/api/admin/*", authMiddleware);
app.route("/api/admin", admin);

// Health check
app.get("/api/health", (c) =>
	c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

export default {
	port: Number(env.API_PORT),
	fetch: app.fetch,
};

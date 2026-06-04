import { createMiddleware } from "hono/factory";
import { verifyToken, type JwtPayload } from "../lib/auth";

declare module "hono" {
	interface ContextVariableMap {
		user: JwtPayload;
	}
}

export const authMiddleware = createMiddleware(async (c, next) => {
	const header = c.req.header("Authorization");
	if (!header?.startsWith("Bearer ")) {
		return c.json({ error: "unauthorized" }, 401);
	}

	const token = header.slice(7);
	const payload = await verifyToken(token);
	if (!payload) {
		return c.json({ error: "invalid or expired token" }, 401);
	}

	c.set("user", payload);
	await next();
});

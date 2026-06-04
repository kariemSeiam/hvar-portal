import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";

const route = new Hono();

route.post("/register", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

route.post("/login", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

route.get("/me", authMiddleware, async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

export default route;

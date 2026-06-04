import { Hono } from "hono";

const route = new Hono();

route.get("/", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

route.get("/:id", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

route.post("/", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

export default route;

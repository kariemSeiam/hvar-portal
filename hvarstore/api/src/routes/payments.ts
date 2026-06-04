import { Hono } from "hono";

const route = new Hono();

route.post("/kashier/initiate", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

route.post("/kashier/callback", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

export default route;

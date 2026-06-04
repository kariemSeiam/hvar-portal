import { Hono } from "hono";

const route = new Hono();

route.get("/", async (c) => {
	// category filter, search, price range, featured
	return c.json({ message: "not implemented" }, 501);
});

route.get("/:slug", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

route.get("/featured", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

export default route;

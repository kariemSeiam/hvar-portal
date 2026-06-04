import { Hono } from "hono";

const route = new Hono();

route.get("/governorates", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

route.get("/districts/:governorateId", async (c) => {
	return c.json({ message: "not implemented" }, 501);
});

export default route;

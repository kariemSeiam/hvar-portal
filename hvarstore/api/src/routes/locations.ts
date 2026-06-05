import { Hono } from "hono";
import type { RowDataPacket } from "mysql2";
import { loadEnv } from "../env";
import { getErpPool, query } from "../lib/db";

interface GovRow extends RowDataPacket {
	id: number;
	city_id: string;
	name: string;
	nameAr: string;
	code: string;
}

interface DistrictRow extends RowDataPacket {
	id: number;
	district_id: string;
	district_name: string;
	district_name_ar: string;
	city_id: number;
}

const route = new Hono();

route.get("/governorates", async (c) => {
	const env = loadEnv();
	const rows = await query<GovRow[]>(
		getErpPool(env),
		"SELECT id, city_id, name, nameAr, code FROM cities ORDER BY nameAr ASC",
	);
	return c.json({
		items: rows.map((r) => ({
			id: r.id,
			code: r.code,
			name: r.name,
			nameAr: r.nameAr,
		})),
	});
});

route.get("/districts/:govId", async (c) => {
	const env = loadEnv();
	const govId = Number(c.req.param("govId"));
	if (!Number.isFinite(govId)) return c.json({ error: "bad_request" }, 400);

	const rows = await query<DistrictRow[]>(
		getErpPool(env),
		"SELECT id, district_id, district_name, district_name_ar, city_id FROM districts WHERE city_id = ? ORDER BY district_name_ar ASC",
		[govId],
	);
	return c.json({
		items: rows.map((r) => ({
			id: r.id,
			governorateId: r.city_id,
			name: r.district_name,
			nameAr: r.district_name_ar,
		})),
	});
});

export default route;

/**
 * checkout-server.js — serves checkout-demo.html on localhost:3001
 * GeoLink API whitelists localhost:3000 AND localhost:3001 for CORS.
 * Run: bun checkout-server.js  →  http://localhost:3001
 */

const PORT = 3000;

Bun.serve({
	port: PORT,

	async fetch(_req) {
		const file = Bun.file("checkout-demo.html");
		return new Response((await file.exists()) ? file : "not found", {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	},

	error(err) {
		console.error("Server error:", err);
		return new Response("Internal Server Error", { status: 500 });
	},
});

console.log(
	`\n  🔥 GeoLink Live Demo\n  ─────────────────────\n  http://localhost:${PORT}\n`,
);

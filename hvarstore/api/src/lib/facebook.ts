import type { Env } from "../env";

const GRAPH = "https://graph.facebook.com/v21.0";

export interface FacebookProfile {
	/** App-scoped user id — stable per (user, app), not the global FB id. */
	id: string;
	name: string;
	email: string | null;
	avatar: string | null;
}

/**
 * Verify a client-supplied Facebook access token and return the profile.
 *
 * Two checks, both required:
 *  1. debug_token (with our app access token) proves the token is valid AND
 *     was issued for OUR app — without this, a token minted by any other
 *     Facebook app would be accepted.
 *  2. /me fetches the profile fields we store.
 *
 * Returns null on any failure (invalid token, wrong app, network error).
 */
export async function verifyFacebookToken(
	accessToken: string,
	env: Env,
): Promise<FacebookProfile | null> {
	if (!env.FACEBOOK_APP_ID || !env.FACEBOOK_APP_SECRET) return null;
	if (!accessToken) return null;

	const appToken = `${env.FACEBOOK_APP_ID}|${env.FACEBOOK_APP_SECRET}`;

	try {
		const dbgRes = await fetch(
			`${GRAPH}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`,
		);
		const dbg = (await dbgRes.json()) as {
			data?: { is_valid?: boolean; app_id?: string };
		};
		if (
			!dbg.data?.is_valid ||
			String(dbg.data.app_id) !== String(env.FACEBOOK_APP_ID)
		) {
			return null;
		}

		const meRes = await fetch(
			`${GRAPH}/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`,
		);
		const me = (await meRes.json()) as {
			id?: string;
			name?: string;
			email?: string;
			picture?: { data?: { url?: string } };
		};
		if (!me.id) return null;

		return {
			id: me.id,
			name: me.name ?? "عميل هفار",
			email: me.email ?? null,
			avatar: me.picture?.data?.url ?? null,
		};
	} catch {
		return null;
	}
}

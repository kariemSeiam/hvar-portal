// Lazy loader for the Facebook JS SDK. The SDK script is only fetched the first
// time someone actually clicks "Continue with Facebook" — it never touches the
// page otherwise. Enabled only when PUBLIC_FACEBOOK_APP_ID is set at build time.

const APP_ID = import.meta.env?.PUBLIC_FACEBOOK_APP_ID ?? "";

interface FbAuthResponse {
	accessToken?: string;
}
interface FbLoginResponse {
	authResponse: FbAuthResponse | null;
	status: string;
}
interface FacebookSdk {
	init(opts: {
		appId: string;
		cookie?: boolean;
		xfbml?: boolean;
		version: string;
	}): void;
	login(
		cb: (res: FbLoginResponse) => void,
		opts?: { scope?: string },
	): void;
}

declare global {
	interface Window {
		FB?: FacebookSdk;
		fbAsyncInit?: () => void;
	}
}

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
	if (sdkPromise) return sdkPromise;
	sdkPromise = new Promise<void>((resolve) => {
		if (window.FB) {
			resolve();
			return;
		}
		window.fbAsyncInit = () => {
			window.FB!.init({
				appId: APP_ID,
				cookie: true,
				xfbml: false,
				version: "v21.0",
			});
			resolve();
		};
		const script = document.createElement("script");
		script.src = "https://connect.facebook.net/ar_AR/sdk.js";
		script.async = true;
		script.defer = true;
		script.crossOrigin = "anonymous";
		document.head.appendChild(script);
	});
	return sdkPromise;
}

/** True when a Facebook App ID is configured — gates the whole FB UI. */
export function isFacebookEnabled(): boolean {
	return APP_ID.length > 0;
}

/** Open the Facebook login dialog and resolve with a short-lived access token. */
export async function facebookLogin(): Promise<string> {
	if (!APP_ID) throw new Error("تسجيل الدخول بفيسبوك غير مفعّل");
	await loadSdk();
	return new Promise<string>((resolve, reject) => {
		window.FB!.login(
			(res) => {
				const token = res.authResponse?.accessToken;
				if (token) resolve(token);
				else reject(new Error("تم إلغاء الدخول عبر فيسبوك"));
			},
			{ scope: "public_profile,email" },
		);
	});
}

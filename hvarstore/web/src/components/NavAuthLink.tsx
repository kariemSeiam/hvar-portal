import { useStore } from "@nanostores/react";
import { User } from "lucide-react";
import { isLoggedIn, authUser } from "../lib/auth";

export default function NavAuthLink() {
	const loggedIn = useStore(isLoggedIn);
	const user = useStore(authUser);

	if (loggedIn && user) {
		return (
			<a
				href="/account"
				className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-cairo font-semibold text-sm transition-all"
				style={{ borderColor: "var(--c-border)", color: "var(--c-ink-muted)" }}
				onMouseOver={(e) => {
					(e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--c-brand)";
					(e.currentTarget as HTMLAnchorElement).style.color = "var(--c-brand)";
				}}
				onMouseOut={(e) => {
					(e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--c-border)";
					(e.currentTarget as HTMLAnchorElement).style.color = "var(--c-ink-muted)";
				}}
			>
				<User size={14} />
				<span className="max-w-[80px] truncate">{user.name.split(" ")[0]}</span>
			</a>
		);
	}

	return (
		<a
			href="/login"
			className="flex items-center gap-1.5 px-3 py-1.5 rounded-[0.625rem] border-[1.5px] font-cairo font-bold text-sm transition-all"
			style={{ borderColor: "var(--c-brand)", color: "var(--c-brand)" }}
			onMouseOver={(e) => {
				(e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--c-brand)";
				(e.currentTarget as HTMLAnchorElement).style.color = "#fff";
			}}
			onMouseOut={(e) => {
				(e.currentTarget as HTMLAnchorElement).style.backgroundColor = "";
				(e.currentTarget as HTMLAnchorElement).style.color = "var(--c-brand)";
			}}
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
				<path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
			</svg>
			دخول
		</a>
	);
}

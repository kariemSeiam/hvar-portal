import { useStore } from "@nanostores/react";
import {
	Package,
	Wrench,
	MapPin,
	LogOut,
	ChevronLeft,
	User,
} from "lucide-react";
import { authUser, isLoggedIn, logout } from "../../lib/auth";

export default function AccountView() {
	const loggedIn = useStore(isLoggedIn);
	const user = useStore(authUser);

	if (!loggedIn || !user) {
		if (typeof window !== "undefined") {
			window.location.href = "/login?redirect=/account";
		}
		return null;
	}

	function handleLogout() {
		logout();
		window.location.href = "/";
	}

	const links = [
		{
			href: "/orders",
			icon: Package,
			label: "طلباتي",
			desc: "تتبع حالة طلباتك",
		},
		{
			href: "/service",
			icon: Wrench,
			label: "الدعم والصيانة",
			desc: "طلبات صيانة واستبدال ومرتجع",
		},
		{
			href: "/contact",
			icon: MapPin,
			label: "تواصل معنا",
			desc: "واتساب أو اتصال مباشر",
		},
	];

	const firstName = user.name.split(" ")[0];

	return (
		<div className="space-y-5">

			{/* Welcome + profile hero — quiet surface card, theme-aware */}
			<div
				className="relative overflow-hidden rounded-2xl p-6"
				style={{
					background: "var(--c-surface)",
					border: "1px solid var(--c-border)",
				}}
			>
				{/* Faint ember warmth from the reading start */}
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						background: "radial-gradient(ellipse 70% 80% at 0% 50%, var(--c-brand-glow) 0%, transparent 60%)",
					}}
					aria-hidden="true"
				/>

				<div className="relative flex items-center gap-4">
					{/* Avatar monogram */}
					<div
						className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl font-cairo font-black text-xl text-white select-none"
						style={{ background: "linear-gradient(150deg, var(--c-brand), var(--c-brand-hover))", boxShadow: "0 4px 14px rgba(var(--c-brand-rgb),0.28)" }}
					>
						{firstName[0]}
					</div>

					<div className="flex-1 min-w-0">
						<p
							className="font-cairo font-semibold text-xs uppercase tracking-[0.14em] mb-0.5"
							style={{ color: "var(--c-flame)" }}
						>
							مرحباً بيكِ
						</p>
						<p className="font-cairo font-black text-xl leading-tight" style={{ color: "var(--c-ink)" }}>
							{firstName}
						</p>
						<p className="font-inter text-sm mt-0.5 tabular-nums" dir="ltr" style={{ color: "var(--c-ink-muted)" }}>
							{user.phone}
						</p>
					</div>
				</div>
			</div>

			{/* Navigation links */}
			<div className="space-y-2">
				{links.map((l) => (
					<a
						key={l.href}
						href={l.href}
						className="flex items-center gap-4 p-4 rounded-2xl transition-all group"
						style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
						onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--c-brand)")}
						onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--c-border)")}
					>
						<div
							className="w-10 h-10 flex items-center justify-center rounded-xl transition-all group-hover:scale-105"
							style={{ background: "rgba(var(--c-brand-rgb),0.07)", color: "var(--c-brand)" }}
						>
							<l.icon size={18} />
						</div>
						<div className="flex-1">
							<p className="font-cairo font-bold text-sm" style={{ color: "var(--c-ink)" }}>
								{l.label}
							</p>
							<p className="font-cairo text-xs" style={{ color: "var(--c-ink-muted)" }}>
								{l.desc}
							</p>
						</div>
						<ChevronLeft
							size={16}
							style={{ color: "var(--c-ink-faint)" }}
							className="group-hover:text-[var(--c-brand)] transition-colors"
						/>
					</a>
				))}
			</div>

			{/* Trust strip */}
			<div
				className="flex items-center justify-center gap-4 py-3.5 px-4 rounded-xl"
				style={{ background: "var(--c-surface-2)", border: "1px solid var(--c-border)" }}
			>
				{[
					{ icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", text: "ضمان أصلي" },
					{ icon: "M5 12h14M12 5l7 7-7 7", text: "شحن مجاني" },
					{ icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z", text: "دعم ٢٤/٧" },
				].map((t, i) => (
					<span key={i} className="flex items-center gap-1.5 font-cairo text-xs" style={{ color: "var(--c-ink-muted)" }}>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--c-brand)", flexShrink: 0 }}>
							<path d={t.icon} />
						</svg>
						{t.text}
					</span>
				))}
			</div>

			{/* Logout */}
			<button
				onClick={handleLogout}
				className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl font-cairo font-semibold text-sm transition-all"
				style={{ border: "1px solid var(--c-border)", color: "var(--c-ink-muted)" }}
				onMouseEnter={(e) => {
					(e.currentTarget as HTMLButtonElement).style.borderColor = "#ef4444";
					(e.currentTarget as HTMLButtonElement).style.color = "#ef4444";
				}}
				onMouseLeave={(e) => {
					(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--c-border)";
					(e.currentTarget as HTMLButtonElement).style.color = "var(--c-ink-muted)";
				}}
			>
				<LogOut size={15} />
				تسجيل الخروج
			</button>
		</div>
	);
}

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

	return (
		<div className="space-y-6">
			{/* Profile card */}
			<div className="flex items-center gap-4 p-5 rounded-2xl bg-surface border border-hvar">
				<div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/20 text-brand">
					<User size={24} />
				</div>
				<div className="flex-1 min-w-0">
					<p className="font-cairo font-bold text-lg text-ink">
						{user.name}
					</p>
					<p
						className="font-inter text-sm text-muted tabular-nums"
						dir="ltr"
					>
						{user.phone}
					</p>
				</div>
			</div>

			{/* Navigation links */}
			<div className="space-y-2">
				{links.map((l) => (
					<a
						key={l.href}
						href={l.href}
						className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-hvar hover:border-[var(--c-brand)] transition-all group"
					>
						<div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/20 text-brand group-hover:bg-brand group-hover:text-white transition-all">
							<l.icon size={18} />
						</div>
						<div className="flex-1">
							<p className="font-cairo font-bold text-sm text-ink">
								{l.label}
							</p>
							<p className="font-cairo text-xs text-muted">
								{l.desc}
							</p>
						</div>
						<ChevronLeft
							size={16}
							className="text-stone-300 dark:text-stone-600 group-hover:text-[var(--c-brand)] transition-colors"
						/>
					</a>
				))}
			</div>

			{/* Logout */}
			<button
				onClick={handleLogout}
				className="flex items-center gap-2 w-full p-4 rounded-2xl border border-hvar text-stone-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/30 font-cairo font-semibold text-sm transition-all"
			>
				<LogOut size={16} />
				تسجيل الخروج
			</button>
		</div>
	);
}

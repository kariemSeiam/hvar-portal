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
				className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold font-cairo transition-colors nav-link"
			>
				<User size={14} />
				<span className="max-w-[80px] truncate">{user.name.split(" ")[0]}</span>
			</a>
		);
	}

	return (
		<a
			href="/login"
			className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold font-cairo transition-colors nav-link"
		>
			دخول
		</a>
	);
}

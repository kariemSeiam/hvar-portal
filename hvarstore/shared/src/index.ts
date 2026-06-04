import { z } from "zod";

// ── Auth ──
export const RegisterSchema = z.object({
	phone: z
		.string()
		.regex(/^(?:\+20|0020|0)?1[0125]\d{8}$/, "رقم موبايل مصري غير صحيح"),
	name: z.string().min(2).max(100),
	password: z.string().min(6).max(128),
});

export const LoginSchema = z.object({
	phone: z.string().min(1, "رقم الموبايل مطلوب"),
	password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

// ── Products ──
export interface Product {
	id: number;
	name: string;
	slug: string;
	description: string;
	price: number;
	comparePrice?: number;
	image?: string;
	stock: number;
	categoryId: number;
	categoryName: string;
}

export interface ProductDetail extends Product {
	images: string[];
	sku: string;
	unit: string;
}

// ── Cart ──
export interface CartItem {
	productId: number;
	variationId: number;
	name: string;
	slug: string;
	image?: string;
	price: number;
	quantity: number;
	stock: number;
	sku: string;
}

// ── Order ──
export type PaymentMethod = "cod" | "kashier_card" | "kashier_installments";
export type OrderStatus =
	| "pending"
	| "confirmed"
	| "processing"
	| "shipped"
	| "delivered"
	| "cancelled";

export interface Order {
	id: number;
	contactId: number;
	items: OrderItem[];
	total: number;
	paymentMethod: PaymentMethod;
	status: OrderStatus;
	shippingAddress: Address;
	billCode?: string;
	createdAt: string;
	erpTransactionId?: number;
}

export interface OrderItem {
	productId: number;
	variationId: number;
	name: string;
	quantity: number;
	unitPrice: number;
	subtotal: number;
}

export interface Address {
	governorate: string;
	district: string;
	street: string;
	building: string;
	apartment?: string;
	phone: string;
	notes?: string;
}

// ── Service Tickets ──
export type TicketType = "R" | "M" | "T" | "S";
export type TicketStatus =
	| "PENDING"
	| "HUB_RECEIVED"
	| "IN_WORKSHOP"
	| "DISPATCHED"
	| "INSPECTED"
	| "READY"
	| "REFUNDED"
	| "CLOSED"
	| "CANCELLED"
	| "FAILED";

export const TicketStatusLabels: Record<TicketStatus, string> = {
	PENDING: "قيد المراجعة",
	HUB_RECEIVED: "تم الاستلام في الفرع",
	IN_WORKSHOP: "في الصيانة",
	DISPATCHED: "تم الشحن",
	INSPECTED: "تم الفحص",
	READY: "جاهز للاستلام",
	REFUNDED: "تم الاسترداد",
	CLOSED: "مغلق",
	CANCELLED: "ملغي",
	FAILED: "فشل",
};

export const TicketStatusColors: Record<TicketStatus, string> = {
	PENDING: "slate",
	HUB_RECEIVED: "blue",
	IN_WORKSHOP: "amber",
	DISPATCHED: "purple",
	INSPECTED: "blue",
	READY: "green",
	REFUNDED: "green",
	CLOSED: "emerald",
	CANCELLED: "red",
	FAILED: "red",
};

export interface ServiceTicket {
	id: number;
	type: TicketType;
	status: TicketStatus;
	contactId: number;
	transactionId?: number;
	productName: string;
	description: string;
	createdAt: string;
	updatedAt: string;
}

// ── Locations ──
export interface Governorate {
	id: number;
	name: string;
	nameAr: string;
}

export interface District {
	id: number;
	name: string;
	nameAr: string;
	governorateId: number;
}

// ── Geo / Address ──
export interface GeoLocation {
	lat: number;
	lng: number;
}

export interface ReverseGeoResult {
	governorate: string;
	district: string;
	governorateId: number;
	districtId: number;
}

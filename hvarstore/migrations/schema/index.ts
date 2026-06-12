import {
	mysqlTable,
	serial,
	bigint,
	varchar,
	decimal,
	text,
	timestamp,
	int,
	boolean,
	index,
	mysqlEnum,
	json,
	datetime,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ── Customers (auth layer, not hvar_erp.contacts) ──
export const customers = mysqlTable(
	"customers",
	{
		id: serial("id").primaryKey(),
		contactId: int("contact_id").notNull().unique(), // FK to hvar_erp.contacts.id
		phone: varchar("phone", { length: 15 }).notNull().unique(),
		name: varchar("name", { length: 100 }).notNull(),
		email: varchar("email", { length: 255 }), // from Facebook login (enrichment)
		facebookId: varchar("facebook_id", { length: 64 }).unique(), // FB app-scoped id
		avatarUrl: varchar("avatar_url", { length: 512 }), // FB profile picture
		// Nullable: passwordless (phone-only) and Facebook accounts have no password.
		passwordHash: varchar("password_hash", { length: 255 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	},
	(t) => [index("idx_phone").on(t.phone)],
);

// ── Customer addresses ──
export const customerAddresses = mysqlTable("customer_addresses", {
	id: serial("id").primaryKey(),
	customerId: bigint("customer_id", { unsigned: true, mode: "number" })
		.notNull()
		.references(() => customers.id),
	governorateId: int("governorate_id").notNull(), // FK to hvar_erp.cities.id
	districtId: int("district_id").notNull(), // FK to hvar_erp.districts.id
	street: varchar("street", { length: 255 }).notNull(),
	building: varchar("building", { length: 100 }).notNull(),
	apartment: varchar("apartment", { length: 50 }),
	phone: varchar("phone", { length: 15 }).notNull(),
	notes: text("notes"),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Orders ──
export const orders = mysqlTable(
	"orders",
	{
		id: serial("id").primaryKey(),
		customerId: bigint("customer_id", { unsigned: true, mode: "number" })
			.notNull()
			.references(() => customers.id),
		contactId: int("contact_id").notNull(), // hvar_erp.contacts.id
		paymentMethod: varchar("payment_method", { length: 30 }).notNull(), // cod | kashier_card | kashier_installments
		status: varchar("status", { length: 20 }).default("pending").notNull(),
		subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
		shippingFee: decimal("shipping_fee", { precision: 10, scale: 2 })
			.default("0.00")
			.notNull(),
		total: decimal("total", { precision: 10, scale: 2 }).notNull(),
		governorateId: int("governorate_id").notNull(),
		districtId: int("district_id").notNull(),
		street: varchar("street", { length: 255 }).notNull(),
		building: varchar("building", { length: 100 }).notNull(),
		apartment: varchar("apartment", { length: 50 }),
		shippingPhone: varchar("shipping_phone", { length: 15 }).notNull(),
		notes: text("notes"),
		erpTransactionId: int("erp_transaction_id"), // set after ERP sync
		billCode: varchar("bill_code", { length: 100 }), // Bosta tracking
		erpWebhookSent: boolean("erp_webhook_sent").default(false).notNull(),
		cancelledAt: timestamp("cancelled_at"), // soft-delete
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
	},
	(t) => [
		index("idx_customer").on(t.customerId),
		index("idx_contact").on(t.contactId),
		index("idx_status").on(t.status),
	],
);

// ── Order items ──
export const orderItems = mysqlTable(
	"order_items",
	{
		id: serial("id").primaryKey(),
		orderId: bigint("order_id", { unsigned: true, mode: "number" })
			.notNull()
			.references(() => orders.id),
		productId: int("product_id").notNull(), // hvar_erp.products.id
		variationId: int("variation_id").notNull(), // hvar_erp.variations.id
		name: varchar("name", { length: 255 }).notNull(),
		sku: varchar("sku", { length: 100 }),
		quantity: int("quantity").notNull(),
		unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
		subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
	},
	(t) => [index("idx_order").on(t.orderId)],
);

// ── Webhook outbox (durable retry queue for ERP push) ──
export const webhookOutbox = mysqlTable(
	"webhook_outbox",
	{
		id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
		eventType: mysqlEnum("event_type", ["order_created", "payment_confirmed"]).notNull(),
		orderId: bigint("order_id", { mode: "number" }).notNull(),
		payload: json("payload").notNull(),
		targetUrl: varchar("target_url", { length: 500 }).notNull(),
		attempts: int("attempts").notNull().default(0),
		maxAttempts: int("max_attempts").notNull().default(8),
		nextAttemptAt: datetime("next_attempt_at").notNull(),
		lastError: text("last_error"),
		deliveredAt: datetime("delivered_at"),
		deadAt: datetime("dead_at"),
		createdAt: datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	},
	(t) => [
		index("outbox_due_idx").on(t.deliveredAt, t.deadAt, t.nextAttemptAt),
		index("outbox_order_idx").on(t.orderId),
	],
);

// ── Pending payments (durable bridge: create before Kashier redirect, complete in callback) ──
export const pendingPayments = mysqlTable(
	"pending_payments",
	{
		id: serial("id").primaryKey(),
		orderId: bigint("order_id", { unsigned: true, mode: "number" })
			.notNull()
			.references(() => orders.id),
		kashierOrderId: varchar("kashier_order_id", { length: 50 })
			.notNull()
			.unique(),
		amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
		currency: varchar("currency", { length: 3 }).default("EGP").notNull(),
		paymentMethod: varchar("payment_method", { length: 30 }).notNull(), // card | installments
		redirectUrl: text("redirect_url"),
		processedAt: timestamp("processed_at"), // set on callback → idempotency guard
		expiresAt: timestamp("expires_at").notNull(), // 30-min HPP window
		kashierReference: varchar("kashier_reference", { length: 128 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		index("idx_order").on(t.orderId),
		index("idx_kashier_order").on(t.kashierOrderId),
		index("idx_expires").on(t.expiresAt),
	],
);

import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Leads table for storing web scraping results
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().unique(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  country: varchar("country", { length: 64 }),
  focus: varchar("focus", { length: 128 }),
  statusCode: varchar("statusCode", { length: 32 }),
  emails: text("emails"),
  phones: text("phones"),
  contactPages: text("contactPages"),
  vendorPages: text("vendorPages"),
  rfqPages: text("rfqPages"),
  hasVendorPortal: int("hasVendorPortal").default(0),
  hasRfqSystem: int("hasRfqSystem").default(0),
  // Portal mapping fields
  procurementPortalUrl: varchar("procurementPortalUrl", { length: 512 }),
  portalType: varchar("portalType", { length: 64 }), // public, login-required, third-party
  portalName: varchar("portalName", { length: 255 }),
  registrationUrl: varchar("registrationUrl", { length: 512 }),
  portalNotes: text("portalNotes"),
  lastChecked: timestamp("lastChecked").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// Buyer opportunities table (RFQs, tenders, bids)
export const opportunities = mysqlTable("opportunities", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 512 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  opportunityType: varchar("opportunityType", { length: 64 }),
  category: varchar("category", { length: 128 }),
  value: varchar("value", { length: 128 }),
  deadline: timestamp("deadline"),
  publishedDate: timestamp("publishedDate").notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 64 }),
  location: varchar("location", { length: 255 }),
  requirements: text("requirements"),
  status: varchar("status", { length: 32 }).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = typeof opportunities.$inferInsert;
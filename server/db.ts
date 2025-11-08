import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

import { leads, Lead, InsertLead } from "../drizzle/schema";
import { desc, like, and, gte } from "drizzle-orm";

// Leads queries
export async function getAllLeads(): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.lastChecked));
}

export async function getRecentLeads(days: number = 7): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return db.select().from(leads)
    .where(gte(leads.lastChecked, cutoffDate))
    .orderBy(desc(leads.lastChecked));
}

export async function searchLeads(query: string): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  const searchPattern = `%${query}%`;
  return db.select().from(leads)
    .where(
      and(
        like(leads.companyName, searchPattern)
      )
    )
    .orderBy(desc(leads.lastChecked));
}

export async function upsertLead(lead: InsertLead): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(leads).values(lead).onDuplicateKeyUpdate({
    set: {
      companyName: lead.companyName,
      url: lead.url,
      country: lead.country,
      focus: lead.focus,
      statusCode: lead.statusCode,
      emails: lead.emails,
      phones: lead.phones,
      contactPages: lead.contactPages,
      vendorPages: lead.vendorPages,
      rfqPages: lead.rfqPages,
      hasVendorPortal: lead.hasVendorPortal,
      hasRfqSystem: lead.hasRfqSystem,
      lastChecked: lead.lastChecked,
      notes: lead.notes,
    },
  });
}

export async function getLeadStats() {
  const db = await getDb();
  if (!db) return null;
  
  const allLeads = await db.select().from(leads);
  
  return {
    total: allLeads.length,
    withEmails: allLeads.filter(l => l.emails && l.emails.length > 2).length,
    withVendorPortal: allLeads.filter(l => l.hasVendorPortal === 1).length,
    withRfqSystem: allLeads.filter(l => l.hasRfqSystem === 1).length,
    countries: new Set(allLeads.map(l => l.country).filter(Boolean)).size,
    focusAreas: new Set(allLeads.map(l => l.focus).filter(Boolean)).size,
  };
}

// Opportunities queries
import { opportunities, Opportunity, InsertOpportunity } from "../drizzle/schema";
import { or } from "drizzle-orm";

export async function getAllOpportunities(): Promise<Opportunity[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opportunities).orderBy(desc(opportunities.publishedDate));
}

export async function getRecentOpportunities(days: number = 7): Promise<Opportunity[]> {
  const db = await getDb();
  if (!db) return [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return db.select().from(opportunities)
    .where(gte(opportunities.publishedDate, cutoffDate))
    .orderBy(desc(opportunities.publishedDate));
}

export async function searchOpportunities(query: string): Promise<Opportunity[]> {
  const db = await getDb();
  if (!db) return [];
  const searchPattern = `%${query}%`;
  return db.select().from(opportunities)
    .where(
      or(
        like(opportunities.title, searchPattern),
        like(opportunities.companyName, searchPattern),
        like(opportunities.description, searchPattern)
      )
    )
    .orderBy(desc(opportunities.publishedDate));
}

export async function upsertOpportunity(opp: InsertOpportunity): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(opportunities).values(opp);
}

export async function getOpportunityStats() {
  const db = await getDb();
  if (!db) return null;
  
  const allOpps = await db.select().from(opportunities);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7);
  const recentOpps = allOpps.filter(o => new Date(o.publishedDate) >= cutoffDate);
  
  return {
    total: allOpps.length,
    recent: recentOpps.length,
    withDeadline: allOpps.filter(o => o.deadline).length,
    types: new Set(allOpps.map(o => o.opportunityType).filter(Boolean)).size,
    companies: new Set(allOpps.map(o => o.companyName).filter(Boolean)).size,
  };
}

// Portal mapping queries
export async function getPortalMapping() {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select()
    .from(leads)
    .where(sql`procurementPortalUrl IS NOT NULL`)
    .orderBy(leads.companyName);
  
  return results;
}

export async function getPortalStats() {
  const db = await getDb();
  if (!db) return { total: 0, withPortals: 0, byType: {} };
  
  const [allLeads] = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const [withPortals] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(sql`procurementPortalUrl IS NOT NULL`);
  
  const byType = await db
    .select({
      portalType: leads.portalType,
      count: sql<number>`count(*)`
    })
    .from(leads)
    .where(sql`procurementPortalUrl IS NOT NULL`)
    .groupBy(leads.portalType);
  
  return {
    total: allLeads?.count || 0,
    withPortals: withPortals?.count || 0,
    byType: Object.fromEntries(byType.map(r => [r.portalType || 'unknown', r.count]))
  };
}

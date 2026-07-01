import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { customers, properties } from "@/lib/db/schema";

export type CustomerListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  primaryCity: string | null;
  primaryState: string | null;
};

export type ListCustomersInput = {
  search?: string;
  limit?: number;
  offset?: number;
};

export async function listCustomers(input: ListCustomersInput = {}): Promise<{
  items: CustomerListItem[];
  total: number;
}> {
  const db = getDb();
  const limit = Math.min(input.limit ?? 50, 100);
  const offset = input.offset ?? 0;
  const search = input.search?.trim();

  const searchFilter = search
    ? or(
        ilike(customers.firstName, `%${search}%`),
        ilike(customers.lastName, `%${search}%`),
        ilike(customers.email, `%${search}%`),
        ilike(customers.phone, `%${search}%`),
        ilike(sql`concat(${customers.firstName}, ' ', ${customers.lastName})`, `%${search}%`),
      )
    : undefined;

  const whereClause = and(isNull(customers.deletedAt), searchFilter);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customers)
    .where(whereClause);

  const rows = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      createdAt: customers.createdAt,
      primaryCity: properties.city,
      primaryState: properties.state,
    })
    .from(customers)
    .leftJoin(
      properties,
      and(
        eq(properties.customerId, customers.id),
        eq(properties.isPrimary, true),
        isNull(properties.deletedAt),
      ),
    )
    .where(whereClause)
    .orderBy(desc(customers.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: countRow?.count ?? 0,
  };
}

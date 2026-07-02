import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { createCustomerCommand } from "@/domain/commands/create-customer";
import { DomainError } from "@/domain/errors";
import { listCustomers } from "@/domain/queries/list-customers";
import { createCustomerSchema } from "@/domain/schemas/customer";

function parseNonNegativeInt(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

export async function GET(request: Request) {
  const auth = await requireApiPermission("customers:read");
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const limit = parseNonNegativeInt(searchParams.get("limit"));
  const offset = parseNonNegativeInt(searchParams.get("offset"));

  const result = await listCustomers({ search, limit, offset });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireApiPermission("customers:create");
  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
      { status: 400 },
    );
  }

  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.errors[0]?.message ?? "Invalid input",
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await createCustomerCommand({
      data: parsed.data,
      actorId: auth.userId,
      organizationId: auth.organizationId,
    });

    return NextResponse.json(
      {
        customer: result.customer,
        property: result.property,
        job: result.job,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof DomainError) {
      const status = error.code === "DUPLICATE_CUSTOMER" ? 409 : 400;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    throw error;
  }
}

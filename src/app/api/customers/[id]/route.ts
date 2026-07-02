import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api-auth";
import { updateCustomerCommand } from "@/domain/commands/update-customer";
import { DomainError } from "@/domain/errors";
import { getCustomerDetail } from "@/domain/queries/get-customer-detail";
import { updateCustomerSchema } from "@/domain/schemas/customer";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiPermission("customers:read");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Customer not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ customer });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiPermission("customers:update");
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } },
      { status: 400 },
    );
  }

  const parsed = updateCustomerSchema.safeParse(body);
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
    const customer = await updateCustomerCommand({
      customerId: id,
      data: parsed.data,
      actorId: auth.userId,
    });

    return NextResponse.json({ customer });
  } catch (error) {
    if (error instanceof DomainError) {
      const status =
        error.code === "NOT_FOUND" ? 404 : error.code === "DUPLICATE_CUSTOMER" ? 409 : 400;
      return NextResponse.json({ error: { code: error.code, message: error.message } }, { status });
    }
    throw error;
  }
}

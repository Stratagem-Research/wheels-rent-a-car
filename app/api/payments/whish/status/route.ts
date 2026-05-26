import { NextResponse } from "next/server";
import { z } from "zod";
import { getWhishClient, type WhishCurrency } from "@/lib/payments/whish";

const StatusQuerySchema = z.object({
  externalId: z.coerce.number().int().positive(),
  currency: z.enum(["USD", "LBP", "AED"]),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = StatusQuerySchema.safeParse({
    externalId: url.searchParams.get("externalId"),
    currency: url.searchParams.get("currency"),
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid status query." }, { status: 400 });
  }

  const whish = getWhishClient();
  const status = await whish.getPaymentStatus(
    parsed.data.currency as WhishCurrency,
    parsed.data.externalId,
  );
  return NextResponse.json(status);
}

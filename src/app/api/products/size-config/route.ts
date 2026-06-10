import { getProductSizeConfig } from "@/lib/products/sizeConfig";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId")?.trim();
  if (!productId) {
    return NextResponse.json({ message: "Missing productId" }, { status: 400 });
  }

  const config = await getProductSizeConfig(productId);
  const configuredOptions = config.options.filter(
    (option) => Number(option.qty ?? 0) > 0,
  );
  return NextResponse.json({
    enabled: config.enabled && configuredOptions.length > 0,
    options: configuredOptions,
  });
}

import { getDraftProductIdsCached } from "@/lib/storefront/draft-product-ids";
import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  try {
    const ids = await getDraftProductIdsCached();
    return NextResponse.json(
      { ids },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[products/drafts] GET failed:", error);
    return NextResponse.json({ ids: [] }, { status: 200 });
  }
}

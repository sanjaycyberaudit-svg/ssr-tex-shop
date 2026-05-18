import { env } from "@/env.mjs";
import { clsx, type ClassValue } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getURL = () => {
  let url =
    env.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000";

  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
};

const DEMO_S3_BUCKET = "hiyori-backpack";
const DEMO_S3_REGION = "us-west-2";

export const keytoUrl = (key?: string) => {
  const bucket =
    env.NEXT_PUBLIC_S3_BUCKET === "placeholder"
      ? DEMO_S3_BUCKET
      : env.NEXT_PUBLIC_S3_BUCKET;
  const region =
    env.NEXT_PUBLIC_S3_BUCKET === "placeholder"
      ? DEMO_S3_REGION
      : env.NEXT_PUBLIC_S3_REGION;

  return key
    ? `https://${bucket}.s3.${region}.amazonaws.com/${key}`
    : `https://${DEMO_S3_BUCKET}.s3.${DEMO_S3_REGION}.amazonaws.com/public/bathroom-planning.jpg`;
};

/** Store currency — Indian Rupee (₹) */
export const STORE_CURRENCY = "INR" as const;

export function formatPrice(
  price: number | string,
  currency: string = STORE_CURRENCY,
) {
  const isInr = currency === "INR";
  return new Intl.NumberFormat(isInr ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: isInr ? 0 : 2,
  }).format(Number(price));
}

/** Alias for rupee formatting (same as formatPrice) */
export function formatInr(price: number | string) {
  return formatPrice(price, STORE_CURRENCY);
}

export function formatDate(date: Date) {
  return dayjs(date).format("MMMM D, YYYY");
}

export function formatBytes(
  bytes: number,
  decimals = 0,
  sizeType: "accurate" | "normal" = "normal",
) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
  if (bytes === 0) return "0 Byte";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${
    sizeType === "accurate" ? accurateSizes[i] ?? "Bytest" : sizes[i] ?? "Bytes"
  }`;
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export function unslugify(str: string) {
  return str.replace(/-/g, " ");
}

export function toTitleCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  );
}

export function toSentenceCase(str: string) {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

export function isArrayOfFile(files: unknown): files is File[] {
  const isArray = Array.isArray(files);
  if (!isArray) return false;
  return files.every((file) => file instanceof File);
}

export function getNameInitials(fullName: string): string {
  const nameParts = fullName.split(" ");
  let initials = "";

  for (const part of nameParts) {
    if (part.length > 0) {
      initials += part[0].toUpperCase();
    }
  }

  return initials;
}

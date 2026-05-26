import { BrandLogo } from "./BrandLogo";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg" | "nav" | "sidebar" | "footer";
};

function Branding({ className, size = "nav" }: Props) {
  return <BrandLogo size={size} className={cn(className)} />;
}

export default Branding;

import { BrandLogo } from "./BrandLogo";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
};

function Branding({ className, size = "md", showText = true }: Props) {
  return (
    <BrandLogo size={size} showText={showText} className={cn(className)} />
  );
}

export default Branding;

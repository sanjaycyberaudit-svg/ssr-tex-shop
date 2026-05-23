import { BrandLogo } from "./BrandLogo";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg" | "nav";
  showEmblem?: boolean;
};

function Branding({ className, size = "nav", showEmblem = false }: Props) {
  return (
    <BrandLogo
      size={size}
      showEmblem={showEmblem}
      className={cn(className)}
    />
  );
}

export default Branding;

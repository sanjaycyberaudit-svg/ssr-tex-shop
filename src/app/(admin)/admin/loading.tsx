import { Spinner } from "@/components/ui/spinner";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <Spinner className="h-5 w-5 animate-spin" />
      <p className="text-sm text-muted-foreground">Loading admin page...</p>
    </div>
  );
}

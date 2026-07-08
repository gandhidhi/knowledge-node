import { PresentationCard } from "@/components/presentations/presentation-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PresentationListItem } from "@/lib/types/app";

type PresentationListProps = {
  presentations: PresentationListItem[];
  loading: boolean;
};

export function PresentationList({
  presentations,
  loading,
}: PresentationListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (presentations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        条件に一致する発表がありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {presentations.map((presentation) => (
        <PresentationCard key={presentation.id} presentation={presentation} />
      ))}
    </div>
  );
}

import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PresentationListItem } from "@/lib/types/app";
import { formatDate } from "@/lib/utils/format";

export function PresentationCard({
  presentation,
}: {
  presentation: PresentationListItem;
}) {
  return (
    <Link href={`/presentations/${presentation.id}`} className="block">
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader>
          <CardTitle className="text-base">{presentation.title}</CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {formatDate(presentation.presented_at)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {presentation.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {presentation.description}
            </p>
          )}
          {presentation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {presentation.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="font-normal">
                  <span className="text-muted-foreground">
                    {tag.category_name}:
                  </span>
                  {tag.value}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

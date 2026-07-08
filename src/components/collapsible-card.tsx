"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CollapsibleCardProps = {
  icon: ReactNode;
  title: ReactNode;
  /** タイトルの右横に表示する要素（タブなど） */
  headerExtra?: ReactNode;
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

/** 右上のボタンで折りたたみ・展開できるカード */
export function CollapsibleCard({
  icon,
  title,
  headerExtra,
  subtitle,
  defaultOpen = true,
  className,
  children,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {icon}
          {title}
          {headerExtra && <span className="ml-2">{headerExtra}</span>}
        </CardTitle>
        {subtitle && open && <CardDescription>{subtitle}</CardDescription>}
        <CardAction>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "折りたたむ" : "展開する"}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                !open && "-rotate-90",
              )}
            />
          </Button>
        </CardAction>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );
}

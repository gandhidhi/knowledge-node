"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { CategoryWithTags } from "@/lib/types/app";

type SidebarFilterProps = {
  categories: CategoryWithTags[];
  keyword: string;
  selectedTagIds: string[];
  onKeywordChange: (value: string) => void;
  onToggleTag: (tagId: string) => void;
  onClear: () => void;
};

export function SidebarFilter({
  categories,
  keyword,
  selectedTagIds,
  onKeywordChange,
  onToggleTag,
  onClear,
}: SidebarFilterProps) {
  const hasFilter = keyword.length > 0 || selectedTagIds.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="filter-keyword" className="mb-2 text-sm font-medium">
          キーワード検索
        </Label>
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="filter-keyword"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="タイトル・説明文"
            className="pl-8"
          />
        </div>
      </div>

      {categories
        .filter((category) => category.tags.length > 0)
        .map((category) => (
          <div key={category.id}>
            <Separator className="mb-4" />
            <p className="mb-2 text-sm font-medium">{category.name}</p>
            <div className="space-y-2">
              {category.tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTagIds.includes(tag.id)}
                    onCheckedChange={() => onToggleTag(tag.id)}
                  />
                  <Label
                    htmlFor={`tag-${tag.id}`}
                    className="text-sm font-normal"
                  >
                    {tag.value}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="w-full text-muted-foreground"
        >
          <X className="size-4" />
          フィルターをクリア
        </Button>
      )}
    </div>
  );
}

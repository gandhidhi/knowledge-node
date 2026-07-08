"use client";

import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectWithCount } from "@/lib/types/app";
import { apiFetch } from "@/lib/utils/fetcher";
import { formatDate } from "@/lib/utils/format";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithCount[] | null>(null);

  useEffect(() => {
    apiFetch<{ projects: ProjectWithCount[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      .catch((e) => {
        toast.error(e instanceof Error ? e.message : "取得に失敗しました");
        setProjects([]);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">プロジェクト</h1>

      {projects === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          プロジェクトがまだありません
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full transition-colors hover:bg-accent/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FolderOpen className="size-4 text-muted-foreground" />
                    {project.name}
                  </CardTitle>
                  <CardDescription>
                    発表 {project.presentation_count} 件 ・{" "}
                    {formatDate(project.created_at)} 作成
                  </CardDescription>
                </CardHeader>
                {project.description && (
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

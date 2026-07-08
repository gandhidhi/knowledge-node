import { FolderKanban, Mail, Tags } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const menuItems = [
  {
    href: "/admin/emails",
    icon: Mail,
    title: "許可メールアドレス管理",
    description: "サインアップを許可するメールアドレスの追加・削除・CSV一括登録",
  },
  {
    href: "/admin/projects",
    icon: FolderKanban,
    title: "プロジェクト管理",
    description: "プロジェクトの作成・編集・削除、発表・資料・議事録の管理",
  },
  {
    href: "/admin/tags",
    icon: Tags,
    title: "タグ管理",
    description: "タグカテゴリ（学生名・回生・分野など）とタグの管理",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {menuItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Card className="h-full transition-colors hover:bg-accent/50">
            <CardHeader>
              <item.icon className="mb-2 size-6 text-muted-foreground" />
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

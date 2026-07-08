import { TagManager } from "@/components/admin/tag-manager";

export const metadata = { title: "タグ管理" };

export default function AdminTagsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">タグ管理</h2>
      <TagManager />
    </div>
  );
}

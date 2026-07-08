import { EmailManager } from "@/components/admin/email-manager";

export const metadata = { title: "許可メールアドレス管理" };

export default function AdminEmailsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">許可メールアドレス管理</h2>
      <EmailManager />
    </div>
  );
}

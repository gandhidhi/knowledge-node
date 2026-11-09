"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

/** 再設定リンクの有効期限（Supabase の既定値。表示用） */
const LINK_EXPIRY_LABEL = "1時間";

/** リンクのエラーコードを日本語メッセージに変換する */
function interpretError(code: string | null): string | null {
  if (!code) return null;
  if (code === "otp_expired" || code === "access_denied") {
    return `再設定リンクの有効期限（${LINK_EXPIRY_LABEL}）が切れているか、既に使用済みです。もう一度メールアドレスを入力して、再設定メールを送信してください。`;
  }
  return "再設定リンクの処理に失敗しました。リンクは、再設定メールを送信したのと同じブラウザで開いてください。うまくいかない場合は、もう一度メールを送信してください。";
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // エラーはクエリにもフラグメント(#error_code=)にも載りうる。初回のみ評価する。
  const [linkError] = useState<string | null>(() => {
    const hash =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.hash.replace(/^#/, ""))
        : null;
    return interpretError(
      searchParams.get("error") ??
        hash?.get("error_code") ??
        hash?.get("error") ??
        null,
    );
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);

    if (error) {
      if (
        error.code === "over_email_send_rate_limit" ||
        error.message.includes("rate limit") ||
        error.message.includes("after")
      ) {
        toast.error(
          "送信が集中しています。しばらく待ってからもう一度お試しください",
        );
      } else {
        toast.error(`送信に失敗しました: ${error.message}`);
      }
      return;
    }

    // 登録の有無は応答に出ない（アドレスの存在を推測されないため）
    setSent(true);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">パスワードの再設定</CardTitle>
          <CardDescription>
            登録したメールアドレスに再設定用のリンクを送信します
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkError && !sent && (
            <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {linkError}
            </p>
          )}
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                再設定メールを送信しました
              </p>
              <div className="space-y-2 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                <p>
                  登録済みのメールアドレスであれば、再設定用のリンクが届きます。リンクの有効期限は
                  <span className="font-medium text-foreground">
                    {LINK_EXPIRY_LABEL}
                  </span>
                  です。
                </p>
                <p>
                  メールが見当たらない場合は
                  <span className="font-medium text-foreground">
                    迷惑メールフォルダ
                  </span>
                  もご確認ください。リンクは、このブラウザで開いてください。
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSent(false)}
                className="w-full"
              >
                メールアドレスを入力し直す
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">メールアドレス</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "送信中..." : "再設定メールを送信"}
              </Button>
            </form>
          )}
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            ログイン画面へ戻る
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}

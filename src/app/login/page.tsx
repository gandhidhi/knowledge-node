"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

const NOT_ALLOWED_MESSAGE =
  "このメールアドレスは許可されていません。管理者にお問い合わせください。";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const callbackError = searchParams.get("error");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("メールアドレスまたはパスワードが正しくありません");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("メールアドレスが未確認です。確認メールをご確認ください");
      } else {
        toast.error(`ログインに失敗しました: ${error.message}`);
      }
      return;
    }

    router.push("/projects");
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    // 許可リストの事前チェック（FR-1.3: 未許可メールにエラー表示）
    const { data: allowed, error: checkError } = await supabase.rpc(
      "is_email_allowed",
      { check_email: email },
    );
    if (checkError) {
      setLoading(false);
      toast.error("確認処理に失敗しました。時間をおいて再度お試しください");
      return;
    }
    if (!allowed) {
      setLoading(false);
      toast.error(NOT_ALLOWED_MESSAGE);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setLoading(false);

    if (error) {
      // DBトリガーによる拒否は 500 (Database error) として返る
      if (
        error.message.includes("signup_not_allowed") ||
        error.message.includes("Database error")
      ) {
        toast.error(NOT_ALLOWED_MESSAGE);
      } else if (error.message.includes("already registered")) {
        toast.error("このメールアドレスは既に登録されています");
      } else {
        toast.error(`登録に失敗しました: ${error.message}`);
      }
      return;
    }

    // メール確認が無効な場合はそのままセッションが発行される
    if (data.session) {
      router.push("/projects");
      router.refresh();
      return;
    }

    setSignupDone(true);
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">ゼミ発表アーカイブ</CardTitle>
          <CardDescription>
            発表資料とコメントの閲覧にはログインが必要です
          </CardDescription>
        </CardHeader>
        <CardContent>
          {callbackError && (
            <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              認証処理に失敗しました。再度お試しください。
            </p>
          )}
          {signupDone ? (
            <div className="space-y-4 text-center">
              <p className="text-sm">
                確認メールを送信しました。メール内のリンクを開いて登録を完了してください。
              </p>
              <Button
                variant="outline"
                onClick={() => setSignupDone(false)}
                className="w-full"
              >
                戻る
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">ログイン</TabsTrigger>
                <TabsTrigger value="signup">新規登録</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">メールアドレス</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">パスワード</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "ログイン中..." : "ログイン"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">表示名</Label>
                    <Input
                      id="signup-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      placeholder="山田 太郎"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">メールアドレス</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">パスワード</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <p className="text-xs text-muted-foreground">
                      6文字以上で入力してください
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "登録中..." : "新規登録"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

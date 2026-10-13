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

/** 確認リンクの有効期限（Supabase の既定値。表示用） */
const LINK_EXPIRY_LABEL = "1時間";

type CallbackError = {
  message: string;
  /** 期限切れ等、再登録で解決できる場合に新規登録を促す */
  suggestSignup: boolean;
};

/**
 * コールバックのエラーコードを日本語メッセージに変換する。
 * リンク失効（otp_expired）は原因と対処が分かる文言にする。
 */
function interpretError(code: string | null): CallbackError | null {
  if (!code) return null;
  if (code === "otp_expired" || code === "access_denied") {
    return {
      message: `確認リンクの有効期限（${LINK_EXPIRY_LABEL}）が切れているか、既に使用済みです。お手数ですが、もう一度「新規登録」からやり直してください。`,
      suggestSignup: true,
    };
  }
  return {
    message:
      "認証処理に失敗しました。確認メール内のリンクをもう一度開くか、再度登録をお試しください。",
    suggestSignup: true,
  };
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  // エラーはクエリ(?error=)にもフラグメント(#error_code=)にも載りうる。
  // フラグメントはサーバーに届かないためクライアントで読む。初回のみ評価する。
  const [callbackError, setCallbackError] = useState<CallbackError | null>(
    () => {
      const hash =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.hash.replace(/^#/, ""))
          : null;
      const code =
        searchParams.get("error") ??
        hash?.get("error_code") ??
        hash?.get("error") ??
        null;
      return interpretError(code);
    },
  );
  // 期限切れ等は再登録で解決するため、新規登録タブを初期表示にする
  const [tab, setTab] = useState(() =>
    callbackError?.suggestSignup ? "signup" : "login",
  );

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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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

    setCallbackError(null);
    setSignupDone(true);
  }

  /** 確認メールを再送する（期限切れ・未達の救済） */
  async function handleResend() {
    if (!email) {
      toast.error("メールアドレスを入力してください");
      return;
    }
    setResending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setResending(false);
    if (error) {
      toast.error(`再送に失敗しました: ${error.message}`);
      return;
    }
    toast.success("確認メールを再送しました");
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
          {callbackError && !signupDone && (
            <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {callbackError.message}
            </p>
          )}
          {signupDone ? (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                確認メールを送信しました
              </p>
              <div className="space-y-2 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                <p>
                  メール内のリンクを開くと登録が完了します。リンクの有効期限は
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
                  もご確認ください。
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resending}
                className="w-full"
              >
                {resending ? "再送中..." : "確認メールを再送する"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSignupDone(false)}
                className="w-full"
              >
                戻る
              </Button>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
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

"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Provider = "kakao" | "google";

export default function LoginButtons() {
  const [busy, setBusy] = useState<Provider | null>(null);

  const login = async (provider: Provider) => {
    setBusy(provider);
    await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="grid gap-3 w-full max-w-sm">
      <button className="btn" style={{ background: "#FEE500", color: "#191600" }}
        disabled={!!busy} onClick={() => login("kakao")}>
        {busy === "kakao" ? "카카오로 이동 중…" : "카카오로 시작하기"}
      </button>
      <button className="btn btn-line" disabled={!!busy} onClick={() => login("google")}>
        {busy === "google" ? "구글로 이동 중…" : "구글로 시작하기"}
      </button>
    </div>
  );
}

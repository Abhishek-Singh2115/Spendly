import { useState } from "react";
import { supabase } from "../supabase";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleReset = async () => {
        if (!email) {
            setError("Please enter your email");
            return;
        }

        setLoading(true);
        setError("");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/reset-password",
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // 👉 SPLITWISE FLOW: go to success page
        setSuccess("Reset link sent! Check your email.");
        setLoading(false);
    };

    const S = {
        page: {
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "var(--bg)",
        },
        wrap: {
            width: "100%",
            maxWidth: 360,
        },
        logo: {
            textAlign: "center",
            marginBottom: 10,
            fontSize: 34,
            fontWeight: 900,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        },
        sub: {
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 14,
            marginBottom: 24,
        },
        card: {
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "22px 20px",
        },
        label: {
            fontSize: 12,
            color: "var(--muted)",
            fontWeight: 600,
            marginBottom: 6,
            display: "block",
        },
        input: {
            width: "100%",
            padding: "11px 14px",
            borderRadius: 11,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            fontSize: 15,
            marginBottom: 12,
            outline: "none",
        },
        btn: {
            width: "100%",
            padding: "13px 0",
            borderRadius: 12,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 15,
            fontWeight: 700,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff",
            opacity: loading ? 0.7 : 1,
            marginTop: 6,
        },
        err: {
            color: "var(--red)",
            fontSize: 13,
            textAlign: "center",
            marginTop: 8,
            padding: "8px 12px",
            background: "rgba(244,63,94,.1)",
            borderRadius: 8,
        },
        back: {
            textAlign: "center",
            marginTop: 14,
            fontSize: 13,
            color: "#6366f1",
            cursor: "pointer",
        },
    };

    return (
        <div style={S.page}>
            <div style={S.wrap}>
                <div style={S.logo}>Spendly</div>
                <div style={S.sub}>Reset your password 🔐</div>

                <div style={S.card}>
                    <label style={S.label}>Email</label>

                    <input
                        style={S.input}
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                        }}
                    />

                    {error && <div style={S.err}>{error}</div>}
                    {success && (
                        <div style={{
                            marginTop: 10,
                            padding: "10px",
                            borderRadius: 8,
                            background: "rgba(34,197,94,0.1)",
                            color: "#22c55e",
                            textAlign: "center",
                            fontSize: 13
                        }}>
                            {success}
                        </div>
                    )}

                    <button
                        style={S.btn}
                        onClick={handleReset}s
                        disabled={loading || success}
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>

                    <div
                        style={S.back}
                        onClick={() => window.dispatchEvent(new Event("close-forgot-password"))}
                    >
                        ← Back to login
                    </div>
                </div>
            </div>
        </div>
    );
}
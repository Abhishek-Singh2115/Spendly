import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ Handle reset link session
  useEffect(() => {
    const hash = window.location.hash;

    if (!hash.includes("access_token")) {
      setError("Invalid or expired reset link");
      return;
    }

    const params = new URLSearchParams(hash.substring(1));

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token) {
      setError("Invalid or expired reset link");
      return;
    }

    (async () => {
      let result;

      if (refresh_token) {
        result = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
      } else {
        result = await supabase.auth.setSession({
          access_token,
        });
      }

      if (result.error) {
        setError("Failed to restore session");
      } else {
        setSessionReady(true);
      }
    })();
  }, []);

  // ✅ Update password
  const handleUpdate = async () => {
    if (!password || !confirm) {
      setError("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
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
    inputWrap: {
      position: "relative",
    },
    input: {
      width: "100%",
      padding: "11px 14px",
      borderRadius: 11,
      border: "1px solid var(--border)",
      background: "#111",
      fontSize: 15,
      marginBottom: 12,
      color: "#fff",
    },
    eye: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      cursor: "pointer",
      color: "#aaa",
      display: "flex",
      alignItems: "center",
    },
    btn: {
      width: "100%",
      padding: "13px",
      borderRadius: 12,
      border: "none",
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      color: "#fff",
      fontWeight: 700,
      cursor: "pointer",
      opacity: loading ? 0.7 : 1,
    },
    err: {
      color: "#f43f5e",
      fontSize: 13,
      marginBottom: 10,
      textAlign: "center",
    },
  };

  // ✅ SUCCESS SCREEN
  if (success) {
    return (
      <div style={S.page}>
        <div style={S.wrap}>
          <div style={S.logo}>Spendly</div>

          <div style={S.card}>
            <div style={{ fontSize: 40, textAlign: "center" }}>✅</div>

            <h3 style={{ textAlign: "center" }}>Password updated</h3>

            <p style={{ textAlign: "center", fontSize: 14 }}>
              Your password has been successfully changed.
            </p>

            <button
              style={S.btn}
              onClick={() => (window.location.href = "/")}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🔐 MAIN UI
  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.logo}>Spendly</div>

        <div style={S.card}>
          <h3 style={{ textAlign: "center" }}>Set new password</h3>

          <label style={S.label}>New Password</label>
          <div style={S.inputWrap}>
            <input
              style={{ ...S.input, paddingRight: 35 }}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
            />
            <span
              style={S.eye}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          <label style={S.label}>Confirm Password</label>
          <div style={S.inputWrap}>
            <input
              style={{ ...S.input, paddingRight: 35 }}
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError("");
              }}
            />
            <span
              style={S.eye}
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          {error && <div style={S.err}>{error}</div>}

          {!sessionReady && !error && (
            <div style={{ textAlign: "center", fontSize: 13, color: "#aaa", marginBottom: 10 }}>
              Preparing secure session...
            </div>
          )}

          <button
            style={S.btn}
            onClick={handleUpdate}
            disabled={loading || success || !sessionReady}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
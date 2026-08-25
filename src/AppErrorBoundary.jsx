import { Component } from "react";
import { trackUiError } from "./lib/analytics.js";

/**
 * Filet global — évite l’écran blanc / « Chargement » mort après un crash React.
 * Télémétrie : PostHog `ui_error` uniquement (pas de Sentry).
 */
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    try {
      trackUiError({
        reason: String(error?.message || error || "unknown").slice(0, 160),
        context: "error_boundary",
        source: String(info?.componentStack || "").slice(0, 120),
        error_kind: "react",
      });
    } catch {
      /* ignore */
    }
    if (import.meta.env.DEV) {
      console.error("[AppErrorBoundary]", error, info);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false });
    try {
      window.location.assign("/app");
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#000514",
          color: "#e8eef7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          gap: 16,
        }}
      >
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Un souci est survenu</p>
        <p style={{ margin: 0, fontSize: 14, color: "#9aafc4", maxWidth: 320, lineHeight: 1.45 }}>
          Recharge l’app — ton plan reste enregistré. Si ça continue, écris à support@myswym.app.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          style={{
            marginTop: 8,
            minHeight: 48,
            padding: "12px 22px",
            borderRadius: 14,
            border: "none",
            background: "#3d7eff",
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Relancer
        </button>
      </div>
    );
  }
}

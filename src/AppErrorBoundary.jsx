import { Component } from "react";
import { trackUiError } from "./lib/analytics.js";
import { isAnonymousUser } from "./lib/anonymous-auth.js";
import { CURRENT_APP_VERSION } from "./lib/app-version.js";
import {
  buildErrorStatusCopy,
  buildSupportMailto,
  isNavigatorOffline,
  makeUiErrorCode,
} from "./lib/ui-error-recovery.js";
import { supabase } from "./supabase.js";
import AppStatusScreen from "./app-shell/AppStatusScreen.jsx";

/**
 * Filet React : retour accueil + diagnostic + mailto support.
 */
export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      offline: false,
      errorCode: "E-0000",
      errorMessage: "",
      hasUser: false,
      isAnonymous: false,
    };
    /** Évite que le tap qui a planté déclenche « Retour à l’accueil ». */
    this.ignoreActionsUntil = 0;
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    const errorMessage = String(error?.message || error || "unknown").slice(0, 160);
    const errorCode = makeUiErrorCode(errorMessage);
    const offline = isNavigatorOffline();
    this.ignoreActionsUntil = Date.now() + 500;
    this.setState({
      errorMessage,
      errorCode,
      offline,
    });
    try {
      trackUiError({
        reason: errorMessage,
        context: "error_boundary",
        source: String(info?.componentStack || "").slice(0, 120),
        error_kind: "react",
        error_code: errorCode,
        offline,
      });
    } catch {
      /* ignore */
    }
    if (import.meta.env.DEV) {
      console.error("[AppErrorBoundary]", errorCode, error, info);
    }
    void this.loadAuthHint();
  }

  componentDidMount() {
    if (typeof window === "undefined") return;
    window.addEventListener("online", this.syncOnline);
    window.addEventListener("offline", this.syncOnline);
  }

  componentWillUnmount() {
    if (typeof window === "undefined") return;
    window.removeEventListener("online", this.syncOnline);
    window.removeEventListener("offline", this.syncOnline);
  }

  componentDidUpdate(prevProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  syncOnline = () => {
    if (!this.state.hasError) return;
    this.setState({ offline: isNavigatorOffline() });
  };

  loadAuthHint = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user || null;
      if (!this.state.hasError) return;
      this.setState({
        hasUser: !!user,
        isAnonymous: isAnonymousUser(user),
      });
    } catch {
      /* ignore */
    }
  };

  goPath = (path) => {
    if (Date.now() < this.ignoreActionsUntil) return;
    this.setState({ hasError: false });
    if (window.location.pathname === path) {
      window.location.reload();
      return;
    }
    window.location.assign(path);
  };

  handlePrimary = (action) => {
    if (Date.now() < this.ignoreActionsUntil) return;
    if (action === "home") {
      this.goPath("/app");
      return;
    }
    this.goPath("/connexion");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const {
      offline,
      errorCode,
      errorMessage,
      hasUser,
      isAnonymous,
    } = this.state;

    const copy = buildErrorStatusCopy({
      offline,
      hasUser,
      isAnonymous,
      errorCode,
    });

    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const supportHref = buildSupportMailto({
      code: errorCode,
      message: errorMessage,
      path,
      appVersion: CURRENT_APP_VERSION || "",
    });

    const tertiaryLabel = copy.showHome && copy.showLogin
      ? "Se connecter"
      : copy.showRegister
        ? "Créer un compte"
        : null;
    const onTertiary = copy.showHome && copy.showLogin
      ? () => this.goPath("/connexion")
      : copy.showRegister
        ? () => this.goPath("/inscription")
        : null;

    return (
      <AppStatusScreen
        title={copy.title}
        body={copy.body}
        note={copy.note}
        primaryLabel={copy.primaryLabel}
        onPrimary={() => this.handlePrimary(copy.primaryAction)}
        primaryAutoFocus={false}
        tertiaryLabel={tertiaryLabel}
        onTertiary={onTertiary}
        linkLabel="Écrire au support"
        linkHref={supportHref}
        meta={copy.meta}
      />
    );
  }
}

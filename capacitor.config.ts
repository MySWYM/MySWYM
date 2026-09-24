import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.myswym.ios",
  appName: "MySWYM",
  webDir: "dist",
  backgroundColor: "#006bfd",
  ios: {
    contentInset: "never",
    preferredContentMode: "mobile",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#006bfd",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: "body",
      autoBackdropColor: "auto",
    },
    LocalNotifications: {
      sound: "default",
    },
  },
};

export default config;

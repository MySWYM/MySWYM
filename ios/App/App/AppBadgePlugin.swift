import Foundation
import Capacitor
import UIKit
import UserNotifications

/// Pastille rouge + lecture du jeton APNs (cache AppDelegate).
@objc(AppBadgePlugin)
public class AppBadgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppBadgePlugin"
    public let jsName = "AppBadge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getApnsToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "replayApnsToken", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openAppSettings", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getNotificationAuthStatus", returnType: CAPPluginReturnPromise),
    ]

    @objc func set(_ call: CAPPluginCall) {
        let count = max(0, call.getInt("count") ?? 0)
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = count
            call.resolve(["count": count])
        }
    }

    @objc func clear(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = 0
            UNUserNotificationCenter.current().removeAllDeliveredNotifications()
            call.resolve(["count": 0])
        }
    }

    @objc func get(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            call.resolve(["count": UIApplication.shared.applicationIconBadgeNumber])
        }
    }

    /// Hex lowercase du dernier jeton APNs (nil si pas encore reçu).
    @objc func getApnsToken(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let hex = AppDelegate.cachedApnsTokenHex {
                call.resolve(["token": hex])
            } else {
                call.resolve(["token": NSNull()])
            }
        }
    }

    /// Re-poste le jeton vers Capacitor Push (si le listener JS a raté le 1er envoi).
    @objc func replayApnsToken(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            let ok = AppDelegate.replayCachedApnsToken()
            call.resolve([
                "ok": ok,
                "token": AppDelegate.cachedApnsTokenHex as Any,
            ])
        }
    }

    /// Ouvre Réglages iPhone → MySWYM (notifications, etc.).
    @objc func openAppSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else {
                call.reject("no_settings_url")
                return
            }
            UIApplication.shared.open(url, options: [:]) { ok in
                if ok { call.resolve(["ok": true]) }
                else { call.reject("open_failed") }
            }
        }
    }

    /// Source de vérité = Réglages → MySWYM → Notifications.
    /// status: "granted" | "denied" | "prompt"
    @objc func getNotificationAuthStatus(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let status: String
            switch settings.authorizationStatus {
            case .authorized, .provisional, .ephemeral:
                status = "granted"
            case .denied:
                status = "denied"
            case .notDetermined:
                status = "prompt"
            @unknown default:
                status = "prompt"
            }
            call.resolve([
                "status": status,
                "authorizationStatus": settings.authorizationStatus.rawValue,
            ])
        }
    }
}

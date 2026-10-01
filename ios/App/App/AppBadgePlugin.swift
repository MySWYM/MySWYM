import Foundation
import Capacitor
import UIKit
import UserNotifications

/// Pastille rouge sur l’icône (UIApplication.applicationIconBadgeNumber).
@objc(AppBadgePlugin)
public class AppBadgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppBadgePlugin"
    public let jsName = "AppBadge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "set", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "get", returnType: CAPPluginReturnPromise),
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
}

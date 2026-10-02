import UIKit
import AVFoundation
import UserNotifications
import Capacitor

/// Sons UI : catégorie ambient, le bouton sonnerie / vibreur coupe le son.
enum MySWYMAudio {
    private static var observing = false
    private static var resetting = false

    static func useAmbientSession() {
        if resetting { return }
        resetting = true
        defer { resetting = false }
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            /* simulateur / session déjà prise */
        }
        guard !observing else { return }
        observing = true
        NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: session,
            queue: .main
        ) { _ in
            useAmbientSession()
        }
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    /// Dernier jeton APNs (hex lowercase). Le plugin JS peut le relire si le listener a raté le boot.
    private static var lastDeviceToken: Data?
    static var cachedApnsTokenHex: String? {
        guard let data = lastDeviceToken else { return nil }
        return data.map { String(format: "%02x", $0) }.joined()
    }

    @discardableResult
    static func replayCachedApnsToken() -> Bool {
        guard let data = lastDeviceToken else { return false }
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: data)
        return true
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        MySWYMAudio.useAmbientSession()
        // Pas de popup au boot (refus massif). Si déjà autorisé, enregistre le jeton APNs.
        Self.registerForRemoteNotificationsIfAuthorized()
        return true
    }

    /// Enregistre APNs seulement si l’utilisateur a déjà Autorisé (Réglages ou après 1re séance).
    private static func registerForRemoteNotificationsIfAuthorized() {
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            let ok = settings.authorizationStatus == .authorized
                || settings.authorizationStatus == .provisional
                || settings.authorizationStatus == .ephemeral
            guard ok else { return }
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    /// Transmet le jeton APNs au plugin Capacitor. Sans ça, device_push_tokens reste vide.
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Self.lastDeviceToken = deviceToken
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
        print("[MySWYM] APNs registration failed:", error.localizedDescription)
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        MySWYMAudio.useAmbientSession()
        // Rejoue le cache seulement si déjà autorisé (pas de popup ici).
        Self.registerForRemoteNotificationsIfAuthorized()
        Self.replayCachedApnsToken()
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

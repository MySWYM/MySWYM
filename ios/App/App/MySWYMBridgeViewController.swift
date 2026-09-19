import UIKit
import Capacitor

/// Enregistre le plugin IAP local (hors packageClassList Capacitor / npm).
class MySWYMBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleIapPlugin())
    }
}

import UIKit
import Capacitor

/// Enregistre le plugin IAP local (hors packageClassList Capacitor / npm).
class MySWYMBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleIapPlugin())
        bridge?.registerPluginInstance(AppleHealthPlugin())
        disableWebViewBounce()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        disableWebViewBounce()
    }

    private func disableWebViewBounce() {
        guard let scrollView = webView?.scrollView else { return }
        scrollView.bounces = false
        scrollView.alwaysBounceVertical = false
        scrollView.alwaysBounceHorizontal = false
    }
}

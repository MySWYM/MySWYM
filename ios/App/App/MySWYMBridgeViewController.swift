import UIKit
import Capacitor

/// Enregistre le plugin IAP local (hors packageClassList Capacitor / npm).
class MySWYMBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(AppleIapPlugin())
        bridge?.registerPluginInstance(AppleHealthPlugin())
        bridge?.registerPluginInstance(StoryStickerPlugin())
        bridge?.registerPluginInstance(AppBadgePlugin())
        hardenWebView()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        hardenWebView()
    }

    private func hardenWebView() {
        guard let webView else { return }
        webView.allowsLinkPreview = false
        let scrollView = webView.scrollView
        // Bounce vertical : sensation scroll iOS (pas page web figée).
        scrollView.bounces = true
        scrollView.alwaysBounceVertical = true
        scrollView.alwaysBounceHorizontal = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.showsHorizontalScrollIndicator = false
    }
}

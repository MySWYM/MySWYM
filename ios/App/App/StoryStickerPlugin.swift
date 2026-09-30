import UIKit
import Capacitor

/// Copie un PNG (fond transparent) dans le presse-papiers iOS, pour le coller en story.
@objc(StoryStickerPlugin)
public class StoryStickerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoryStickerPlugin"
    public let jsName = "StorySticker"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "copyPng", returnType: CAPPluginReturnPromise),
    ]

    @objc func copyPng(_ call: CAPPluginCall) {
        guard let b64 = call.getString("base64"),
              let data = Data(base64Encoded: b64),
              UIImage(data: data) != nil else {
            call.reject("Image illisible")
            return
        }
        UIPasteboard.general.setItems([["public.png": data]], options: [:])
        call.resolve(["ok": true])
    }
}

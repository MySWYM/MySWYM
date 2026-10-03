import UIKit
import Photos
import Capacitor

/// Copie / enregistre un PNG (stories Instagram, carte séance).
@objc(StoryStickerPlugin)
public class StoryStickerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoryStickerPlugin"
    public let jsName = "StorySticker"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "copyPng", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "savePng", returnType: CAPPluginReturnPromise),
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

    @objc func savePng(_ call: CAPPluginCall) {
        guard let b64 = call.getString("base64"),
              let data = Data(base64Encoded: b64),
              let image = UIImage(data: data) else {
            call.reject("Image illisible")
            return
        }

        let finish: (Bool, String?) -> Void = { ok, message in
            DispatchQueue.main.async {
                if ok {
                    call.resolve(["ok": true])
                } else {
                    call.reject(message ?? "Enregistrement impossible")
                }
            }
        }

        if #available(iOS 14, *) {
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                guard status == .authorized || status == .limited else {
                    finish(false, "Autorise l’accès Photos pour enregistrer l’image")
                    return
                }
                Self.writeImage(image, finish: finish)
            }
        } else {
            PHPhotoLibrary.requestAuthorization { status in
                guard status == .authorized else {
                    finish(false, "Autorise l’accès Photos pour enregistrer l’image")
                    return
                }
                Self.writeImage(image, finish: finish)
            }
        }
    }

    private static func writeImage(_ image: UIImage, finish: @escaping (Bool, String?) -> Void) {
        PHPhotoLibrary.shared().performChanges({
            PHAssetChangeRequest.creationRequestForAsset(from: image)
        }, completionHandler: { ok, error in
            finish(ok, error?.localizedDescription)
        })
    }
}

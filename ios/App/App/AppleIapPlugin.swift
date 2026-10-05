import Foundation
import Capacitor
import StoreKit

@objc(AppleIapPlugin)
public class AppleIapPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleIapPlugin"
    public let jsName = "AppleIap"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestReview", returnType: CAPPluginReturnPromise),
    ]

    private static let defaultProductIds = [
        "app.myswym.ios.premium.monthly",
        "app.myswym.ios.premium.annual",
    ]

    private var updates: Task<Void, Never>?

    override public func load() {
        updates = Task { [weak self] in
            for await update in Transaction.updates {
                guard let self else { return }
                if case .verified(let transaction) = update {
                    self.notifyListeners("transactionUpdated", data: [
                        "jws": update.jwsRepresentation,
                        "productId": transaction.productID,
                        "transactionId": String(transaction.id),
                    ], retainUntilConsumed: true)
                }
            }
        }
    }

    deinit {
        updates?.cancel()
    }

    @objc func getProducts(_ call: CAPPluginCall) {
        let ids = call.getArray("productIds", String.self) ?? Self.defaultProductIds
        Task {
            do {
                let products = try await Product.products(for: Set(ids))
                let payload = products.map { product in
                    [
                        "id": product.id,
                        "displayName": product.displayName,
                        "description": product.description,
                        "displayPrice": product.displayPrice,
                        "price": NSDecimalNumber(decimal: product.price).doubleValue,
                    ]
                }
                call.resolve(["products": payload])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId"), !productId.isEmpty else {
            call.reject("productId manquant")
            return
        }
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Offre introuvable sur l’App Store")
                    return
                }
                var options = Set<Product.PurchaseOption>()
                if let raw = call.getString("appAccountToken"), let uuid = UUID(uuidString: raw) {
                    options.insert(.appAccountToken(uuid))
                }
                let result = try await product.purchase(options: options)
                switch result {
                case .success(let verification):
                    guard case .verified(let transaction) = verification else {
                        call.reject("Transaction Apple non vérifiée")
                        return
                    }
                    call.resolve([
                        "jws": verification.jwsRepresentation,
                        "transactionId": String(transaction.id),
                    ])
                case .userCancelled:
                    call.reject("Achat annulé", "USER_CANCELLED")
                case .pending:
                    call.reject("Paiement en attente", "PENDING")
                @unknown default:
                    call.reject("Achat impossible")
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    /// Appelé par le JS seulement après un apple-iap-sync réussi.
    @objc func finish(_ call: CAPPluginCall) {
        guard let raw = call.getString("transactionId"), let target = UInt64(raw) else {
            call.reject("transactionId manquant")
            return
        }
        Task {
            for await result in Transaction.unfinished {
                guard case .verified(let transaction) = result else { continue }
                if transaction.id == target {
                    await transaction.finish()
                    call.resolve()
                    return
                }
            }
            call.resolve(["missing": true])
        }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                var transactions: [[String: String]] = []
                for await entitlement in Transaction.currentEntitlements {
                    if case .verified(let transaction) = entitlement {
                        transactions.append([
                            "jws": entitlement.jwsRepresentation,
                            "productId": transaction.productID,
                        ])
                    }
                }
                call.resolve(["transactions": transactions])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let scene = self.bridge?.webView?.window?.windowScene else {
                call.reject("Fenêtre iOS introuvable")
                return
            }
            do {
                try await AppStore.showManageSubscriptions(in: scene)
                call.resolve()
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    /// Feuille système Apple. L’OS décide si elle s’affiche.
    @objc func requestReview(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let scene = self.bridge?.webView?.window?.windowScene else {
                call.reject("Fenêtre iOS introuvable")
                return
            }
            SKStoreReviewController.requestReview(in: scene)
            call.resolve()
        }
    }
}

import Foundation
import Capacitor
import HealthKit

@objc(AppleHealthPlugin)
public class AppleHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AppleHealthPlugin"
    public let jsName = "AppleHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fetchSummary", returnType: CAPPluginReturnPromise),
    ]

    private let store = HKHealthStore()

    /// Lecture seule : séances de natation + fréquence cardiaque. Pas de poids, pas de taille, pas d’écriture.
    private var readTypes: Set<HKObjectType> {
        var types: Set<HKObjectType> = [HKObjectType.workoutType()]
        if let heartRate = HKObjectType.quantityType(forIdentifier: .heartRate) {
            types.insert(heartRate)
        }
        return types
    }

    @objc func status(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Apple Santé n’est pas disponible sur cet appareil.")
            return
        }
        store.requestAuthorization(toShare: nil, read: readTypes) { success, error in
            DispatchQueue.main.async {
                if let error {
                    call.reject(error.localizedDescription)
                    return
                }
                call.resolve(["ok": success])
            }
        }
    }

    /// Compte les séances natation récentes et la dernière FC, pour que l’accès Santé serve vraiment.
    @objc func fetchSummary(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("Apple Santé n’est pas disponible sur cet appareil.")
            return
        }

        let workoutType = HKObjectType.workoutType()
        let swim = HKQuery.predicateForWorkouts(with: .swimming)
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let workoutQuery = HKSampleQuery(sampleType: workoutType, predicate: swim, limit: 30, sortDescriptors: [sort]) { [weak self] _, samples, error in
            guard let self else { return }
            if let error {
                DispatchQueue.main.async { call.reject(error.localizedDescription) }
                return
            }
            let workouts = (samples as? [HKWorkout]) ?? []
            let swimCount = workouts.count
            let latestEnd = workouts.first?.endDate
            self.readLatestHeartRate { bpm in
                var payload: [String: Any] = ["swimCount": swimCount]
                if let latestEnd {
                    payload["latestWorkoutAt"] = ISO8601DateFormatter().string(from: latestEnd)
                }
                if let bpm {
                    payload["latestHeartRate"] = bpm
                }
                DispatchQueue.main.async { call.resolve(payload) }
            }
        }
        store.execute(workoutQuery)
    }

    private func readLatestHeartRate(done: @escaping (Int?) -> Void) {
        guard let heartRate = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            done(nil)
            return
        }
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(sampleType: heartRate, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
            let sample = samples?.first as? HKQuantitySample
            let unit = HKUnit.count().unitDivided(by: HKUnit.minute())
            let bpm = sample.map { Int($0.quantity.doubleValue(for: unit).rounded()) }
            done(bpm)
        }
        store.execute(query)
    }
}

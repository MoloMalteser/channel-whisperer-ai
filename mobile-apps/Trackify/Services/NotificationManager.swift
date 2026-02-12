import Foundation
import UserNotifications

actor NotificationManager {
    static let shared = NotificationManager()

    func requestAuthorizationIfNeeded() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .notDetermined else { return }
        try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    }

    func scheduleGoalReached(for channel: TrackedChannel, currentCount: Int) async {
        let content = UNMutableNotificationContent()
        content.title = "Goal reached 🎉"
        content.body = "\(channel.name) just hit \(currentCount.formatted()) followers."
        content.sound = .default

        let request = UNNotificationRequest(
            identifier: "goal-\(channel.id.uuidString)",
            content: content,
            trigger: nil
        )

        try? await UNUserNotificationCenter.current().add(request)
    }
}

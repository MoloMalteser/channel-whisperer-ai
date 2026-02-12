import Foundation
import SwiftData

@Model
final class UserProfile {
    @Attribute(.unique) var id: UUID
    var displayName: String
    var notificationsEnabled: Bool
    var refreshIntervalMinutes: Int
    var createdAt: Date

    init(
        displayName: String = "Creator",
        notificationsEnabled: Bool = true,
        refreshIntervalMinutes: Int = 30,
        createdAt: Date = .now
    ) {
        self.id = UUID()
        self.displayName = displayName
        self.notificationsEnabled = notificationsEnabled
        self.refreshIntervalMinutes = refreshIntervalMinutes
        self.createdAt = createdAt
    }
}

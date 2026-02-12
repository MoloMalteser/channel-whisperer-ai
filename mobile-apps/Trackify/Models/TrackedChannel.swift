import Foundation
import SwiftData

@Model
final class TrackedChannel {
    @Attribute(.unique) var id: UUID
    var name: String
    var url: String
    var platformRawValue: String
    var followerGoal: Int?
    var isActive: Bool
    var createdAt: Date

    @Relationship(deleteRule: .cascade, inverse: \FollowerSnapshot.channel)
    var snapshots: [FollowerSnapshot] = []

    init(
        name: String,
        url: String,
        platform: Platform,
        followerGoal: Int? = nil,
        isActive: Bool = true,
        createdAt: Date = .now
    ) {
        self.id = UUID()
        self.name = name
        self.url = url
        self.platformRawValue = platform.rawValue
        self.followerGoal = followerGoal
        self.isActive = isActive
        self.createdAt = createdAt
    }

    var platform: Platform {
        get { Platform(rawValue: platformRawValue) ?? .whatsapp }
        set { platformRawValue = newValue.rawValue }
    }

    var latestSnapshot: FollowerSnapshot? {
        snapshots.sorted { $0.createdAt > $1.createdAt }.first
    }
}

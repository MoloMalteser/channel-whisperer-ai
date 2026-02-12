import Foundation
import SwiftData

@Model
final class FollowerSnapshot {
    @Attribute(.unique) var id: UUID
    var followerCount: Int
    var rawText: String
    var createdAt: Date

    @Relationship var channel: TrackedChannel?

    init(
        followerCount: Int,
        rawText: String,
        createdAt: Date = .now,
        channel: TrackedChannel? = nil
    ) {
        self.id = UUID()
        self.followerCount = followerCount
        self.rawText = rawText
        self.createdAt = createdAt
        self.channel = channel
    }
}

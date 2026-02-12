import SwiftUI
import SwiftData

@main
struct TrackifyApp: App {
    private var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            TrackedChannel.self,
            FollowerSnapshot.self,
            UserProfile.self
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        return try! ModelContainer(for: schema, configurations: [configuration])
    }()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .modelContainer(sharedModelContainer)
                .task {
                    await NotificationManager.shared.requestAuthorizationIfNeeded()
                }
        }
        .backgroundTask(.appRefresh("com.trackify.refresh")) {
            await ChannelScraper.shared.refreshAll()
        }
    }
}

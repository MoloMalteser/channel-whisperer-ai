import SwiftUI
import SwiftData
import BackgroundTasks

@main
struct TrackifyApp: App {
    @Environment(\.scenePhase) private var scenePhase

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
                    await ChannelScraper.shared.scheduleBackgroundRefresh()
                }
        }
        .onChange(of: scenePhase) { newPhase in
            guard newPhase == .background else { return }
            Task { await ChannelScraper.shared.scheduleBackgroundRefresh() }
        }
        .backgroundTask(.appRefresh(ChannelScraper.refreshIdentifier)) {
            await ChannelScraper.shared.handleBackgroundRefresh()
        }
    }
}

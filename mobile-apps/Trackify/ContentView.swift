import SwiftUI
import SwiftData

struct ContentView: View {
    @State private var selectedTab: TrackifyTab = .channels

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.black, Color.white.opacity(0.15), Color.black],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Group {
                    switch selectedTab {
                    case .channels:
                        ChannelsView()
                    case .analytics:
                        AnalyticsView()
                    case .settings:
                        SettingsView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                DraggableBottomNav(selectedTab: $selectedTab)
            }
            .padding(.top, 16)
            .padding(.horizontal, 16)
        }
    }
}

enum TrackifyTab: Int, CaseIterable {
    case channels
    case analytics
    case settings

    var title: String {
        switch self {
        case .channels: return "Channels"
        case .analytics: return "Analytics"
        case .settings: return "Settings"
        }
    }

    var systemImage: String {
        switch self {
        case .channels: return "bubble.left.and.bubble.right"
        case .analytics: return "chart.bar.xaxis"
        case .settings: return "gearshape"
        }
    }
}

import SwiftUI
import SwiftData
import Charts

struct AnalyticsView: View {
    @Query(sort: \TrackedChannel.createdAt) private var channels: [TrackedChannel]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Analytics")
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)

                if let channel = channels.first {
                    HeroCardView(channel: channel)

                    statsGrid(for: channel)
                    chartSection(for: channel)
                } else {
                    Text("Add a channel to start seeing analytics.")
                        .foregroundStyle(.white.opacity(0.7))
                        .padding(24)
                        .glassmorphic(cornerRadius: 24)
                }
            }
            .padding(.bottom, 24)
        }
    }

    private func statsGrid(for channel: TrackedChannel) -> some View {
        let latestCount = channel.latestSnapshot?.followerCount ?? 0
        let previousCount = channel.snapshots.sorted { $0.createdAt > $1.createdAt }.dropFirst().first?.followerCount ?? latestCount
        let delta = latestCount - previousCount
        let deltaText = delta >= 0 ? "+\(delta)" : "\(delta)"

        return LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            statCard(title: "Current", value: latestCount.formatted())
            statCard(title: "Change", value: deltaText)
            statCard(title: "Checks", value: channel.snapshots.count.formatted())
            statCard(title: "Goal", value: channel.followerGoal?.formatted() ?? "—")
        }
    }

    private func chartSection(for channel: TrackedChannel) -> some View {
        let snapshots = channel.snapshots.sorted { $0.createdAt < $1.createdAt }

        return VStack(alignment: .leading, spacing: 12) {
            Text("Trend")
                .font(.headline)
                .foregroundStyle(.white)

            Chart(snapshots) { snapshot in
                LineMark(
                    x: .value("Time", snapshot.createdAt),
                    y: .value("Followers", snapshot.followerCount)
                )
                .foregroundStyle(.white)
                PointMark(
                    x: .value("Time", snapshot.createdAt),
                    y: .value("Followers", snapshot.followerCount)
                )
                .foregroundStyle(.white)
            }
            .chartXAxis(.hidden)
            .chartYAxis {
                AxisMarks(position: .leading) {
                    AxisValueLabel()
                        .foregroundStyle(.white.opacity(0.6))
                }
            }
            .frame(height: 220)
            .padding(12)
            .glassmorphic(cornerRadius: 24)
        }
    }

    private func statCard(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
            Text(value)
                .font(.title2.bold())
                .foregroundStyle(.white)
        }
        .padding(16)
        .glassmorphic(cornerRadius: 20)
    }
}

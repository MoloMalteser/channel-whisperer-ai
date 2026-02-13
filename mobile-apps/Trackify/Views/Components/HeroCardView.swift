import SwiftUI

struct HeroCardView: View {
    let channel: TrackedChannel

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text(channel.platform.displayName.uppercased())
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                    Text(channel.name)
                        .font(.title2.bold())
                        .foregroundStyle(.white)
                }
                Spacer()
                Image(systemName: channel.platform.iconName)
                    .font(.title)
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Followers")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))
                Text(channel.latestSnapshot?.followerCount.formatted() ?? "0")
                    .font(.system(size: 44, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .contentTransition(.numericText())
                    .animation(.smooth(duration: 0.4), value: channel.latestSnapshot?.followerCount ?? 0)
            }

            if let goal = channel.followerGoal {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Goal: \(goal.formatted())")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                    ProgressView(value: Double(channel.latestSnapshot?.followerCount ?? 0), total: Double(goal))
                        .tint(.white)
                }
            }
        }
        .padding(24)
        .glassmorphic(cornerRadius: 32)
    }
}

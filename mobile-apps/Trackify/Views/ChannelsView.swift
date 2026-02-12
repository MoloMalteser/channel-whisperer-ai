import SwiftUI
import SwiftData

struct ChannelsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \TrackedChannel.createdAt) private var channels: [TrackedChannel]
    @State private var selectedChannelID: UUID?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header

                if let channel = selectedChannel {
                    HeroCardView(channel: channel)
                        .transition(.opacity.combined(with: .scale))
                } else {
                    emptyState
                }

                channelStrip

                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Checks")
                        .font(.headline)
                        .foregroundStyle(.white)

                    ForEach(selectedChannel?.snapshots.prefix(3) ?? []) { snapshot in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(snapshot.followerCount.formatted())
                                    .font(.headline)
                                    .foregroundStyle(.white)
                                Text(snapshot.createdAt.formatted(date: .abbreviated, time: .shortened))
                                    .font(.caption)
                                    .foregroundStyle(.white.opacity(0.7))
                            }
                            Spacer()
                            Image(systemName: "waveform.path.ecg")
                                .foregroundStyle(.white.opacity(0.7))
                        }
                        .padding(16)
                        .glassmorphic(cornerRadius: 20)
                    }
                }
            }
            .padding(.bottom, 24)
        }
        .onAppear {
            if selectedChannelID == nil {
                selectedChannelID = channels.first?.id
            }
        }
        .animation(.easeInOut, value: selectedChannelID)
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("Trackify")
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)
                Text("Realtime follower intelligence")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.7))
            }
            Spacer()
            Button {
                addSampleChannel()
            } label: {
                Image(systemName: "plus")
                    .foregroundStyle(.white)
                    .padding(12)
                    .background(Circle().fill(Color.white.opacity(0.2)))
            }
        }
    }

    private var channelStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(channels) { channel in
                    ChannelPill(channel: channel, isSelected: channel.id == selectedChannelID)
                        .onTapGesture {
                            selectedChannelID = channel.id
                        }
                }
            }
            .padding(.vertical, 4)
        }
    }

    private var emptyState: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Add your first channel")
                .font(.title2.bold())
                .foregroundStyle(.white)
            Text("Start by adding a WhatsApp channel URL to watch follower growth in real time.")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
        }
        .padding(24)
        .glassmorphic(cornerRadius: 32)
    }

    private var selectedChannel: TrackedChannel? {
        channels.first { $0.id == selectedChannelID } ?? channels.first
    }

    private func addSampleChannel() {
        guard channels.isEmpty else { return }
        let channel = TrackedChannel(
            name: "Growth Lab",
            url: "https://chat.whatsapp.com/trackify",
            platform: .whatsapp,
            followerGoal: 5000
        )
        let snapshot = FollowerSnapshot(followerCount: 1860, rawText: "1,860", channel: channel)
        channel.snapshots.append(snapshot)
        modelContext.insert(channel)
    }
}

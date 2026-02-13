import SwiftUI

struct ChannelPill: View {
    let channel: TrackedChannel
    let isSelected: Bool

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: channel.platform.iconName)
                .font(.caption)
            Text(channel.name)
                .font(.caption.bold())
        }
        .foregroundStyle(isSelected ? Color.black : Color.white)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(
            Capsule(style: .continuous)
                .fill(isSelected ? Color.white : Color.white.opacity(0.15))
        )
        .overlay(
            Capsule(style: .continuous)
                .stroke(Color.white.opacity(0.35), lineWidth: 1)
        )
        .scaleEffect(isSelected ? 1.05 : 1)
        .shadow(color: Color.black.opacity(isSelected ? 0.25 : 0.1), radius: 12, x: 0, y: 6)
        .animation(.spring(response: 0.35, dampingFraction: 0.7), value: isSelected)
    }
}

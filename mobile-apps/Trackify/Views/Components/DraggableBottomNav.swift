import SwiftUI

struct DraggableBottomNav: View {
    @Binding var selectedTab: TrackifyTab
    @GestureState private var dragOffset: CGFloat = 0

    private let pillWidth: CGFloat = 260
    private let pillHeight: CGFloat = 64

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .fill(Color.white.opacity(0.12))
                .overlay(
                    RoundedRectangle(cornerRadius: 32, style: .continuous)
                        .stroke(Color.white.opacity(0.35), lineWidth: 1)
                )

            HStack(spacing: 24) {
                ForEach(Array(TrackifyTab.allCases.enumerated()), id: \.offset) { _, tab in
                    Button {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.75)) {
                            selectedTab = tab
                        }
                    } label: {
                        VStack(spacing: 6) {
                            Image(systemName: tab.systemImage)
                            Text(tab.title)
                                .font(.caption2.bold())
                        }
                        .foregroundStyle(selectedTab == tab ? Color.black : Color.white)
                        .frame(width: 60)
                        .scaleEffect(selectedTab == tab ? 1.05 : 1)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)

            Capsule(style: .continuous)
                .fill(Color.white)
                .frame(width: 80, height: 48)
                .offset(x: selectorOffset + dragOffset)
                .animation(.spring(response: 0.4, dampingFraction: 0.8), value: selectedTab)
                .blendMode(.screen)
                .allowsHitTesting(false)
        }
        .frame(width: pillWidth, height: pillHeight)
        .glassmorphic(cornerRadius: 32)
        .sensoryFeedback(.impact(weight: .light), trigger: selectedTab)
        .padding(.bottom, 12)
        .gesture(
            DragGesture(minimumDistance: 8)
                .updating($dragOffset) { value, state, _ in
                    state = value.translation.width
                }
                .onEnded { value in
                    let step = pillWidth / CGFloat(TrackifyTab.allCases.count)
                    let target = selectorOffset + value.translation.width
                    let index = Int(round((target + pillWidth / 2 - step / 2) / step))
                    let clamped = min(max(index, 0), TrackifyTab.allCases.count - 1)
                    selectedTab = TrackifyTab.allCases[clamped]
                }
        )
    }

    private var selectorOffset: CGFloat {
        let step = pillWidth / CGFloat(TrackifyTab.allCases.count)
        let index = CGFloat(selectedTab.rawValue)
        return -pillWidth / 2 + step / 2 + step * index
    }
}

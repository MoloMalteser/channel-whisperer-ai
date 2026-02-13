import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var profiles: [UserProfile]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Settings")
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)

                if let profile = profiles.first {
                    settingsCard(for: profile)
                    notificationsCard(for: profile)
                } else {
                    Text("Loading profile...")
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            .padding(.bottom, 24)
        }
        .onAppear {
            if profiles.isEmpty {
                modelContext.insert(UserProfile())
            }
        }
    }

    private func settingsCard(for profile: UserProfile) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Profile")
                .font(.headline)
                .foregroundStyle(.white)

            TextField("Display name", text: binding(for: profile, keyPath: \UserProfile.displayName))
                .textFieldStyle(.roundedBorder)

            Stepper(value: binding(for: profile, keyPath: \UserProfile.refreshIntervalMinutes), in: 15...120, step: 15) {
                Text("Refresh every \(profile.refreshIntervalMinutes) min")
                    .foregroundStyle(.white.opacity(0.7))
            }
            .onChange(of: profile.refreshIntervalMinutes) { _ in
                Task { await ChannelScraper.shared.scheduleBackgroundRefresh() }
            }
        }
        .padding(20)
        .glassmorphic(cornerRadius: 24)
    }

    private func notificationsCard(for profile: UserProfile) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Notifications")
                .font(.headline)
                .foregroundStyle(.white)

            Toggle("Goal reached alerts", isOn: binding(for: profile, keyPath: \UserProfile.notificationsEnabled))
                .tint(.white)

            Button {
                Task { await NotificationManager.shared.requestAuthorizationIfNeeded() }
            } label: {
                Text("Re-authorize Notifications")
                    .font(.caption.bold())
                    .foregroundStyle(.black)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Capsule().fill(Color.white))
            }
        }
        .padding(20)
        .glassmorphic(cornerRadius: 24)
    }

    private func binding<Value>(for profile: UserProfile, keyPath: ReferenceWritableKeyPath<UserProfile, Value>) -> Binding<Value> {
        Binding(
            get: { profile[keyPath: keyPath] },
            set: { newValue in
                profile[keyPath: keyPath] = newValue
            }
        )
    }
}

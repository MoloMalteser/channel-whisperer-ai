import Foundation

enum Platform: String, Codable, CaseIterable, Identifiable {
    case whatsapp
    case instagram
    case tiktok
    case youtube

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .whatsapp: return "WhatsApp"
        case .instagram: return "Instagram"
        case .tiktok: return "TikTok"
        case .youtube: return "YouTube"
        }
    }

    var iconName: String {
        switch self {
        case .whatsapp: return "message.fill"
        case .instagram: return "camera.viewfinder"
        case .tiktok: return "music.note"
        case .youtube: return "play.rectangle.fill"
        }
    }
}

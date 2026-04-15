import Foundation

struct AuthSession: Codable {
    let accessToken: String
    let user: AuthUser

    private enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case user
    }
}

struct AuthUser: Codable {
    let id: UUID?
    let email: String?
}

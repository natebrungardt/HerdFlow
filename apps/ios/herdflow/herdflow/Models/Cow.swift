import Foundation

struct Cow: Identifiable, Codable {
    let id: UUID
    let tagNumber: String
    let group: String
    let status: String

    private enum CodingKeys: String, CodingKey {
        case id
        case tagNumber
        case group = "livestockGroup"
        case status = "healthStatus"
    }
}

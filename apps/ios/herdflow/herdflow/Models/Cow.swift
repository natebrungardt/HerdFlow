import Foundation

struct Cow: Identifiable, Codable {
    let id: UUID
    let tagNumber: String
    let ownerName: String
    let livestockGroup: String
    let sex: String?
    let healthStatus: String
    let pregnancyStatus: String?
    let createdAt: Date

    private enum CodingKeys: String, CodingKey {
        case id
        case tagNumber
        case ownerName
        case livestockGroup
        case sex
        case healthStatus
        case pregnancyStatus
        case createdAt
    }
}

import Foundation

struct ActivityResponse: Codable {
    let id: String
    let description: String
    let eventType: String
    let createdAt: String
}

final class ActivityService {
    private let baseURL = Config.baseURL
    private let decoder = JSONDecoder()

    func fetchActivity(accessToken: String?, limit: Int = 10) async -> [ActivityResponse] {
        guard let url = URL(string: "\(baseURL)/api/activity?limit=\(limit)") else {
            return []
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        if let accessToken, !accessToken.isEmpty {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }

        do {
            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ Invalid response")
                return []
            }

            guard (200...299).contains(httpResponse.statusCode) else {
                print("❌ Bad status code:", httpResponse.statusCode)
                return []
            }

            return try decoder.decode([ActivityResponse].self, from: data)
        } catch {
            print("❌ Failed to fetch activity:", error)
            return []
        }
    }
}

// MARK: - API → UI mapping

private let isoFormatterFractional: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
}()

private let isoFormatter = ISO8601DateFormatter()

private let timeFormatter: DateFormatter = {
    let f = DateFormatter()
    f.timeStyle = .short
    return f
}()

private let fallbackDateFormatter: DateFormatter = {
    let f = DateFormatter()
    f.dateFormat = "MMM d"
    return f
}()

func groupActivity(_ responses: [ActivityResponse]) -> [ActivityGroup] {
    struct Bucket {
        var label: String
        var sortKey: Date
        var items: [(Date, ActivityItem)] = []
    }

    var buckets: [String: Bucket] = [:]
    let calendar = Calendar.current

    for entry in responses {
        let date = isoFormatterFractional.date(from: entry.createdAt)
            ?? isoFormatter.date(from: entry.createdAt)
            ?? Date()

        let label: String
        let sortKey: Date
        if calendar.isDateInToday(date) {
            label = "Today"
            sortKey = calendar.startOfDay(for: Date()).addingTimeInterval(2)
        } else if calendar.isDateInYesterday(date) {
            label = "Yesterday"
            sortKey = calendar.startOfDay(for: Date()).addingTimeInterval(1)
        } else {
            label = fallbackDateFormatter.string(from: date)
            sortKey = calendar.startOfDay(for: date)
        }

        let item = ActivityItem(
            message: entry.description,
            time: timeFormatter.string(from: date)
        )

        var bucket = buckets[label] ?? Bucket(label: label, sortKey: sortKey)
        bucket.items.append((date, item))
        buckets[label] = bucket
    }

    return buckets.values
        .sorted { $0.sortKey > $1.sortKey }
        .map { bucket in
            ActivityGroup(
                label: bucket.label,
                items: bucket.items
                    .sorted { $0.0 > $1.0 }
                    .map { $0.1 }
            )
        }
}

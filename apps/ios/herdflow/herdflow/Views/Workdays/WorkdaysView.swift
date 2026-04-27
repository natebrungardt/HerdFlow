import Foundation
import SwiftUI

struct WorkdaysView: View {
    @EnvironmentObject private var authManager: AuthManager
    @State private var workdays: [Workday] = []
    @State private var searchText = ""

    private let workdayService = WorkdayService()

    private var filteredWorkdays: [Workday] {
        let query = searchText
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()

        guard !query.isEmpty else {
            return workdays
        }

        return workdays.filter { workday in
            let title = workday.displayTitle.lowercased()
            let summary = workday.summaryText.lowercased()
            let dateString = WorkdaysView.dateFormatter.string(from: workday.dateValue).lowercased()

            return title.contains(query)
                || summary.contains(query)
                || dateString.contains(query)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("All Workdays")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)
                .padding(.horizontal, 20)
                .padding(.top, 8)

            ScrollView(showsIndicators: false) {
                LazyVStack(spacing: 14) {
                    ForEach(filteredWorkdays) { workday in
                        WorkdayCardView(workday: workday)
                    }

                    if filteredWorkdays.isEmpty {
                        EmptyStateView(searchText: searchText)
                            .padding(.top, 24)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
            }
            .refreshable {
                loadWorkdays()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(.systemGroupedBackground))
        .searchable(
            text: $searchText,
            placement: .navigationBarDrawer(displayMode: .always),
            prompt: "Search by workday title or summary..."
        )
        .searchPresentationToolbarBehavior(.avoidHidingContent)
        .onAppear {
            loadWorkdays()
        }
        .onChange(of: authManager.accessToken) {
            loadWorkdays()
        }
    }

    private func loadWorkdays() {
        guard let token = authManager.accessToken, !token.isEmpty else {
            workdays = []
            return
        }

        workdayService.fetchWorkdays(accessToken: token) { fetchedWorkdays in
            workdays = fetchedWorkdays.sorted {
                $0.createdAt > $1.createdAt
            }
        }
    }
}

struct WorkdayCardView: View {
    let workday: Workday

    private var statusLabel: String {
        switch workday.status {
        case "InProgress": return "In Progress"
        case "Completed":  return "Completed"
        default:           return "Planned"
        }
    }

    private var statusColor: Color {
        switch workday.status {
        case "InProgress": return .blue
        case "Completed":  return .green
        default:           return Color(.systemGray4)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                Text(workday.displayTitle)
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)

                Spacer(minLength: 12)

                Text(statusLabel)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        Capsule()
                            .fill(statusColor)
                    )
            }

            Text(workday.summaryText.isEmpty ? "No summary yet." : workday.summaryText)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Text("Scheduled for \(WorkdaysView.dateFormatter.string(from: workday.dateValue))")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(.primary)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color.black.opacity(0.05), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.08), radius: 10, x: 0, y: 5)
    }
}

private struct EmptyStateView: View {
    let searchText: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "calendar")
                .font(.title3)
                .foregroundStyle(.secondary)

            Text("No workdays found")
                .font(.headline)

            Text(
                searchText.isEmpty
                ? "Your workdays will appear here once they are available."
                : "Try a different workday title or note for \"\(searchText)\"."
            )
            .font(.subheadline)
            .foregroundStyle(.secondary)
            .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(28)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
    }
}

struct Workday: Identifiable, Codable {
    let id: UUID
    let userId: UUID?
    let title: String?
    let date: String
    let summary: String?
    let status: String?
    let createdAt: Date
    let completedAt: Date?
    let workdayCows: [WorkdayCowAssignment]?
}

struct WorkdayCowAssignment: Identifiable, Codable {
    let id: UUID
    let workdayId: UUID?
    let cowId: UUID?
    let status: String?
}

final class WorkdayService {
    let baseURL = "http://127.0.0.1:5062"

    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)

            let iso8601WithFractionalSeconds = ISO8601DateFormatter()
            iso8601WithFractionalSeconds.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

            let iso8601 = ISO8601DateFormatter()

            if let date = iso8601WithFractionalSeconds.date(from: value) ?? iso8601.date(from: value) {
                return date
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Invalid date string: \(value)"
            )
        }
        return decoder
    }()

    func fetchWorkdays(accessToken: String?, completion: @escaping ([Workday]) -> Void) {
        guard let url = URL(string: "\(baseURL)/api/workdays") else {
            DispatchQueue.main.async {
                completion([])
            }
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        if let accessToken, !accessToken.isEmpty {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            guard error == nil,
                  let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode),
                  let data
            else {
                DispatchQueue.main.async {
                    completion([])
                }
                return
            }
            do {
                let workdays = try self.decoder.decode([Workday].self, from: data)
                DispatchQueue.main.async {
                    completion(workdays)
                }
            } catch {
                DispatchQueue.main.async {
                    completion([])
                }
            }
        }.resume()
    }
}

private extension WorkdaysView {
    static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter
    }()
}

private extension Workday {
    var displayTitle: String {
        let t = title?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return t.isEmpty ? "Untitled Workday" : t
    }

    var summaryText: String {
        summary?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }

    var cowCount: Int {
        workdayCows?.count ?? 0
    }

    var dateValue: Date {
        Self.dateOnlyFormatter.date(from: date) ?? createdAt
    }

    static let dateOnlyFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter
    }()
}

#Preview {
    NavigationStack {
        WorkdaysView()
    }
    .environmentObject(AuthManager())
}

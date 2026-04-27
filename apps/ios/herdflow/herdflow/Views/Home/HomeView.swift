import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var authManager: AuthManager
    @State private var workdays: [Workday] = []
    @State private var cows: [Cow] = []

    private let workdayService = WorkdayService()
    private let cowService = CowService()

    private var needsTreatmentCount: Int { cows.filter { $0.healthStatus == "NeedsTreatment" }.count }
    private var totalCowsCount: Int { cows.count }
    private var calvesCount: Int { cows.filter { $0.livestockGroup == "Calf" }.count }

    private var upcomingWorkday: Workday? {
        let now = Date()
        return workdays
            .filter { $0.dateValue >= now }
            .sorted { $0.dateValue < $1.dateValue }
            .first
        ?? workdays.sorted { $0.dateValue > $1.dateValue }.first
    }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 18) {
                AppHeaderView()

                UpcomingWorkdayCard(workday: upcomingWorkday)
                    .padding(.horizontal, 20)

                HStack(spacing: 14) {
                    StatCard(count: needsTreatmentCount, label: "Needs Treatment")
                    StatCard(count: totalCowsCount, label: "Total Cows")
                    StatCard(count: calvesCount, label: "Calves")
                }
                .padding(.horizontal, 20)
            }
            .padding(.bottom, 24)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(.systemGroupedBackground))
        .onAppear { loadWorkdays(); loadCows() }
        .onChange(of: authManager.accessToken) { loadWorkdays(); loadCows() }
    }

    private func loadWorkdays() {
        guard let token = authManager.accessToken, !token.isEmpty else {
            workdays = []
            return
        }
        workdayService.fetchWorkdays(accessToken: token) { fetched in
            workdays = fetched
        }
    }

    private func loadCows() {
        guard let token = authManager.accessToken, !token.isEmpty else {
            cows = []
            return
        }
        cowService.fetchCows(accessToken: token) { fetched in
            cows = fetched
        }
    }
}

private struct UpcomingWorkdayCard: View {
    let workday: Workday?

    private var statusLabel: String {
        switch workday?.status {
        case "InProgress": return "In Progress"
        case "Completed":  return "Completed"
        default:           return "Planned"
        }
    }

    private var statusColor: Color {
        switch workday?.status {
        case "InProgress": return .blue
        case "Completed":  return .green
        default:           return Color(.systemGray4)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Upcoming Workday")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)

            if let workday {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(workday.displayTitle)
                            .font(.system(size: 22, weight: .bold, design: .rounded))
                            .foregroundStyle(.primary)

                        Text(HomeView.dateFormatter.string(from: workday.dateValue))
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                    }

                    Spacer(minLength: 12)

                    Text(statusLabel)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Capsule().fill(statusColor))
                }

                if let summary = workday.summary, !summary.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    Text(summary)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            } else {
                HStack(spacing: 12) {
                    Image(systemName: "calendar")
                        .font(.title2)
                        .foregroundStyle(.secondary)

                    Text("No upcoming workdays")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            }
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

private struct StatCard: View {
    let count: Int
    let label: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("\(count)")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)

            Spacer(minLength: 0)

            Text(label)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 100, alignment: .leading)
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

private struct AppHeaderView: View {
    var body: some View {
        HStack(spacing: 6) {
            Image("herdflow-mark")
                .resizable()
                .scaledToFit()
                .frame(height: 40)
            Text("HerdFlow")
                .font(.system(size: 30, weight: .semibold, design: .default))
                .foregroundStyle(.primary)
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
        .padding(.bottom, 4)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private extension HomeView {
    static let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "MMM d, yyyy"
        return f
    }()
}

#Preview {
    NavigationStack {
        HomeView()
    }
    .environmentObject(AuthManager())
    .onAppear {}
}

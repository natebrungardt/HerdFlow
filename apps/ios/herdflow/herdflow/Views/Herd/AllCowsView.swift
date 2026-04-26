import SwiftUI

struct AllCowsView: View {
    @EnvironmentObject private var authManager: AuthManager
    @State private var cows: [Cow] = []
    @State private var searchText = ""
    private let cowService = CowService()

    private var filteredCows: [Cow] {
        guard !searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return cows
        }

        return cows.filter { cow in
            cow.tagNumber.localizedCaseInsensitiveContains(searchText)
            || (cow.ownerName ?? "").localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("All Cows")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)
                .padding(.horizontal, 20)
                .padding(.top, 8)

            ScrollView(showsIndicators: false) {
                LazyVStack(spacing: 14) {
                    ForEach(filteredCows) { cow in
                        CowCardView(cow: cow)
                    }

                    if filteredCows.isEmpty {
                        EmptyStateView(searchText: searchText)
                            .padding(.top, 24)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
            }
            .refreshable {
                loadCows()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(.systemGroupedBackground))
        .searchable(
            text: $searchText,
            placement: .navigationBarDrawer(displayMode: .always),
            prompt: "Search by tag number or owner name..."
        )
        .searchPresentationToolbarBehavior(.avoidHidingContent)
        .onAppear {
            loadCows()
        }
        .onChange(of: authManager.accessToken) {
            loadCows()
        }
    }

    private func loadCows() {
        guard let token = authManager.accessToken, !token.isEmpty else {
            cows = []
            return
        }

        cowService.fetchCows(accessToken: token) { fetchedCows in
            cows = fetchedCows.sorted {
                $0.createdAt > $1.createdAt
            }
        }
    }
}

struct CowCardView: View {
    let cow: Cow

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                Text("Tag #\(cow.tagNumber)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)

                Spacer(minLength: 12)

                Text(cow.isHealthy ? "Healthy" : "Needs Treatment")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        Capsule(style: .continuous)
                            .fill(cow.isHealthy ? Color.green : Color.red)
                    )
            }

            Text("\(cow.livestockGroup ?? "Unknown") • \(cow.healthStatus) • \(cow.sexDisplay) • \(cow.statusDisplay)")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(1)

            VStack(alignment: .leading, spacing: 8) {
                Label(cow.ownerName ?? "No owner", systemImage: "person.fill")
                    .font(.subheadline)
                    .foregroundStyle(.primary)

                Label(AllCowsView.dateFormatter.string(from: cow.createdAt), systemImage: "calendar")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
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

private struct EmptyStateView: View {
    let searchText: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.title3)
                .foregroundStyle(.secondary)

            Text("No cows found")
                .font(.headline)

            Text(
                searchText.isEmpty
                ? "Your herd records will appear here once cows are available."
                : "Try a different tag number or owner name for \"\(searchText)\"."
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

private extension AllCowsView {
    static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return formatter
    }()
}

private extension Cow {
    var sexDisplay: String {
        let value = sex?.trimmingCharacters(in: .whitespacesAndNewlines)
        return value?.isEmpty == false ? value! : "Unknown"
    }

    var statusDisplay: String {
        let value = pregnancyStatus?.trimmingCharacters(in: .whitespacesAndNewlines)
        return value?.isEmpty == false ? value! : "N/A"
    }

    var isHealthy: Bool {
        healthStatus == "Healthy"
    }
}

#Preview {
    NavigationStack {
        AllCowsView()
    }
    .environmentObject(AuthManager())
}

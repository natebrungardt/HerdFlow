import SwiftUI

struct HerdView: View {
    @EnvironmentObject private var authManager: AuthManager
    @State private var cows: [Cow] = []
    private let cowService = CowService()

    var body: some View {
        NavigationStack {
            List {
                ForEach(cows) { cow in
                HStack(spacing: 14) {
                    Image(systemName: "tag.fill")
                        .font(.title3)
                        .foregroundStyle(.green)
                        .frame(width: 36, height: 36)
                        .background(Color.green.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    VStack(alignment: .leading, spacing: 4) {
                        Text(cow.tagNumber)
                            .font(.headline)
                        Text(cow.status)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 6)
                }
                .listRowInsets(EdgeInsets(top: 10, leading: 16, bottom: 10, trailing: 16))
            }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Herd")
            .onAppear {
                loadCows()
            }
            .onChange(of: authManager.accessToken) {
                loadCows()
            }
        }
    }
    private func loadCows() {
        guard let token = authManager.accessToken, !token.isEmpty else {
            return
        }

        cowService.fetchCows(accessToken: token) { fetchedCows in
            cows = fetchedCows
        }
    }
}

import SwiftUI

enum AppTab: Hashable {
    case herd
    case workdays
    case profile

    var title: String {
        switch self {
        case .herd:
            return "Herd"
        case .workdays:
            return "Workdays"
        case .profile:
            return "Profile"
        }
    }

    var systemImage: String {
        switch self {
        case .herd:
            return "tag.fill"
        case .workdays:
            return "wrench.fill"
        case .profile:
            return "person.fill"
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab: AppTab = .herd
    @State private var showingAddCow = false
    @State private var showingAddWorkday = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            TabView(selection: $selectedTab) {
                HerdView()
                    .tabItem {
                        Label(AppTab.herd.title, systemImage: AppTab.herd.systemImage)
                    }
                    .tag(AppTab.herd)

                WorkdaysView()
                    .tabItem {
                        Label(AppTab.workdays.title, systemImage: AppTab.workdays.systemImage)
                    }
                    .tag(AppTab.workdays)

                ProfileView()
                    .tabItem {
                        Label(AppTab.profile.title, systemImage: AppTab.profile.systemImage)
                    }
                    .tag(AppTab.profile)
            }
            .tint(.green)

            if selectedTab != .profile {
                Button(action: handleFloatingButtonTap) {
                    Image(systemName: "plus")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 60, height: 60)
                        .background(Color.green)
                        .clipShape(Circle())
                        .shadow(color: Color.black.opacity(0.16), radius: 14, x: 0, y: 8)
                }
                .padding(.trailing, 20)
                .padding(.bottom, 92)
                .accessibilityLabel(floatingButtonLabel)
            }
        }
        .background(Color(.systemGroupedBackground))
        .sheet(isPresented: $showingAddCow) {
            AddCowView()
        }
        .sheet(isPresented: $showingAddWorkday) {
            AddWorkdayView()
        }
    }

    private var floatingButtonLabel: String {
        switch selectedTab {
        case .herd:
            return "Add cow"
        case .workdays:
            return "Add workday"
        case .profile:
            return "Add"
        }
    }

    private func handleFloatingButtonTap() {
        switch selectedTab {
        case .herd:
            showingAddCow = true
        case .workdays:
            showingAddWorkday = true
        case .profile:
            break
        }
    }
}

private struct AddWorkdayView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("Add Workday")
                    .font(.title2.weight(.semibold))
                Text("This is a placeholder for creating a new workday entry.")
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .padding(24)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .background(Color(.systemGroupedBackground))
            .navigationTitle("New Workday")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

import SwiftUI

enum AppTab: Hashable {
    case home
    case herd
    case workdays
    case profile

    var title: String {
        switch self {
        case .home:
            return "Home"
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
        case .home:
            return "house"
        case .herd:
            return "tag"
        case .workdays:
            return "wrench"
        case .profile:
            return "person"
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab: AppTab = .home
    @State private var showingActionMenu = false
    @State private var showingAddCow = false
    @State private var showingAddWorkday = false
    private let actionButtonSize: CGFloat = 56
    private let dockClearance: CGFloat = 86

    var body: some View {
        ZStack(alignment: .bottom) {
            currentScreen
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)

            BottomDock(
                selectedTab: $selectedTab,
                actionButtonSize: actionButtonSize,
                onActionTap: toggleActionMenu
            )
            .padding(.horizontal, 24)
            .padding(.bottom, 12)
            .zIndex(2)

            if showingActionMenu {
                FloatingActionMenu(
                    onDismiss: { showingActionMenu = false },
                    onSelectAction: handleMenuAction
                )
                .transition(.opacity.combined(with: .scale(scale: 0.98)))
                .zIndex(3)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: showingActionMenu)
        .background(Color(.systemGroupedBackground))
        .ignoresSafeArea(edges: .bottom)
        .sheet(isPresented: $showingAddCow) {
            AddCowView()
        }
        .sheet(isPresented: $showingAddWorkday) {
            AddWorkdayView()
        }
    }

    private func toggleActionMenu() {
        showingActionMenu.toggle()
    }

    private func handleMenuAction(_ action: QuickAction) {
        showingActionMenu = false

        switch action {
        case .addCow:
            showingAddCow = true
        case .addWorkday:
            showingAddWorkday = true
        }
    }

    @ViewBuilder
    private var currentScreen: some View {
        switch selectedTab {
        case .home:
            HomeView()
        case .herd:
            NavigationStack {
                AllCowsView()
            }
        case .workdays:
            NavigationStack {
                WorkdaysView()
            }
        case .profile:
            ProfileView()
        }
    }
}

private struct BottomDock: View {
    @Binding var selectedTab: AppTab
    let actionButtonSize: CGFloat
    let onActionTap: () -> Void

    var body: some View {
        HStack(alignment: .center, spacing: 16) {

            // Tabs (no styling, fixed footprint)
            HStack(spacing: 12) {
                ForEach([AppTab.home, .herd, .workdays, .profile], id: \.self) { tab in
                    Button {
                        selectedTab = tab
                    } label: {
                        VStack(spacing: 4) {
                            Image(systemName: tab.systemImage)
                                .font(.system(size: 18, weight: selectedTab == tab ? .semibold : .regular))

                            Text(tab.title)
                                .font(.system(size: 11, weight: selectedTab == tab ? .semibold : .regular))
                                .lineLimit(1)
                        }
                        .foregroundStyle(
                            selectedTab == tab
                            ? Color.black
                            : Color.secondary.opacity(0.6)
                        )
                        // Fixed button footprint (KEY)
                        .frame(width: 58, height: 60, alignment: .center)
                        .background {
                            if selectedTab == tab {
                                Capsule()
                                    .fill(Color.black.opacity(0.05))
                                    .padding(.horizontal, -8)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 15)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(.ultraThinMaterial)
            )
            .overlay(
                Capsule()
                    .stroke(Color.white.opacity(0.12), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.08), radius: 10, x: 0, y: 4)

            // Action button
            Button(action: onActionTap) {
                Image(systemName: "plus")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: actionButtonSize, height: actionButtonSize)
                    .background(
                        Circle()
                            .fill(Color.black)
                    )
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )
                    .shadow(color: Color.black.opacity(0.08), radius: 10, x: 0, y: 4)
            }
            .buttonStyle(.plain)
        }
    }
}

private enum QuickAction: CaseIterable, Hashable {
    case addCow
    case addWorkday

    var title: String {
        switch self {
        case .addCow:
            return "Add Cow"
        case .addWorkday:
            return "Add Workday"
        }
    }

    var systemImage: String {
        switch self {
        case .addCow:
            return "tag"
        case .addWorkday:
            return "wrench.and.screwdriver"
        }
    }
}

private struct FloatingActionMenu: View {
    let onDismiss: () -> Void
    let onSelectAction: (QuickAction) -> Void

    private let columns = [
        GridItem(.fixed(150), spacing: 16),
        GridItem(.fixed(150), spacing: 16)
    ]

    var body: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
                .onTapGesture(perform: onDismiss)

            HStack {
                Spacer()

                LazyVGrid(columns: columns, spacing: 16) {
                    ForEach(QuickAction.allCases, id: \.self) { action in
                        Button {
                            onSelectAction(action)
                        } label: {
                            VStack(alignment: .leading, spacing: 14) {
                                Image(systemName: action.systemImage)
                                    .font(.title3.weight(.semibold))
                                    .foregroundStyle(.green)
                                    .frame(width: 44, height: 44)
                                    .background(Color.green.opacity(0.12))
                                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

                                Text(action.title)
                                    .font(.headline)
                                    .foregroundStyle(.primary)

                                Spacer(minLength: 0)
                            }
                            .padding(18)
                            .frame(width: 150, height: 150)
                            .background(Color(.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                            .shadow(color: Color.black.opacity(0.08), radius: 18, x: 0, y: 8)
                        }
                        .buttonStyle(.plain)
                    }
                }

                Spacer()
            }
            .padding(.horizontal, 24)
        }
        .zIndex(1)
    }
}

private struct AddWorkdayView: View {
    var body: some View {
        Text("Add Workday Page")
    }
}
#Preview(){
    MainTabView()
}

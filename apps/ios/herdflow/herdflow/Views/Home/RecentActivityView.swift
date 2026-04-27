import SwiftUI

struct ActivityItem: Identifiable {
    let id = UUID()
    let message: String
    let time: String?
}

struct ActivityGroup: Identifiable {
    let id = UUID()
    let label: String
    let items: [ActivityItem]
}

struct RecentActivityView: View {
    let groups: [ActivityGroup]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Recent Activity")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
                .textCase(.uppercase)
                .padding(.horizontal, 20)

            VStack(alignment: .leading, spacing: 16) {
                ForEach(groups) { group in
                    ActivityGroupSection(group: group)
                }
            }
            .padding(.horizontal, 20)
        }
    }
}

private struct ActivityGroupSection: View {
    let group: ActivityGroup

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(group.label)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)

            VStack(spacing: 0) {
                ForEach(Array(group.items.enumerated()), id: \.element.id) { index, item in
                    ActivityRow(item: item)

                    if index < group.items.count - 1 {
                        Divider()
                            .padding(.leading, 16)
                    }
                }
            }
        }
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

private struct ActivityRow: View {
    let item: ActivityItem

    var body: some View {
        HStack(alignment: .center, spacing: 12) {
            Circle()
                .fill(Color(.systemGray4))
                .frame(width: 7, height: 7)

            Text(item.message)
                .font(.subheadline)
                .foregroundStyle(.primary)

            Spacer(minLength: 8)

            if let time = item.time {
                Text(time)
                    .font(.caption)
                    .foregroundStyle(Color(.systemGray2))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

#Preview {
    let groups: [ActivityGroup] = [
        ActivityGroup(label: "Today", items: [
            ActivityItem(message: "Tag T-101 marked Needs Treatment", time: "2:14 PM"),
            ActivityItem(message: "Tag T-88 moved to Calf group", time: "11:30 AM"),
        ]),
        ActivityGroup(label: "Yesterday", items: [
            ActivityItem(message: "Tag T-55 owner changed to John Smith", time: "4:00 PM"),
            ActivityItem(message: "Tag T-22 sale price set to $1,400", time: "1:15 PM"),
            ActivityItem(message: "Tag T-10 marked Healthy", time: "9:00 AM"),
        ]),
    ]

    ScrollView {
        VStack(alignment: .leading, spacing: 18) {
            RecentActivityView(groups: groups)
        }
        .padding(.vertical, 24)
    }
    .background(Color(.systemGroupedBackground))
}

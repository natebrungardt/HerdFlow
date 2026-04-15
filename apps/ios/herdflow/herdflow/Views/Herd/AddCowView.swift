import SwiftUI

struct AddCowView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var cowName = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Cow Details") {
                    TextField("Name", text: $cowName)
                }
            }
            .navigationTitle("Add Cow")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

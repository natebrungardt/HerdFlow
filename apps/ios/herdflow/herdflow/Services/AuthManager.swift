import Foundation
import Combine

@MainActor
final class AuthManager: ObservableObject {
    @Published var isAuthenticated = false // Assume user is authenticated by default for development purposes
    @Published var accessToken: String?

    private let authService = AuthService()

    func signIn(email: String, password: String, completion: @escaping (Result<Void, Error>) -> Void) {
        authService.signIn(email: email, password: password) { [weak self] result in
            guard let self else { return }

            switch result {
            case .success(let session):
                accessToken = session.accessToken
                isAuthenticated = true
                completion(.success(()))
            case .failure(let error):
                accessToken = nil
                isAuthenticated = false
                completion(.failure(error))
            }
        }
    }

    func signOut() {
        accessToken = nil
        isAuthenticated = false
    }
}

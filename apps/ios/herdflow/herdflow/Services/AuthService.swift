import Foundation

final class AuthService {
    private let supabaseURL = Config.supabaseURL
    private let supabaseAnonKey = Config.supabaseAnonKey

    func signIn(email: String, password: String, completion: @escaping (Result<AuthSession, Error>) -> Void) {
        guard let url = URL(string: "\(supabaseURL)/auth/v1/token?grant_type=password") else {
            DispatchQueue.main.async {
                completion(.failure(AuthServiceError.invalidURL))
            }
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(supabaseAnonKey, forHTTPHeaderField: "apikey")

        do {
            request.httpBody = try JSONEncoder().encode(SignInRequest(email: email, password: password))
        } catch {
            DispatchQueue.main.async {
                completion(.failure(error))
            }
            return
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error {
                DispatchQueue.main.async {
                    completion(.failure(error))
                }
                return
            }

            guard let httpResponse = response as? HTTPURLResponse,
                  let data
            else {
                DispatchQueue.main.async {
                    completion(.failure(AuthServiceError.invalidResponse))
                }
                return
            }

            guard (200...299).contains(httpResponse.statusCode) else {
                DispatchQueue.main.async {
                    let message = (try? JSONDecoder().decode(AuthErrorResponse.self, from: data).message) ?? "Unable to log in."
                    completion(.failure(AuthServiceError.requestFailed(message)))
                }
                return
            }

            DispatchQueue.main.async {
                do {
                    let session = try JSONDecoder().decode(AuthSession.self, from: data)
                    completion(.success(session))
                } catch {
                    completion(.failure(error))
                }
            }
        }.resume()
    }
}

private struct SignInRequest: Codable {
    let email: String
    let password: String
}

private struct AuthErrorResponse: Codable {
    let message: String
}

enum AuthServiceError: LocalizedError {
    case invalidURL
    case invalidResponse
    case requestFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid authentication URL."
        case .invalidResponse:
            return "Invalid authentication response."
        case .requestFailed(let message):
            return message
        }
    }
}

import Foundation

final class CowService {
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

    func fetchCows(accessToken: String?, completion: @escaping ([Cow]) -> Void) {
        guard let url = URL(string: "\(baseURL)/api/cows") else {
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
                let cows = try self.decoder.decode([Cow].self, from: data)
                DispatchQueue.main.async {
                    completion(cows)
                }
            } catch {
                DispatchQueue.main.async {
                    completion([])
                }
            }
        }.resume()
    }
}

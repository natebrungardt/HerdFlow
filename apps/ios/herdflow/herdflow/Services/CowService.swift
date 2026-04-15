import Foundation

final class CowService {
    let baseURL = "http://127.0.0.1:5062"

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
                let cows = try JSONDecoder().decode([Cow].self, from: data)
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

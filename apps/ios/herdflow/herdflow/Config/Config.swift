import Foundation

enum Config {
    #if DEBUG
    static let baseURL = "http://127.0.0.1:5062"
    #else
    static let baseURL = "https://api.herdflow.app"
    #endif

    static let supabaseURL = "https://dfsiotimlkgzdjomfkeo.supabase.co"
    static let supabaseAnonKey = "sb_publishable_iAKQxQ-DGwwx6FH7v0M-uw_Ks9AoG8P"
}

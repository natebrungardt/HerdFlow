//
//  herdflowApp.swift
//  herdflow
//
//  Created by Nate Brungardt on 4/14/26.
//

import SwiftUI

@main
struct herdflowApp: App {
    @StateObject private var authManager = AuthManager()

    var body: some Scene {
        WindowGroup {
            Group {
                if authManager.isAuthenticated {
                    MainTabView()
                } else {
                    AuthView()
                }
            }
            .environmentObject(authManager)
        }
    }
}

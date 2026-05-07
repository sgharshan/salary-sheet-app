declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string
        error?: string
      }
      interface TokenClientConfig {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
      }
      interface TokenClient {
        callback: (response: TokenResponse) => void
        requestAccessToken(options?: { prompt?: string }): void
      }
      function initTokenClient(config: TokenClientConfig): TokenClient
    }
  }
}

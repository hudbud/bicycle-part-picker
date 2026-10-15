// The slice of Google Identity Services (https://accounts.google.com/gsi/client) the app uses.
// https://developers.google.com/identity/gsi/web/reference/js-reference

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleIdApi {
  initialize(options: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    use_fedcm_for_button?: boolean
  }): void
  renderButton(
    parent: HTMLElement,
    options: { type?: 'standard' | 'icon'; theme?: 'outline' | 'filled_blue' | 'filled_black'; size?: 'large' | 'medium' | 'small'; text?: 'signin_with' | 'continue_with'; shape?: 'rectangular' | 'pill'; width?: number; logo_alignment?: 'left' | 'center' },
  ): void
  disableAutoSelect(): void
}

interface Window {
  google?: { accounts: { id: GoogleIdApi } }
}

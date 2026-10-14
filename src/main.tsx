import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StyleSheetManager } from 'styled-components'
import isPropValid from '@emotion/is-prop-valid'
import './index.css'
import App from './App'
import { AppTheme } from './theme/AppTheme'
import { initStorageSync } from './utils/storageSync'
import { collectPhotoGarbage, migrateLegacyPhotos } from './utils/bikePhotos'
import { initAccount } from './account/cloudSync'

// react95 forwards its own boolean props (active, square, fullWidth, ...) straight to
// the DOM; filter to valid HTML attributes so styled-components v6 stops warning.
function shouldForwardProp(propName: string, target: unknown) {
  return typeof target === 'string' ? isPropValid(propName) : true
}

localStorage.removeItem('ppp-auth')
localStorage.removeItem('ppp-auth-users')

initStorageSync()
void initAccount()

// Older saves kept one photo as a data URL in localStorage; move those into IndexedDB, then
// drop stored photos no bike uses any more.
void migrateLegacyPhotos().then(collectPhotoGarbage).catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <AppTheme>
        <App />
      </AppTheme>
    </StyleSheetManager>
  </StrictMode>,
)

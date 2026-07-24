import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, StyleSheetManager } from 'styled-components'
import { createGlobalStyle } from 'styled-components'
import isPropValid from '@emotion/is-prop-valid'
import original from 'react95/dist/themes/original'
import { styleReset } from 'react95'
import './index.css'
import App from './App'
import { initStorageSync } from './utils/storageSync'

// react95 forwards its own boolean props (active, square, fullWidth, ...) straight to
// the DOM; filter to valid HTML attributes so styled-components v6 stops warning.
function shouldForwardProp(propName: string, target: unknown) {
  return typeof target === 'string' ? isPropValid(propName) : true
}

const GlobalStyle = createGlobalStyle`
  ${styleReset}
  body {
    font-family: 'ms_sans_serif', sans-serif;
  }
`

localStorage.removeItem('ppp-auth')
localStorage.removeItem('ppp-auth-users')

initStorageSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyleSheetManager shouldForwardProp={shouldForwardProp}>
      <ThemeProvider theme={original}>
        <GlobalStyle />
        <App />
      </ThemeProvider>
    </StyleSheetManager>
  </StrictMode>,
)

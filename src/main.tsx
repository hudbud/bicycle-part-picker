import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'styled-components'
import { createGlobalStyle } from 'styled-components'
import original from 'react95/dist/themes/original'
import { styleReset } from 'react95'
import './index.css'
import App from './App'

const GlobalStyle = createGlobalStyle`
  ${styleReset}
  body {
    font-family: 'ms_sans_serif', sans-serif;
  }
`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={original}>
      <GlobalStyle />
      <App />
    </ThemeProvider>
  </StrictMode>,
)

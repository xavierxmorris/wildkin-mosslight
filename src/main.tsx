import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/silkscreen/latin-400.css'
import '@fontsource/silkscreen/latin-700.css'
import '@fontsource-variable/nunito-sans'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './styles.css'
import App from './GameApp.tsx'
import { GameBoundary } from './components/GameBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameBoundary><App /></GameBoundary>
  </StrictMode>,
)

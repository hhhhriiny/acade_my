import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>  {/* <-- 이 녀석이 App을 감싸고 있어야 합니다 */}
      <App />
    </BrowserRouter>
  </StrictMode>,
)

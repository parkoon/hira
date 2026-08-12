import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { env } from '@/shared/config/env'

import { App } from './app'

async function enableMocking() {
  if (!env.ENABLE_API_MOCKING) return
  const { initMocks } = await import('./mocks')
  return initMocks()
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})

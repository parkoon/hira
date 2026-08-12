import { test as setup } from '@playwright/test'

setup('MSW 모드에서는 인증 불필요', async ({ page }) => {
  await page.goto('/')
  await page.context().storageState({ path: 'e2e/.auth/session.json' })
})

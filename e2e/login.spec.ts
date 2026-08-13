import { expect, test } from '@playwright/test'

// 앱의 진입 흐름 스모크 — 미인증 접근은 로그인 화면으로 리다이렉트된다 (스펙 §6-1)
test('루트로 접근하면 로그인 화면이 뜬다', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'HIRA' })).toBeVisible()
  await expect(page.getByLabel('사번')).toBeVisible()
})

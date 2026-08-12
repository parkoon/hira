import { expect, test } from '@playwright/test'

test('Posts 목록 페이지에 접근할 수 있다', async ({ page }) => {
  await page.goto('/app/posts')
  await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible()
})

test('새 게시글을 생성할 수 있다', async ({ page }) => {
  await page.goto('/app/posts')
  await page.getByRole('button', { name: '새 게시글' }).click()
  await page.getByLabel('제목').fill('테스트 게시글')
  await page.getByLabel('내용').fill('테스트 내용입니다.')
  await page.getByRole('button', { name: '생성' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

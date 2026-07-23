import { expect, test } from '@playwright/test'

test.describe('localized frontend', () => {
  test('redirects an English browser to the English journal', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/en$/)
    await expect(page).toHaveTitle(/Journal/)
    await expect(page.locator('h1')).toHaveText('Ideas, practice, and work worth keeping.')
    await expect(page.getByText('No English articles have been published yet.')).toBeVisible()
  })

  test('redirects a Chinese browser to the Chinese journal', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'zh-CN' })
    const page = await context.newPage()

    await page.goto('/')

    await expect(page).toHaveURL(/\/zh$/)
    await expect(page.locator('h1')).toHaveText('思考、实践与长期记录。')
    await expect(page.getByText('这里还没有已发布的中文文章。')).toBeVisible()
    await context.close()
  })

  test('publishes canonical and language alternate links', async ({ page }) => {
    await page.goto('/en')

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en$/)
    await expect(page.locator('link[hreflang="zh"]')).toHaveAttribute('href', /\/zh$/)
  })

  test('returns not found for unsupported locales', async ({ page }) => {
    const response = await page.goto('/fr')

    expect(response?.status()).toBe(404)
  })
})

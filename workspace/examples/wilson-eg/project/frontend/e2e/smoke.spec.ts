import { test, expect } from '@playwright/test'

test.describe('Wilson Egypt smoke', () => {
  test('homepage loads and shows hero', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText(/ويلسون|Wilson|صُنع للبيت المصري|Egypt/i)).toBeVisible()
  })

  test('products page loads', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText(/المنتجات|Products/i)).toBeVisible()
  })

  test('navigation to about works', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /عن ويلسون|About/i }).first().click()
    await expect(page).toHaveURL(/\/about/)
  })
})

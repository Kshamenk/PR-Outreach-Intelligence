import { test, expect, freshUser, registerViaAPI, injectAuth } from './helpers'

test.describe('Contacts E2E', () => {
  let tokens: { accessToken: string; refreshToken: string }

  test.beforeEach(async ({ page, baseURL }) => {
    const user = freshUser()
    tokens = await registerViaAPI(baseURL!, user)
    await injectAuth(page, tokens)
  })

  test('create a contact and see it in the list', async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForLoadState('networkidle')

    // Open new contact modal
    const newBtn = page.getByRole('button', { name: /add contact/i }).first()
    await newBtn.click()

    // Fill the form
    await page.locator('dialog input').nth(0).fill('Alice Reporter')
    await page.locator('dialog input').nth(1).fill(`alice-${Date.now()}@press.com`)
    await page.locator('dialog input').nth(2).fill('Reuters')
    await page.locator('dialog input').nth(3).fill('tech, AI')

    // Submit
    await page.locator('dialog button[type="submit"]').click()

    // Wait for modal to close and list to refresh
    await page.waitForTimeout(500)

    // Verify contact appears in list
    await expect(page.locator('text=Alice Reporter')).toBeVisible()
  })

  test('view contact detail', async ({ page }) => {
    await page.goto('/contacts')
    await page.waitForLoadState('networkidle')

    // Create a contact first
    const newBtn = page.getByRole('button', { name: /add contact/i }).first()
    await newBtn.click()

    const uniqueName = `Detail-Test-${Date.now()}`
    await page.locator('dialog input').nth(0).fill(uniqueName)
    await page.locator('dialog input').nth(1).fill(`detail-${Date.now()}@press.com`)
    await page.locator('dialog input').nth(2).fill('AP News')
    await page.locator('dialog button[type="submit"]').click()

    await page.waitForTimeout(500)

    // Click on the contact to view detail
    await page.locator(`text=${uniqueName}`).click()

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/contacts\/\d+/)
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible()
  })
})

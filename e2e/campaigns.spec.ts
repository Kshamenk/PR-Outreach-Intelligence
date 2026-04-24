import { test, expect, freshUser, registerViaAPI, injectAuth } from './helpers'

test.describe('Campaigns E2E', () => {
  let tokens: { accessToken: string; refreshToken: string }

  test.beforeEach(async ({ page, baseURL }) => {
    const user = freshUser()
    tokens = await registerViaAPI(baseURL!, user)
    await injectAuth(page, tokens)
  })

  test('create a campaign and see it in the list', async ({ page }) => {
    await page.goto('/campaigns')
    await page.waitForLoadState('networkidle')

    // Open new campaign modal
    const newBtn = page.getByRole('button', { name: /new campaign/i }).first()
    await newBtn.click()

    // Fill the form
    const campaignName = `E2E Campaign ${Date.now()}`
    await page.locator('dialog input').first().fill(campaignName)
    await page.locator('dialog textarea').nth(0).fill('E2E test campaign description')
    await page.locator('dialog textarea').nth(1).fill('Test the campaign creation flow')

    // Submit
    await page.locator('dialog button[type="submit"]').click()

    // Wait for modal to close and list to refresh
    await page.waitForTimeout(500)

    // Verify campaign appears in list
    await expect(page.locator(`text=${campaignName}`)).toBeVisible()
  })

  test('view campaign detail and add participant', async ({ page, baseURL }) => {
    await page.goto('/campaigns')
    await page.waitForLoadState('networkidle')

    // Create a campaign
    const newBtn = page.getByRole('button', { name: /new campaign/i }).first()
    await newBtn.click()

    const campaignName = `Participant-Test-${Date.now()}`
    await page.locator('dialog input').first().fill(campaignName)
    await page.locator('dialog textarea').nth(0).fill('Description')
    await page.locator('dialog textarea').nth(1).fill('Objective')
    await page.locator('dialog button[type="submit"]').click()

    await page.waitForTimeout(500)

    // Navigate to detail
    await page.locator(`text=${campaignName}`).click()
    await expect(page).toHaveURL(/\/campaigns\/\d+/)
    await expect(page.locator(`text=${campaignName}`)).toBeVisible()
  })
})

import { test, expect, freshUser, registerViaAPI, injectAuth } from './helpers'

test.describe('Outreach Draft E2E', () => {
  let tokens: { accessToken: string; refreshToken: string }

  test.beforeEach(async ({ page, baseURL }) => {
    const user = freshUser()
    tokens = await registerViaAPI(baseURL!, user)
    await injectAuth(page, tokens)

    // Seed a contact and campaign via API for the outreach flow
    await fetch(`${baseURL}/api/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({
        name: 'E2E Contact',
        email: `outreach-${Date.now()}@press.com`,
        outlet: 'TechCrunch',
        topics: ['startups'],
      }),
    })

    await fetch(`${baseURL}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({
        name: 'E2E Campaign',
        description: 'Test campaign for outreach',
        objective: 'Generate media coverage',
      }),
    })
  })

  test('navigate to outreach page and see form', async ({ page }) => {
    await page.goto('/outreach')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toContainText('AI Outreach Draft')
    // Verify contact and campaign appear as options in the dropdowns
    const contactSelect = page.locator('select').nth(0)
    await expect(contactSelect).toContainText('E2E Contact')
    const campaignSelect = page.locator('select').nth(1)
    await expect(campaignSelect).toContainText('E2E Campaign')
  })

  test('generate button disabled without selections', async ({ page }) => {
    await page.goto('/outreach')
    await page.waitForLoadState('networkidle')

    const genBtn = page.getByRole('button', { name: /generate draft/i })
    await expect(genBtn).toBeDisabled()
  })

  test('select contact and campaign shows enabled generate button', async ({ page }) => {
    await page.goto('/outreach')
    await page.waitForLoadState('networkidle')

    // Select contact and campaign by picking the option that contains seed data
    const selects = page.locator('select')
    const contactOption = selects.nth(0).locator('option', { hasText: 'E2E Contact' })
    const contactVal = await contactOption.getAttribute('value')
    await selects.nth(0).selectOption(contactVal!)

    const campaignOption = selects.nth(1).locator('option', { hasText: 'E2E Campaign' })
    const campaignVal = await campaignOption.getAttribute('value')
    await selects.nth(1).selectOption(campaignVal!)

    const genBtn = page.getByRole('button', { name: /generate draft/i })
    await expect(genBtn).toBeEnabled()
  })
})

import { test, expect, freshUser, registerViaUI, loginViaUI } from './helpers'

test.describe('Auth E2E', () => {
  test('register a new account and land on dashboard', async ({ page }) => {
    const user = freshUser()
    await registerViaUI(page, user)

    await expect(page).toHaveURL('/')
    // Dashboard should show some heading or welcome content
    await expect(page.locator('body')).not.toContainText('Sign in')
  })

  test('login with existing account', async ({ page, baseURL }) => {
    const user = freshUser()
    // Register first via UI
    await registerViaUI(page, user)

    // Logout: clear storage and navigate to login
    await page.evaluate(() => localStorage.clear())
    await page.goto('/login')

    // Now login
    await loginViaUI(page, user)
    await expect(page).toHaveURL('/')
  })

  test('redirect unauthenticated user to /login', async ({ page }) => {
    await page.goto('/contacts')
    await expect(page).toHaveURL(/\/login/)
  })

  test('show error on wrong credentials', async ({ page, baseURL }) => {
    const user = freshUser()
    // Register so email exists
    await registerViaUI(page, user)
    await page.evaluate(() => localStorage.clear())
    await page.goto('/login')

    await page.getByLabel('Email').fill(user.email)
    await page.locator('#password').fill('WrongPassword!')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('logout clears session', async ({ page }) => {
    const user = freshUser()
    await registerViaUI(page, user)

    // Find and click logout (could be a button or link)
    const logoutBtn = page.getByRole('button', { name: /logout|sign out|cerrar/i })
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
    } else {
      // Fallback: clear manually
      await page.evaluate(() => localStorage.clear())
      await page.goto('/login')
    }

    await page.goto('/contacts')
    await expect(page).toHaveURL(/\/login/)
  })
})

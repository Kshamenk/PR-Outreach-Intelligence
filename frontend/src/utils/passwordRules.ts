export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

export const passwordRules: PasswordRule[] = [
  {
    id: 'min-length',
    label: 'At least 8 characters',
    test: (p) => p.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter',
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: 'number',
    label: 'One number',
    test: (p) => /\d/.test(p),
  },
]

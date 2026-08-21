export const isValidToken = (token) => {
  if (typeof token !== 'string') return false
  const normalizedToken = token.trim().toLowerCase()
  return normalizedToken.length > 0 && normalizedToken !== 'undefined' && normalizedToken !== 'null'
}

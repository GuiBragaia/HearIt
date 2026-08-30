const KEY = 'hear-it-nonstop-hello'

export function hasSeenNonstopHello() {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return true
  }
}

export function markNonstopHelloSeen() {
  try {
    window.localStorage.setItem(KEY, '1')
  } catch {
    /* ignore */
  }
}

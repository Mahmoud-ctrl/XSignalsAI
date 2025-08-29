export function cn(...inputs) {
  const classes = []
  
  for (const input of inputs) {
    if (!input) continue
    
    if (typeof input === 'string') {
      classes.push(input)
    } else if (Array.isArray(input)) {
      const merged = cn(...input)
      if (merged) classes.push(merged)
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) {
          classes.push(key)
        }
      }
    }
  }
  
  return classes.join(' ')
}
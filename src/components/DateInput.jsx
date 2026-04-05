import { useState } from 'react'

export default function DateInput({ value, onChange, id, placeholder }) {
  // Convert YYYY-MM-DD to D.M.YYYY for display
  const toFinnish = (isoDate) => {
    if (!isoDate) return ''
    const [y, m, d] = isoDate.split('-')
    if (!y || !m || !d) return ''
    return `${parseInt(d)}.${parseInt(m)}.${y}`
  }

  const [text, setText] = useState(toFinnish(value))

  // Parse Finnish date (D.M.YYYY) to YYYY-MM-DD
  const parseDate = (input) => {
    const trimmed = input.trim()
    if (!trimmed) {
      onChange('')
      return
    }
    const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (match) {
      const day = match[1].padStart(2, '0')
      const month = match[2].padStart(2, '0')
      const year = match[3]
      onChange(`${year}-${month}-${day}`)
    }
  }

  const handleChange = (e) => {
    setText(e.target.value)
  }

  const handleBlur = () => {
    parseDate(text)
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className="input"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder || 'pp.kk.vvvv'}
    />
  )
}

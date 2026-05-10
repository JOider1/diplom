export function exportToCSV(filename, rows) {
  if (!rows?.length) {
    return
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key))
      return set
    }, new Set()),
  )

  const escapeValue = (value) => {
    const normalized = value == null ? '' : String(value)
    if (normalized.includes('"') || normalized.includes(',') || normalized.includes('\n')) {
      return `"${normalized.replaceAll('"', '""')}"`
    }
    return normalized
  }

  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeValue(row[header])).join(',')),
  ].join('\n')

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

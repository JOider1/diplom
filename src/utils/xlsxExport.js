import * as XLSX from 'xlsx'

const safeSheetName = (name) => name.replace(/[[\]:*?/\\]/g, '_').slice(0, 31) || 'Sheet'

export function exportWorkbook(filename, sheets) {
  const wb = XLSX.utils.book_new()
  sheets.forEach(({ name, rows }) => {
    const data = rows?.length ? rows : [{ Примітка: 'Немає даних' }]
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(name))
  })
  const out = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(wb, out)
}

export function exportRows(filename, sheetName, rows) {
  exportWorkbook(filename, [{ name: sheetName, rows }])
}

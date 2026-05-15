import * as XLSX from 'xlsx-js-style'

const safeSheetName = (name) => name.replace(/[[\]:*?/\\]/g, '_').slice(0, 31) || 'Sheet'

const BORDER = {
  top: { style: 'thin', color: { rgb: '94A3B8' } },
  bottom: { style: 'thin', color: { rgb: '94A3B8' } },
  left: { style: 'thin', color: { rgb: '94A3B8' } },
  right: { style: 'thin', color: { rgb: '94A3B8' } },
}

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: '2F4D71' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER,
}

const CELL_STYLE = {
  font: { sz: 10, color: { rgb: '1E293B' } },
  alignment: { vertical: 'center', wrapText: true },
  border: BORDER,
}

const EVEN_ROW_STYLE = {
  ...CELL_STYLE,
  fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } },
}

function cellDisplayLength(value) {
  if (value == null) {
    return 0
  }
  const text = String(value)
  return text.split('\n').reduce((max, line) => Math.max(max, line.length), 0)
}

function buildColumnWidths(rows, headers) {
  const keys = headers.length ? headers : Object.keys(rows[0] || {})
  return keys.map((key, colIndex) => {
    let maxLen = cellDisplayLength(key)
    rows.forEach((row) => {
      const val = Array.isArray(row) ? row[colIndex] : row[key]
      maxLen = Math.max(maxLen, cellDisplayLength(val))
    })
    return { wch: Math.min(Math.max(maxLen + 2, 10), 48) }
  })
}

function styleWorksheet(ws, rowCount, colCount) {
  for (let r = 0; r < rowCount; r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = ws[addr]
      if (!cell) {
        continue
      }
      if (r === 0) {
        cell.s = HEADER_STYLE
        continue
      }
      const base = r % 2 === 0 ? EVEN_ROW_STYLE : CELL_STYLE
      const isNumber = cell.t === 'n'
      cell.s = {
        ...base,
        alignment: {
          ...base.alignment,
          horizontal: isNumber ? 'right' : 'left',
        },
      }
    }
  }

  ws['!views'] = [{ state: 'frozen', ySplit: 1, activeCell: 'A2', showGridLines: true }]
}

function createStyledSheet(rows) {
  const data = rows?.length ? rows : [{ Примітка: 'Немає даних' }]
  const ws = XLSX.utils.json_to_sheet(data)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  const rowCount = range.e.r - range.s.r + 1
  const colCount = range.e.c - range.s.c + 1
  const headers = Object.keys(data[0] || {})

  ws['!cols'] = buildColumnWidths(data, headers)
  styleWorksheet(ws, rowCount, colCount)
  return ws
}

export function exportWorkbook(filename, sheets) {
  const wb = XLSX.utils.book_new()
  sheets.forEach(({ name, rows }) => {
    XLSX.utils.book_append_sheet(wb, createStyledSheet(rows), safeSheetName(name))
  })
  const out = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(wb, out)
}

export function exportRows(filename, sheetName, rows) {
  exportWorkbook(filename, [{ name: sheetName, rows }])
}

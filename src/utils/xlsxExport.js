import * as XLSX from 'xlsx-js-style'

const safeSheetName = (name) => name.replace(/[[\]:*?/\\]/g, '_').slice(0, 31) || 'Sheet'

const BORDER_THIN = {
  top: { style: 'thin', color: { rgb: 'CBD5E1' } },
  bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
  left: { style: 'thin', color: { rgb: 'CBD5E1' } },
  right: { style: 'thin', color: { rgb: 'CBD5E1' } },
}

const BORDER_MEDIUM = {
  top: { style: 'medium', color: { rgb: '2F4D71' } },
  bottom: { style: 'medium', color: { rgb: '2F4D71' } },
  left: { style: 'medium', color: { rgb: '2F4D71' } },
  right: { style: 'medium', color: { rgb: '2F4D71' } },
}

const DOC_TITLE_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 18, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: '2F4D71' } },
  alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
}

const DOC_SUBTITLE_STYLE = {
  font: { bold: true, color: { rgb: 'F1F5F9' }, sz: 11, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: '3C5F8A' } },
  alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
}

const DOC_META_STYLE = {
  font: { color: { rgb: '64748B' }, sz: 9, italic: true, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } },
  alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
}

const SHEET_TITLE_STYLE = {
  font: { bold: true, color: { rgb: '1E293B' }, sz: 14, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: 'EFF6FF' } },
  alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
  border: { bottom: { style: 'medium', color: { rgb: '2F4D71' } } },
}

const SECTION_TITLE_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: '475569' } },
  alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
}

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: '2F4D71' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_THIN,
}

const CELL_STYLE_ODD = {
  font: { sz: 10, color: { rgb: '1E293B' }, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
  alignment: { vertical: 'center', wrapText: true },
  border: BORDER_THIN,
}

const CELL_STYLE_EVEN = {
  ...CELL_STYLE_ODD,
  fill: { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } },
}

const TOTAL_ROW_STYLE = {
  font: { bold: true, color: { rgb: '1E293B' }, sz: 10, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: 'FEF3C7' } },
  alignment: { vertical: 'center' },
  border: BORDER_MEDIUM,
}

const KPI_LABEL_STYLE = {
  font: { sz: 10, color: { rgb: '64748B' }, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
  alignment: { vertical: 'center', horizontal: 'left', indent: 1 },
  border: BORDER_THIN,
}

const KPI_VALUE_STYLE = {
  font: { bold: true, sz: 12, color: { rgb: '2F4D71' }, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
  alignment: { vertical: 'center', horizontal: 'right', indent: 1 },
  border: BORDER_THIN,
}

const KPI_UNIT_STYLE = {
  font: { sz: 9, color: { rgb: '94A3B8' }, italic: true, name: 'Segoe UI' },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
  alignment: { vertical: 'center', horizontal: 'left', indent: 1 },
  border: BORDER_THIN,
}

function cellDisplayLength(value) {
  if (value == null) return 0
  return String(value)
    .split('\n')
    .reduce((max, line) => Math.max(max, line.length), 0)
}

function detectNumberFormat(value, header) {
  const h = String(header || '').toLowerCase()
  if (!Number.isFinite(value)) return undefined
  if (h.includes('грн') || h.includes('₴') || h.includes('вартість') || h.includes('собівартість')) {
    return '#,##0\\ "₴"'
  }
  if (h.includes('кг') || h.includes('тонн') || /^т$/i.test(header) || h.endsWith(', т')) {
    return '#,##0.00'
  }
  if (h.includes('%') || h.includes('частка')) {
    return '0.0'
  }
  if (Number.isInteger(value) && Math.abs(value) >= 1000) return '#,##0'
  if (!Number.isInteger(value)) return '#,##0.00'
  return undefined
}

/**
 * Determine the dominant column type from sample rows so the whole column
 * is aligned consistently regardless of individual cell values.
 */
function detectColumnTypes(headers, rows) {
  return headers.map((header, colIdx) => {
    const h = String(header).toLowerCase()
    // Header hints first
    if (
      h.includes('кг') ||
      h.includes('грн') ||
      h.includes('₴') ||
      h.includes('тонн') ||
      h.includes('вартість') ||
      h.includes('собівартість') ||
      h.includes('кількість') ||
      h.includes('одиниць') ||
      h.includes('частка') ||
      h.includes('%') ||
      h === 'id' ||
      h.endsWith(', т') ||
      /^т$/i.test(header)
    ) {
      return 'number'
    }
    if (h.includes('час') || h.includes('дата') || h.includes('відкрито') || h.includes('закрито')) {
      return 'date'
    }
    // Fall back to sampling
    let num = 0
    let text = 0
    rows.slice(0, 8).forEach((row) => {
      const v = Array.isArray(row) ? row[colIdx] : row[header]
      if (typeof v === 'number' && Number.isFinite(v)) num += 1
      else if (v != null && v !== '') text += 1
    })
    return num > text ? 'number' : 'text'
  })
}

function writeCell(ws, r, c, value, style, numFmt) {
  const addr = XLSX.utils.encode_cell({ r, c })
  const isNumber = typeof value === 'number' && Number.isFinite(value)
  const isDate = value instanceof Date
  ws[addr] = {
    v: value ?? '',
    t: isNumber ? 'n' : isDate ? 'd' : 's',
    s: style,
  }
  if (numFmt) ws[addr].z = numFmt
}

function buildColumnWidths(sections, colCount) {
  const widths = Array(colCount).fill(10)
  sections.forEach((section) => {
    const headers = section.headers || []
    headers.forEach((h, c) => {
      widths[c] = Math.max(widths[c], cellDisplayLength(h) + 4)
    })
    ;(section.rows || []).forEach((row) => {
      const values = Array.isArray(row) ? row : headers.map((h) => row[h])
      values.forEach((v, c) => {
        if (c < colCount) widths[c] = Math.max(widths[c], cellDisplayLength(v) + 2)
      })
    })
    ;(section.totals || []).forEach((v, c) => {
      if (c < colCount) widths[c] = Math.max(widths[c], cellDisplayLength(v) + 2)
    })
  })
  return widths.map((w) => ({ wch: Math.min(Math.max(w, 10), 48) }))
}

/**
 * Build a sheet with: doc title → subtitle → meta → sheet title → sections.
 * Each section: title row + header row + data rows + optional totals row.
 *
 * @param {object} cfg
 * @param {string} cfg.docTitle
 * @param {string} cfg.docSubtitle
 * @param {string} cfg.generatedAt
 * @param {string} cfg.sheetTitle
 * @param {Array<{title?:string, headers:string[], rows:Array, totals?:Array, kpis?:Array<{label:string,value:any,unit?:string}>}>} cfg.sections
 */
function buildSectionedSheet(cfg) {
  const ws = {}
  const merges = []
  const rowHeights = []
  let row = 0

  const maxCols = cfg.sections.reduce(
    (max, s) => Math.max(max, (s.headers || []).length, s.kpis ? 3 : 0),
    1,
  )
  const colCount = Math.max(maxCols, 4)

  // Document title (large blue bar)
  writeCell(ws, row, 0, cfg.docTitle || '', DOC_TITLE_STYLE)
  for (let c = 1; c < colCount; c += 1) writeCell(ws, row, c, '', DOC_TITLE_STYLE)
  merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
  rowHeights[row] = { hpt: 32 }
  row += 1

  // Subtitle
  if (cfg.docSubtitle) {
    writeCell(ws, row, 0, cfg.docSubtitle, DOC_SUBTITLE_STYLE)
    for (let c = 1; c < colCount; c += 1) writeCell(ws, row, c, '', DOC_SUBTITLE_STYLE)
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
    rowHeights[row] = { hpt: 22 }
    row += 1
  }

  // Meta
  if (cfg.generatedAt) {
    writeCell(ws, row, 0, `Сформовано: ${cfg.generatedAt}`, DOC_META_STYLE)
    for (let c = 1; c < colCount; c += 1) writeCell(ws, row, c, '', DOC_META_STYLE)
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
    rowHeights[row] = { hpt: 18 }
    row += 1
  }

  // Sheet title
  if (cfg.sheetTitle) {
    row += 1 // spacer
    writeCell(ws, row, 0, cfg.sheetTitle, SHEET_TITLE_STYLE)
    for (let c = 1; c < colCount; c += 1) writeCell(ws, row, c, '', SHEET_TITLE_STYLE)
    merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
    rowHeights[row] = { hpt: 26 }
    row += 1
  }

  // Sections
  cfg.sections.forEach((section, sIdx) => {
    if (sIdx > 0 || cfg.sheetTitle) {
      row += 1 // spacer between sections
    }

    if (section.title) {
      writeCell(ws, row, 0, section.title, SECTION_TITLE_STYLE)
      for (let c = 1; c < colCount; c += 1) writeCell(ws, row, c, '', SECTION_TITLE_STYLE)
      merges.push({ s: { r: row, c: 0 }, e: { r: row, c: colCount - 1 } })
      rowHeights[row] = { hpt: 22 }
      row += 1
    }

    // KPI block (label | value | unit)
    if (section.kpis && section.kpis.length) {
      section.kpis.forEach((kpi) => {
        writeCell(ws, row, 0, kpi.label, KPI_LABEL_STYLE)
        const numFmt = detectNumberFormat(kpi.value, kpi.unit || kpi.label)
        writeCell(ws, row, 1, kpi.value, KPI_VALUE_STYLE, numFmt)
        writeCell(ws, row, 2, kpi.unit || '', KPI_UNIT_STYLE)
        for (let c = 3; c < colCount; c += 1) writeCell(ws, row, c, '', KPI_UNIT_STYLE)
        if (colCount > 3) merges.push({ s: { r: row, c: 2 }, e: { r: row, c: colCount - 1 } })
        rowHeights[row] = { hpt: 20 }
        row += 1
      })
      return
    }

    const headers = section.headers || []
    if (!headers.length) return

    // Headers
    headers.forEach((h, c) => writeCell(ws, row, c, h, HEADER_STYLE))
    rowHeights[row] = { hpt: 24 }
    row += 1

    // Detect column types once per section
    const colTypes = detectColumnTypes(headers, section.rows || [])
    const colAlignment = (idx) => (colTypes[idx] === 'number' ? 'right' : 'left')

    // Data rows
    const rows = section.rows || []
    if (rows.length === 0) {
      writeCell(ws, row, 0, 'Немає даних за обраний період', {
        ...CELL_STYLE_ODD,
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        font: { ...CELL_STYLE_ODD.font, italic: true, color: { rgb: '94A3B8' } },
      })
      for (let c = 1; c < headers.length; c += 1) {
        writeCell(ws, row, c, '', CELL_STYLE_ODD)
      }
      merges.push({ s: { r: row, c: 0 }, e: { r: row, c: headers.length - 1 } })
      row += 1
    } else {
      rows.forEach((rowData, idx) => {
        const baseStyle = idx % 2 === 0 ? CELL_STYLE_ODD : CELL_STYLE_EVEN
        const values = Array.isArray(rowData) ? rowData : headers.map((h) => rowData[h])
        // Iterate over ALL header columns so empty cells still get styled
        for (let c = 0; c < headers.length; c += 1) {
          const val = values[c]
          const isNum = typeof val === 'number' && Number.isFinite(val)
          const style = {
            ...baseStyle,
            alignment: {
              vertical: 'center',
              wrapText: true,
              horizontal: colAlignment(c),
              indent: 1,
            },
          }
          const numFmt = isNum ? detectNumberFormat(val, headers[c]) : undefined
          writeCell(ws, row, c, val == null ? '' : val, style, numFmt)
        }
        row += 1
      })
    }

    // Totals — fill all header columns
    if (section.totals && section.totals.length) {
      for (let c = 0; c < headers.length; c += 1) {
        const val = section.totals[c]
        const isNum = typeof val === 'number' && Number.isFinite(val)
        const numFmt = isNum ? detectNumberFormat(val, headers[c]) : undefined
        writeCell(
          ws,
          row,
          c,
          val == null ? '' : val,
          {
            ...TOTAL_ROW_STYLE,
            alignment: {
              vertical: 'center',
              horizontal: colAlignment(c),
              indent: 1,
            },
          },
          numFmt,
        )
      }
      rowHeights[row] = { hpt: 22 }
      row += 1
    }
  })

  ws['!ref'] = `A1:${XLSX.utils.encode_cell({ r: Math.max(row - 1, 0), c: colCount - 1 })}`
  ws['!merges'] = merges
  ws['!cols'] = buildColumnWidths(cfg.sections, colCount)
  ws['!rows'] = rowHeights
  ws['!views'] = [{ state: 'frozen', ySplit: cfg.sheetTitle ? 5 : 4, showGridLines: false }]
  ws['!margins'] = { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }

  return ws
}

/**
 * Build a great-looking multi-sheet report workbook.
 * @param {object} cfg
 * @param {string} cfg.filename
 * @param {string} cfg.docTitle - shown at the top of every sheet
 * @param {string} cfg.docSubtitle - shown under the title (e.g. period range)
 * @param {string} cfg.generatedAt - timestamp string
 * @param {Array<{name:string, title?:string, sections:Array}>} cfg.sheets
 */
export function exportReportWorkbook(cfg) {
  const wb = XLSX.utils.book_new()
  wb.Props = {
    Title: cfg.docTitle || 'Звіт',
    Subject: cfg.docSubtitle || '',
    Company: 'Комбікормовий завод · Digital Shift Journal',
    CreatedDate: new Date(),
  }

  cfg.sheets.forEach((sheet) => {
    const ws = buildSectionedSheet({
      docTitle: cfg.docTitle,
      docSubtitle: cfg.docSubtitle,
      generatedAt: cfg.generatedAt,
      sheetTitle: sheet.title || sheet.name,
      sections: sheet.sections || [],
    })
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(sheet.name))
  })

  const out = cfg.filename.endsWith('.xlsx') ? cfg.filename : `${cfg.filename}.xlsx`
  XLSX.writeFile(wb, out)
}

/**
 * Simple export — single sheet, uses the new styled structure.
 * Adds a document title and a section table.
 * `options.totals` can be array or object keyed by header.
 */
export function exportRows(filename, sheetName, rows, options = {}) {
  const headers = rows.length ? Object.keys(rows[0]) : []
  let totals = options.totals
  if (totals && !Array.isArray(totals)) {
    totals = headers.map((h) => totals[h] ?? '')
  }
  exportReportWorkbook({
    filename,
    docTitle: options.docTitle || sheetName,
    docSubtitle: options.docSubtitle || `Експорт: ${sheetName}`,
    generatedAt: options.generatedAt || new Date().toLocaleString('uk-UA'),
    sheets: [
      {
        name: sheetName,
        title: options.sheetTitle || sheetName,
        sections: [
          {
            title: options.sectionTitle || sheetName,
            headers,
            rows,
            totals,
          },
        ],
      },
    ],
  })
}

/**
 * Backward-compat — accepts the old { name, rows } shape and renders each as a separate sheet
 * with its own title.
 */
export function exportWorkbook(filename, sheets, options = {}) {
  exportReportWorkbook({
    filename,
    docTitle: options.docTitle || 'Звіт',
    docSubtitle: options.docSubtitle || '',
    generatedAt: options.generatedAt || new Date().toLocaleString('uk-UA'),
    sheets: sheets.map((s) => ({
      name: s.name,
      title: s.title || s.name,
      sections: [
        {
          title: s.sectionTitle || s.name,
          headers: s.rows.length ? Object.keys(s.rows[0]) : [],
          rows: s.rows,
        },
      ],
    })),
  })
}

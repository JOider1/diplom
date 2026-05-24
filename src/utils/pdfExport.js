import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'

// pdfmake's vfs_fonts has different export shapes across versions.
// Normalize to a single vfs registration so Roboto (with Cyrillic) is available.
const vfs =
  pdfFonts?.pdfMake?.vfs ||
  pdfFonts?.default?.pdfMake?.vfs ||
  pdfFonts?.vfs ||
  pdfFonts?.default ||
  pdfFonts
if (vfs && typeof vfs === 'object') {
  pdfMake.vfs = vfs
}

const COLORS = {
  primary: '#2F4D71',
  primaryDark: '#1E3656',
  primaryLight: '#3C5F8A',
  accent: '#EA580C',
  accentLight: '#FED7AA',
  textDark: '#1E293B',
  textMid: '#475569',
  textMuted: '#64748B',
  bgLight: '#F8FAFC',
  bgAlt: '#EFF6FF',
  borderLight: '#CBD5E1',
  borderDark: '#94A3B8',
  totalBg: '#FEF3C7',
  totalBorder: '#F59E0B',
  sectionBg: '#475569',
  white: '#FFFFFF',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
}

function formatValue(v) {
  if (v == null || v === '') return ''
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (Number.isInteger(v) && Math.abs(v) >= 1000) return v.toLocaleString('uk-UA')
    if (!Number.isInteger(v))
      return v.toLocaleString('uk-UA', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
    return String(v)
  }
  return String(v)
}

function detectColumnTypes(headers, rows) {
  return headers.map((header, colIdx) => {
    const h = String(header).toLowerCase()
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

// ── KPI block as a styled table ───────────────────────────────────────
function buildKpiBlock(kpis) {
  const colsPerRow = kpis.length <= 3 ? kpis.length : kpis.length <= 4 ? 2 : 3
  const rows = []
  for (let i = 0; i < kpis.length; i += colsPerRow) {
    const rowCells = []
    for (let j = 0; j < colsPerRow; j += 1) {
      const kpi = kpis[i + j]
      if (kpi) {
        rowCells.push({
          stack: [
            { text: kpi.label, style: 'kpiLabel' },
            {
              text: `${formatValue(kpi.value)}${kpi.unit ? ' ' + kpi.unit : ''}`,
              style: 'kpiValue',
            },
          ],
          margin: [10, 8, 10, 8],
          fillColor: COLORS.bgLight,
        })
      } else {
        rowCells.push({ text: '', border: [false, false, false, false] })
      }
    }
    rows.push(rowCells)
  }
  return {
    table: {
      widths: Array(colsPerRow).fill('*'),
      body: rows,
    },
    layout: {
      hLineColor: () => COLORS.borderLight,
      vLineColor: () => COLORS.borderLight,
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 12],
  }
}

// ── Data table with header / alt rows / totals ───────────────────────
function buildDataTable(headers, dataRows, totalsRow) {
  const colTypes = detectColumnTypes(headers, dataRows)
  const align = (i) => (colTypes[i] === 'number' ? 'right' : 'left')

  const tableBody = []

  // Header row
  tableBody.push(
    headers.map((h) => ({
      text: h,
      style: 'tableHeader',
      alignment: 'center',
    })),
  )

  if (dataRows.length === 0) {
    tableBody.push([
      {
        text: 'Немає даних за обраний період',
        colSpan: headers.length,
        alignment: 'center',
        italics: true,
        color: COLORS.textMuted,
        margin: [4, 8, 4, 8],
        fontSize: 9,
      },
      ...Array(Math.max(headers.length - 1, 0)).fill({}),
    ])
  } else {
    dataRows.forEach((rowData) => {
      const values = Array.isArray(rowData)
        ? rowData
        : headers.map((h) => rowData[h])
      tableBody.push(
        headers.map((_, i) => ({
          text: formatValue(values[i]),
          alignment: align(i),
          style: 'tableCell',
        })),
      )
    })
  }

  let hasTotals = false
  if (totalsRow && totalsRow.length) {
    hasTotals = true
    tableBody.push(
      headers.map((_, i) => ({
        text: formatValue(totalsRow[i] ?? ''),
        alignment: align(i),
        style: 'tableTotal',
      })),
    )
  }

  // Column widths: numeric → auto, text → *
  const widths = headers.map((_, i) => (colTypes[i] === 'number' ? 'auto' : '*'))

  return {
    table: {
      headerRows: 1,
      widths,
      body: tableBody,
      dontBreakRows: true,
    },
    layout: {
      fillColor: (rowIndex, node) => {
        if (rowIndex === 0) return COLORS.primary
        const isLast = rowIndex === node.table.body.length - 1
        if (isLast && hasTotals) return COLORS.totalBg
        return rowIndex % 2 === 0 ? COLORS.bgLight : null
      },
      hLineColor: (i, node) => {
        if (i === 0 || i === node.table.body.length) return COLORS.primary
        if (i === 1) return COLORS.primaryLight
        return COLORS.borderLight
      },
      vLineColor: () => COLORS.borderLight,
      hLineWidth: (i, node) => {
        if (i === 0 || i === node.table.body.length) return 1.2
        if (i === 1) return 0.8
        return 0.4
      },
      vLineWidth: () => 0.4,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5,
    },
    margin: [0, 0, 0, 12],
  }
}

// ── Section title bar ────────────────────────────────────────────────
function buildSectionTitle(title) {
  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: title,
            color: COLORS.white,
            bold: true,
            fontSize: 11,
            margin: [10, 6, 10, 6],
            fillColor: COLORS.sectionBg,
          },
        ],
      ],
    },
    layout: 'noBorders',
    margin: [0, 4, 0, 6],
  }
}

function buildSheetTitle(title) {
  return {
    text: title,
    style: 'sheetTitle',
    margin: [0, 0, 0, 8],
  }
}

// ── Assemble content from sections ───────────────────────────────────
function buildContent(sheets) {
  const content = []
  sheets.forEach((sheet, sheetIdx) => {
    if (sheetIdx > 0) {
      content.push({ text: '', pageBreak: 'before' })
    }
    if (sheet.title) {
      content.push(buildSheetTitle(sheet.title))
    }
    ;(sheet.sections || []).forEach((section) => {
      if (section.title) content.push(buildSectionTitle(section.title))
      if (section.kpis && section.kpis.length) content.push(buildKpiBlock(section.kpis))
      if (section.headers && section.headers.length) {
        content.push(buildDataTable(section.headers, section.rows || [], section.totals))
      }
    })
  })
  return content
}

// ── Main entry: build a PDF document ─────────────────────────────────
export function exportReportPdf(config) {
  const {
    filename,
    docTitle = 'Звіт',
    docSubtitle = '',
    generatedAt = new Date().toLocaleString('uk-UA'),
    sheets = [],
    orientation = 'portrait',
  } = config

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: orientation,
    pageMargins: [35, 100, 35, 50],

    // Repeated header on every page
    header: () => ({
      margin: [35, 22, 35, 0],
      stack: [
        {
          columns: [
            {
              stack: [
                { text: 'КОМБІКОРМОВИЙ ЗАВОД', style: 'headerCompany' },
                { text: docTitle, style: 'headerTitle' },
                docSubtitle && { text: docSubtitle, style: 'headerSubtitle' },
              ].filter(Boolean),
            },
            {
              width: 'auto',
              stack: [
                { text: 'DSJ', style: 'headerLogo', alignment: 'right' },
                { text: 'Digital Shift', style: 'headerLogoSub', alignment: 'right' },
                { text: 'Journal', style: 'headerLogoSub', alignment: 'right' },
              ],
            },
          ],
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 8,
              x2: 525,
              y2: 8,
              lineWidth: 2,
              lineColor: COLORS.primary,
            },
          ],
        },
      ],
    }),

    // Repeated footer with page numbers
    footer: (currentPage, pageCount) => ({
      margin: [35, 10, 35, 0],
      stack: [
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 0,
              x2: 525,
              y2: 0,
              lineWidth: 0.5,
              lineColor: COLORS.borderLight,
            },
          ],
        },
        {
          margin: [0, 6, 0, 0],
          columns: [
            { text: `Сформовано: ${generatedAt}`, style: 'footer' },
            {
              text: `Стор. ${currentPage} з ${pageCount}`,
              style: 'footer',
              alignment: 'right',
            },
          ],
        },
      ],
    }),

    content: buildContent(sheets),

    styles: {
      headerCompany: {
        fontSize: 7,
        color: COLORS.textMuted,
        bold: true,
        characterSpacing: 1.2,
        margin: [0, 0, 0, 3],
      },
      headerTitle: {
        fontSize: 14,
        bold: true,
        color: COLORS.textDark,
      },
      headerSubtitle: {
        fontSize: 8,
        color: COLORS.textMid,
        italics: true,
        margin: [0, 2, 0, 0],
      },
      headerLogo: {
        fontSize: 22,
        bold: true,
        color: COLORS.primary,
        characterSpacing: -1,
      },
      headerLogoSub: {
        fontSize: 7,
        color: COLORS.textMuted,
      },
      sheetTitle: {
        fontSize: 13,
        bold: true,
        color: COLORS.primary,
        decoration: 'underline',
        decorationColor: COLORS.primary,
      },
      tableHeader: {
        bold: true,
        color: COLORS.white,
        fontSize: 9,
      },
      tableCell: {
        fontSize: 9,
        color: COLORS.textDark,
      },
      tableTotal: {
        bold: true,
        fontSize: 9.5,
        color: COLORS.textDark,
      },
      kpiLabel: {
        fontSize: 7.5,
        color: COLORS.textMuted,
        bold: true,
        characterSpacing: 0.4,
      },
      kpiValue: {
        fontSize: 13,
        bold: true,
        color: COLORS.primary,
        margin: [0, 3, 0, 0],
      },
      footer: {
        fontSize: 8,
        color: COLORS.textMuted,
      },
    },

    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
      color: COLORS.textDark,
      lineHeight: 1.3,
    },

    info: {
      title: docTitle,
      author: 'Digital Shift Journal',
      subject: docSubtitle,
      creator: 'Digital Shift Journal · Комбікормовий завод',
    },
  }

  const outFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  pdfMake.createPdf(docDefinition).download(outFilename)
}

/**
 * Simple PDF export — single section table.
 */
export function exportRowsPdf(filename, sheetName, rows, options = {}) {
  const headers = rows.length ? Object.keys(rows[0]) : []
  let totals = options.totals
  if (totals && !Array.isArray(totals)) {
    totals = headers.map((h) => totals[h] ?? '')
  }
  exportReportPdf({
    filename,
    docTitle: options.docTitle || sheetName,
    docSubtitle: options.docSubtitle || '',
    generatedAt: options.generatedAt || new Date().toLocaleString('uk-UA'),
    orientation: options.orientation || 'portrait',
    sheets: [
      {
        name: sheetName,
        title: options.sheetTitle || sheetName,
        sections: [
          {
            title: options.sectionTitle || sheetName,
            headers,
            rows: rows.map((r) => headers.map((h) => r[h])),
            totals,
          },
        ],
      },
    ],
  })
}

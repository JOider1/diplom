function PrintHeader({ title, subtitle }) {
  return (
    <div className="hidden print:block print-page-header">
      <div className="print-header-inner">
        <div>
          <p className="print-company-name">Комбікормовий завод</p>
          <h1 className="print-doc-title">{title}</h1>
          {subtitle && <p className="print-doc-subtitle">{subtitle}</p>}
        </div>
        <div className="print-logo-block">
          <div className="print-logo">DSJ</div>
          <p className="print-generated">Digital Shift Journal</p>
          <p className="print-generated">Сформовано: {new Date().toLocaleString('uk-UA')}</p>
        </div>
      </div>
    </div>
  )
}

export default PrintHeader

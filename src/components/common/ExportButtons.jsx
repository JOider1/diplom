// На мобільному кнопки на повну ширину. На sm+ — auto-розмір.
const BASE =
  'flex-1 sm:flex-none rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60 sm:px-5'

export function ExportPdfButton({ onClick, label = '📄 PDF', disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BASE} bg-rose-500 hover:bg-rose-600`}
    >
      <span className="hidden sm:inline">📄 Експорт у PDF</span>
      <span className="sm:hidden">{label}</span>
    </button>
  )
}

export function ExportXlsxButton({ onClick, label = '📊 Excel', disabled, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BASE} bg-emerald-500 hover:bg-emerald-600`}
    >
      <span className="hidden sm:inline">📊 Експорт у Excel</span>
      <span className="sm:hidden">{label}</span>
    </button>
  )
}

export function HeroActionButton({ onClick, children, disabled, type = 'button', variant = 'orange' }) {
  const palette =
    variant === 'orange'
      ? 'bg-orange-500 hover:bg-orange-600'
      : 'bg-sky-500 hover:bg-sky-600'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BASE} ${palette} disabled:cursor-not-allowed disabled:bg-slate-400 disabled:opacity-70`}
    >
      {children}
    </button>
  )
}

function PageHero({ title, subtitle, eyebrow = 'Комбікормовий завод', children }) {
  return (
    <div className="no-print rounded-xl border border-slate-200 bg-gradient-to-br from-enterprise-700 to-enterprise-800 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-blue-200 sm:text-xs">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-bold leading-tight text-white sm:text-2xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs text-blue-100 sm:text-sm">{subtitle}</p> : null}
        </div>
        {children ? (
          <div className="flex w-full flex-wrap items-stretch gap-2 sm:w-auto sm:items-end">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default PageHero

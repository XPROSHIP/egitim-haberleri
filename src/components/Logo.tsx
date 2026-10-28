import { useTranslation } from 'react-i18next'

/** "Haberleri" kelimesinin harf harf akan renkleri. */
const CHROMA = ['#e4002b', '#f59e0b', '#2f6bff', '#10b981']

export function Logo({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const word = 'Haberleri'
  return (
    <a
      href="https://corummesem.com.tr/"
      onClick={(e) => {
        if (window.location.origin === 'https://corummesem.com.tr' && window.location.pathname === '/') {
          e.preventDefault()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }}
      className="group flex shrink-0 items-center gap-2"
      aria-label="Eğitim Haberleri"
    >
      <span className="h-6 w-[3px] rounded-full bg-accent transition-transform group-hover:scale-y-125" />
      <span className="flex flex-col leading-none">
        <span className="text-[1.0625rem] font-extrabold tracking-tight text-fg">
          Eğitim
          <span className="inline-flex">
            {word.split('').map((ch, i) => (
              <span
                key={i}
                className="eh-chroma"
                style={{ animationDelay: `${(i * 0.13).toFixed(2)}s` }}
              >
                {ch}
              </span>
            ))}
          </span>
        </span>
        {!compact && (
          <span className="mt-0.5 text-[0.5625rem] font-medium tracking-[0.18em] text-faint">
            {t('legal.preparedBy').toLocaleUpperCase('tr')} OMERZEN
          </span>
        )}
      </span>
    </a>
  )
}

export { CHROMA }

import { useTranslation } from 'react-i18next'

export function Logo({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <a href="/" className="group flex shrink-0 items-center gap-2" aria-label="Eğitim Haberleri">
      <span className="h-6 w-[3px] rounded-full bg-accent transition-transform group-hover:scale-y-125" />
      <span className="flex flex-col leading-none">
        <span className="text-[17px] font-extrabold tracking-tight text-fg">
          Eğitim<span className="text-accent">Haberleri</span>
        </span>
        {!compact && (
          <span className="mt-0.5 text-[9px] font-medium tracking-[0.18em] text-faint">
            {t('legal.preparedBy').toLocaleUpperCase('tr')} OMERZEN
          </span>
        )}
      </span>
    </a>
  )
}

import styles from './ModeSwitch.module.css';
import { useTranslation } from '@/i18n';

export type ExplorationMode = 'understand' | 'analyse';

export default function ModeSwitch({ mode, onChange }: { mode: ExplorationMode; onChange: (mode: ExplorationMode) => void }) {
  const { t } = useTranslation();
  return (
    <div className={styles.switcher} role="group" aria-label={t('Information detail mode')}>
      {(['understand', 'analyse'] as const).map(option => (
        <button
          key={option}
          type="button"
          aria-pressed={mode === option}
          className={mode === option ? styles.active : styles.option}
          onClick={() => onChange(option)}
        >
          <span>{t(option === 'understand' ? 'Understand' : 'Analyse')}</span>
          <small>{t(option === 'understand' ? 'guided' : 'finance-grade')}</small>
        </button>
      ))}
    </div>
  );
}

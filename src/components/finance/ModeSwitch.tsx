import styles from './ModeSwitch.module.css';

export type ExplorationMode = 'understand' | 'analyse';

export default function ModeSwitch({ mode, onChange }: { mode: ExplorationMode; onChange: (mode: ExplorationMode) => void }) {
  return (
    <div className={styles.switcher} role="group" aria-label="Information detail mode">
      {(['understand', 'analyse'] as const).map(option => (
        <button
          key={option}
          type="button"
          aria-pressed={mode === option}
          className={mode === option ? styles.active : styles.option}
          onClick={() => onChange(option)}
        >
          <span>{option === 'understand' ? 'Understand' : 'Analyse'}</span>
          <small>{option === 'understand' ? 'guided' : 'finance-grade'}</small>
        </button>
      ))}
    </div>
  );
}

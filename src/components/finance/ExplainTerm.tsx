import { useState } from 'react';
import styles from './ExplainTerm.module.css';

const EXPLANATIONS: Record<string, string> = {
  'fiscal deficit': 'The amount the government needs to finance when expenditure exceeds its non-borrowed receipts. That financing need is commonly met through borrowing; it is often compared with GDP.',
  'budget estimate': 'The annual amount presented in the Union Budget as the government’s plan for the financial year.',
  'provisional actual': 'A cumulative amount recorded in the government accounts that has not yet completed the audit process.',
  'execution rate': 'Actual cumulative receipts or spending divided by the annual Budget Estimate, expressed as a percentage.',
};

export default function ExplainTerm({ term }: { term: string }) {
  const [open, setOpen] = useState(false);
  const explanation = EXPLANATIONS[term.toLowerCase()] ?? 'A definition for this term is not available yet.';
  return <div className={styles.explainer}><button onClick={() => setOpen(value => !value)} aria-expanded={open}>What does {term.toLowerCase()} mean? <span>{open ? '−' : '+'}</span></button>{open && <p>{explanation}</p>}</div>;
}

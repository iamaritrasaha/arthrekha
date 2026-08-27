import { useState } from 'react';
import { METRIC_DEFINITIONS, getMetricDefinition } from '@/data/metricDefinitions';
import styles from './ExplainTerm.module.css';

const EXPLANATIONS: Record<string, string> = {
  'fiscal deficit': 'The amount the government needs to finance when expenditure exceeds its non-borrowed receipts. That financing need is commonly met through borrowing; it is often compared with GDP.',
  'budget estimate': 'The annual amount presented in the Union Budget as the government’s plan for the financial year.',
  'provisional actual': 'A cumulative amount recorded in the government accounts that has not yet completed the audit process.',
  'execution rate': 'Actual cumulative receipts or spending divided by the annual Budget Estimate, expressed as a percentage.',
};

export default function ExplainTerm({ term }: { term: string }) {
  const [open, setOpen] = useState(false);
  const definition = getMetricDefinition(term) ?? Object.values(METRIC_DEFINITIONS).find(item => item.displayName.toLowerCase() === term.toLowerCase()) ?? null;
  const fallback = EXPLANATIONS[term.toLowerCase()] ?? 'A definition for this term is not available yet.';
  return <div className={styles.explainer}><button onClick={() => setOpen(value => !value)} aria-expanded={open}>What does {term.toLowerCase()} mean? <span>{open ? '−' : '+'}</span></button>{open && <div className={styles.content}><p>{definition?.explanation.simple ?? fallback}</p>{definition && <><section><small>WHY IT MATTERS</small><p>{definition.explanation.whyItMatters}</p></section><section><small>TECHNICAL</small><p>{definition.explanation.technical}</p>{definition.formula && <code>{definition.formula}</code>}</section></>}</div>}</div>;
}

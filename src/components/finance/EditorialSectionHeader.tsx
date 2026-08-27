import styles from './EditorialSectionHeader.module.css';

interface EditorialSectionHeaderProps {
  index: string;
  title: string;
  meta?: string;
}

export default function EditorialSectionHeader({ index, title, meta }: EditorialSectionHeaderProps) {
  return <div className={styles.header}>
    <span className={styles.index}>{index}</span>
    <span className={styles.title}>{title}</span>
    {meta && <span className={styles.meta}>{meta}</span>}
  </div>;
}

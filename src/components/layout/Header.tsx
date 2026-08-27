import { Link } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoText}>Arthrekha</span>
          <span className={styles.tagline}>India's public finances, made visible</span>
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <Link to="/" className={styles.navLink}>Home</Link>
          {/* Future navigation */}
          {/* <Link to="/india" className={styles.navLink}>Union Budget</Link> */}
          {/* <Link to="/learn" className={styles.navLink}>Learn</Link> */}
          {/* <Link to="/sources" className={styles.navLink}>Sources</Link> */}
        </nav>
      </div>
    </header>
  );
}

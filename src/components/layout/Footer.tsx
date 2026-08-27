import styles from './Footer.module.css';
import ArthrekhaMark from '@/components/brand/ArthrekhaMark';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.brand}>
            <h3 className={styles.brandName}><ArthrekhaMark size={26} className={styles.footerMark} /> ARTHREKHA</h3>
            <p className={styles.brandTagline}>
              India's public finances, made visible
            </p>
          </div>

          <div className={styles.info}>
            <p className={styles.description}>
              Explore Union Government spending, receipts, deficits and debt through
              interactive visualizations backed by official sources.
            </p>
            <p className={styles.meta}>
              Built with data from the Ministry of Finance and Controller General
              of Accounts.
            </p>
          </div>
        </div>

        <div className={styles.bottom}>
          <nav aria-label="Footer navigation"><Link to="/explore">Explore</Link><Link to="/learn">Learn</Link><Link to="/sources">Sources & methodology</Link></nav>
          <p className={styles.copyright}>
            © 2026 Aritra Saha · Foresight Labs. All rights reserved. Financial data remains attributed to its official Government of India sources.
          </p>
        </div>
      </div>
    </footer>
  );
}

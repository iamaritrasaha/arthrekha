import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.brand}>
            <h3 className={styles.brandName}>Arthrekha</h3>
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
              Built with data from the Ministry of Finance, Controller General of
              Accounts, and Reserve Bank of India.
            </p>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} Arthrekha. All data sourced from official Government of India publications.
          </p>
        </div>
      </div>
    </footer>
  );
}

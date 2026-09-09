import styles from './Footer.module.css';
import ArthrekhaMark from '@/components/brand/ArthrekhaMark';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/i18n';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.brand}>
            <h3 className={styles.brandName}><ArthrekhaMark size={26} className={styles.footerMark} /> ARTHREKHA</h3>
            <p className={styles.brandTagline}>
              {t("India's public finances, made visible")}
            </p>
          </div>

          <div className={styles.info}>
            <p className={styles.description}>
              {t('Explore Union Government spending, receipts, deficits and debt through interactive visualizations backed by official sources.')}
            </p>
            <p className={styles.meta}>
              {t('Built with data from the Ministry of Finance and Controller General of Accounts.')}
            </p>
          </div>
        </div>

        <div className={styles.bottom}>
          <nav aria-label={t('Footer navigation')}><Link to="/explore">{t('Explore')}</Link><Link to="/learn">{t('Learn')}</Link><Link to="/sources">{t('Sources & methodology')}</Link></nav>
          <p className={styles.copyright}>
            {t('© 2026 Aritra Saha · Foresight Labs. All rights reserved. Financial data remains attributed to its official Government of India sources.')}
          </p>
        </div>
      </div>
    </footer>
  );
}

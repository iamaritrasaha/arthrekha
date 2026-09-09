import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import ArthrekhaMark from '@/components/brand/ArthrekhaMark';
import { LANGUAGE_LABELS, useTranslation, type Language } from '@/i18n';
import styles from './Header.module.css';

export default function Header() {
  const { language, setLanguage, t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo} aria-label={t('Arthrekha home')}>
          <span className={styles.wordmark}><ArthrekhaMark size={25} className={styles.rupeeMark} /><span className={styles.logoText}>ARTHREKHA</span></span>
          <span className={styles.tagline}>{t("India's public finances, made visible")}</span>
        </Link>

        <nav className={styles.nav} aria-label={t('Main navigation')}>
          <NavLink to="/explore" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>{t('Explore')}</NavLink>
          <NavLink to="/learn" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>{t('Learn')}</NavLink>
          <NavLink to="/sources" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>{t('Sources')}</NavLink>
          <label className={styles.languageControl}>
            <span className="sr-only">{t('Language')}</span>
            <select value={language} onChange={event => setLanguage(event.target.value as Language)} aria-label={t('Language')}>
              {(Object.keys(LANGUAGE_LABELS) as Language[]).map(option => <option key={option} value={option}>{LANGUAGE_LABELS[option]}</option>)}
            </select>
          </label>
        </nav>
      </div>
    </header>
  );
}

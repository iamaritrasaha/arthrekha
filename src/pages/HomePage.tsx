import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>
            India's public finances, made visible
          </h1>
          <p className={styles.heroDescription}>
            Explore how the Union Government raises money, allocates it, spends it,
            borrows, and services debt through interactive visualizations and
            plain-language explanations.
          </p>
        </div>
      </section>

      <section className={styles.status}>
        <div className="container">
          <div className={styles.statusCard}>
            <h2 className={styles.statusTitle}>🚧 Under Construction</h2>
            <p className={styles.statusText}>
              Arthrekha is currently being built. We're establishing the data pipeline,
              design system, and core architecture.
            </p>
            <div className={styles.statusDetails}>
              <h3>What's coming:</h3>
              <ul>
                <li>Union Budget overview with BE/RE/Actual tracking</li>
                <li>Ministry-wise expenditure allocation</li>
                <li>Budget execution (budget vs reality)</li>
                <li>Deficit and debt visualization</li>
                <li>Historical trends across 5-10 years</li>
                <li>₹100 mode: "Where does ₹100 go?"</li>
                <li>Beginner-friendly explanations for every term</li>
                <li>Full data provenance for every number</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.principles}>
        <div className="container-narrow">
          <h2 className={styles.principlesTitle}>Our Principles</h2>
          <div className={styles.principlesGrid}>
            <div className={styles.principle}>
              <h3>Traceable</h3>
              <p>
                Every number links to its official source: Ministry of Finance,
                Controller General of Accounts, Reserve Bank of India.
              </p>
            </div>
            <div className={styles.principle}>
              <h3>Understandable</h3>
              <p>
                Plain-language explanations for fiscal deficit, capital expenditure,
                and every technical term.
              </p>
            </div>
            <div className={styles.principle}>
              <h3>Accurate</h3>
              <p>
                We distinguish Budget Estimate from Revised Estimate from Actual.
                Provisional data is clearly marked.
              </p>
            </div>
            <div className={styles.principle}>
              <h3>Neutral</h3>
              <p>
                We show data and explain terminology. No political spin, no praise,
                no attacks.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

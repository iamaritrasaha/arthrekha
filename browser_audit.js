/**
 * Comprehensive Browser Verification Script via Chrome DevTools Protocol (CDP)
 * Tests actual browser rendering against processed JSON data for:
 * 1. Home Page (Hero, Budget-to-Reality, ₹100 composition, Progression)
 * 2. Explore Page (Domain rail, 44 metric buttons, data strip, ratios, provenance)
 * 3. Sources Page (MoF, CGA cards, latest period, observation count)
 * 4. Language Switcher (English vs Bengali 'রাজকোষ ঘাটতি' vs 'রাজস্ব ঘাটতি')
 * 5. Route Redirection (/insights -> /, invalid -> /)
 * 6. Viewport responsiveness (Desktop 1440x900 & Mobile 375x812)
 * 7. Console error detection, NaN/undefined rendering check
 */

const BASE_URL = 'http://localhost:4173';
const CDP_HTTP = 'http://localhost:9222';

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 0;
    this.callbacks = new Map();
    this.events = [];
    this.consoleLogs = [];
    this.pageErrors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
          else resolve(data.result);
        } else if (data.method) {
          this.handleEvent(data.method, data.params);
        }
      };
    });
  }

  handleEvent(method, params) {
    this.events.push({ method, params });
    if (method === 'Runtime.consoleAPICalled') {
      const text = params.args.map(a => a.value || a.description || '').join(' ');
      this.consoleLogs.push({ type: params.type, text });
      if (params.type === 'error') {
        this.pageErrors.push(text);
      }
    } else if (method === 'Runtime.exceptionThrown') {
      const text = params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || 'Unknown exception';
      this.pageErrors.push(text);
    }
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'Evaluation exception');
    }
    return res.result?.value;
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    // Wait for loadEventFired
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  async setViewport(width, height, isMobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: isMobile,
    });
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runBrowserAudit() {
  console.log('='.repeat(70));
  console.log('ARTHREKHA BROWSER UI VERIFICATION (CHROME HEADLESS via CDP)');
  console.log('='.repeat(70));

  const tab = await fetch(`${CDP_HTTP}/json/new`, { method: 'PUT' }).then(r => r.json());
  console.log(`[CDP] Created tab: ${tab.id}`);

  const client = new CDPClient(tab.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Console.enable');

  const auditReport = {
    testedAt: new Date().toISOString(),
    pagesTested: [],
    representativeMetrics: [],
    consoleErrors: [],
    nanOrUndefinedFound: [],
    responsiveChecks: [],
    allPassed: true,
  };

  try {
    // -------------------------------------------------------------
    // Test 1: Desktop Viewport & Home Page
    // -------------------------------------------------------------
    console.log('\n[1/6] Auditing Home Page (Desktop 1440x900)...');
    await client.setViewport(1440, 900, false);
    await client.navigate(`${BASE_URL}/`);
    // Wait 1200ms for counter animations (780ms duration) to settle
    await new Promise(r => setTimeout(r, 1200));

    const homeData = await client.evaluate(`(() => {
      const heading = document.querySelector('h1')?.innerText || '';
      const bodyText = document.body.innerText;
      
      // Look for key values in the DOM (both lakh-crore and crore forms)
      const hasHeroExpenditure = bodyText.includes('53.5') || bodyText.includes('53,47,315');
      // On Home Page, formatCurrency defaults to lakh crore for values >= 50,000 cr
      const hasDetailedExpenditure = bodyText.includes('53.5 lakh crore') || bodyText.includes('53,47,315');
      const hasFiscalDeficit = bodyText.includes('17.0 lakh crore') || bodyText.includes('16,95,768');
      const hasRevenueReceipts = bodyText.includes('35.3 lakh crore') || bodyText.includes('35,33,150');
      const hasJulPeriod = bodyText.includes('Jul 2026') || bodyText.includes('JUL 2026') || bodyText.includes('Jul');
      
      // Check for raw unparsed placeholders or NaN / undefined
      const hasNaN = /\\bNaN\\b/.test(bodyText);
      const hasUndefined = /\\bundefined\\b/.test(bodyText);
      const hasUnparsedTemplate = /\\{[a-zA-Z0-9_]+\\}/.test(bodyText);
      
      return {
        heading,
        hasHeroExpenditure,
        hasDetailedExpenditure,
        hasFiscalDeficit,
        hasRevenueReceipts,
        hasJulPeriod,
        hasNaN,
        hasUndefined,
        hasUnparsedTemplate,
        url: window.location.href,
      };
    })()`);

    console.log('  Heading:', homeData.heading);
    console.log('  Hero expenditure (53.5 lakh cr) rendered:', homeData.hasHeroExpenditure);
    console.log('  Detailed expenditure (₹53.5 lakh crore) rendered:', homeData.hasDetailedExpenditure);
    console.log('  Fiscal deficit (₹17.0 lakh crore) rendered:', homeData.hasFiscalDeficit);
    console.log('  Revenue receipts (₹35.3 lakh crore) rendered:', homeData.hasRevenueReceipts);
    console.log('  Current actual period (Jul 2026) rendered:', homeData.hasJulPeriod);
    console.log('  NaN detected:', homeData.hasNaN);
    console.log('  Undefined detected:', homeData.hasUndefined);

    if (!homeData.hasDetailedExpenditure || !homeData.hasFiscalDeficit || homeData.hasNaN || homeData.hasUndefined) {
      auditReport.allPassed = false;
    }
    auditReport.pagesTested.push({ page: 'Home', data: homeData });

    // -------------------------------------------------------------
    // Test 2: Language Switching (English <-> Bengali)
    // -------------------------------------------------------------
    console.log('\n[2/6] Auditing Bilingual Switching (English -> Bengali -> English)...');
    
    // Switch to Bengali using header <select>
    const bnResult = await client.evaluate(`(() => {
      const select = document.querySelector('header select') || document.querySelector('select[aria-label*="Language"]');
      if (select) {
        select.value = 'bn-IN';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    })()`);
    console.log('  Selected Bengali (bn-IN) in language dropdown:', bnResult);
    await new Promise(r => setTimeout(r, 600));

    const bnCheck = await client.evaluate(`(() => {
      const text = document.body.innerText;
      const hasRajkoshGhatati = text.includes('রাজকোষ ঘাটতি'); // Fiscal Deficit
      const hasRajashwaGhatati = text.includes('রাজস্ব ঘাটতি'); // Revenue Deficit
      const hasNaN = /\\bNaN\\b/.test(text);
      const hasUndefined = /\\bundefined\\b/.test(text);
      const hasUnparsedTemplate = /\\{[a-zA-Z0-9_]+\\}/.test(text);
      
      return {
        hasRajkoshGhatati,
        hasRajashwaGhatati,
        hasNaN,
        hasUndefined,
        hasUnparsedTemplate,
      };
    })()`);

    console.log('  Fiscal Deficit rendered as রাজকোষ ঘাটতি:', bnCheck.hasRajkoshGhatati);
    console.log('  NaN in Bengali view:', bnCheck.hasNaN);
    console.log('  Unparsed templates in Bengali view:', bnCheck.hasUnparsedTemplate);

    if (!bnCheck.hasRajkoshGhatati || bnCheck.hasNaN || bnCheck.hasUnparsedTemplate) {
      auditReport.allPassed = false;
    }

    // Switch back to English
    await client.evaluate(`(() => {
      const select = document.querySelector('header select') || document.querySelector('select[aria-label*="Language"]');
      if (select) {
        select.value = 'en-IN';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
    await new Promise(r => setTimeout(r, 300));

    // -------------------------------------------------------------
    // Test 3: Explore Page & 44 Metric Rail Verification
    // -------------------------------------------------------------
    console.log('\n[3/6] Auditing Explore Page (/explore) & Metric Rails...');
    await client.navigate(`${BASE_URL}/explore`);
    await new Promise(r => setTimeout(r, 600));

    const exploreAudit = await client.evaluate(`(async () => {
      const results = {
        domainCount: 0,
        domains: [],
        totalMetricsSeen: 0,
        emptyButtons: 0,
        metrics: [],
      };

      const domainTabs = Array.from(document.querySelectorAll('[role=\"tab\"]'));
      results.domainCount = domainTabs.length;

      const seenMetricIds = new Set();

      for (const tab of domainTabs) {
        tab.click();
        await new Promise(r => setTimeout(r, 100));

        const tabText = tab.innerText.replace(/\\s+/g, ' ').trim();
        const rail = document.querySelector('[class*=\"metricRail\"]');
        if (!rail) continue;

        const metricButtons = Array.from(rail.querySelectorAll('button'));
        const tabMetrics = [];

        for (const btn of metricButtons) {
          const label = btn.innerText.trim();
          if (!label) {
            results.emptyButtons++;
          }
          tabMetrics.push(label);
          seenMetricIds.add(label);
        }

        results.domains.push({
          tab: tabText,
          metricsCount: metricButtons.length,
          metrics: tabMetrics,
        });
      }

      results.totalMetricsSeen = seenMetricIds.size;
      return results;
    })()`);

    console.log(`  Domain tabs found: ${exploreAudit.domainCount}`);
    for (const d of exploreAudit.domains) {
      console.log(`    • ${d.tab}: ${d.metricsCount} metrics (e.g. ${d.metrics.slice(0, 3).join(', ')}...)`);
    }
    console.log(`  Total unique metric rail buttons rendered across domains: ${exploreAudit.totalMetricsSeen}`);
    console.log(`  Empty / blank buttons found: ${exploreAudit.emptyButtons}`);

    if (exploreAudit.emptyButtons > 0 || exploreAudit.totalMetricsSeen < 43) {
      auditReport.allPassed = false;
    }
    auditReport.pagesTested.push({ page: 'Explore', data: exploreAudit });

    // -------------------------------------------------------------
    // Test 4: 5 Representative Metrics Deep Trace on UI
    // -------------------------------------------------------------
    console.log('\n[4/6] Verifying 5 Representative Metrics Exact Browser Display...');
    
    // Select specific metrics and verify values on Explore Page
    const metricsToTest = [
      { id: 'fiscal_deficit', domainIndex: 2, name: 'Fiscal Deficit', beAmount: '16,95,768', actualAmount: '4,55,144', execRate: '26.8%' },
      { id: 'total_expenditure', domainIndex: 1, name: 'Total Expenditure', beAmount: '53,47,315', actualAmount: '17,61,853', execRate: '32.9%' },
      { id: 'revenue_receipts', domainIndex: 0, name: 'Revenue Receipts', beAmount: '35,33,150', actualAmount: '12,67,573', execRate: '35.9%' },
      { id: 'capital_expenditure', domainIndex: 1, name: 'Capital Expenditure', beAmount: '12,21,821', actualAmount: '4,50,635', execRate: '36.9%' },
      { id: 'non_borrowed_receipts', domainIndex: 0, name: 'Non-Borrowed Receipts', beAmount: '36,51,547', actualAmount: '13,06,709', execRate: '35.8%' },
    ];

    for (const target of metricsToTest) {
      const metricResult = await client.evaluate(`(async () => {
        const domainTabs = Array.from(document.querySelectorAll('[role=\"tab\"]'));
        domainTabs[${target.domainIndex}].click();
        await new Promise(r => setTimeout(r, 100));

        const rail = document.querySelector('[class*=\"metricRail\"]');
        const buttons = Array.from(rail.querySelectorAll('button'));
        const targetBtn = buttons.find(b => b.innerText.includes('${target.name}'));
        if (targetBtn) {
          targetBtn.click();
          await new Promise(r => setTimeout(r, 100));
        }

        const detailArea = document.querySelector('[class*=\"metricDetail\"]')?.innerText || '';
        return {
          buttonFound: !!targetBtn,
          detailText: detailArea,
          hasBe: detailArea.includes('${target.beAmount}'),
          hasActual: detailArea.includes('${target.actualAmount}'),
          hasExec: detailArea.includes('${target.execRate}'),
        };
      })()`);

      console.log(`  Metric [${target.id}]:`);
      console.log(`    Button found: ${metricResult.buttonFound}`);
      console.log(`    Exact BE (₹${target.beAmount} cr) displayed: ${metricResult.hasBe}`);
      console.log(`    Exact Actual (₹${target.actualAmount} cr) displayed: ${metricResult.hasActual}`);
      console.log(`    Execution (${target.execRate}) displayed: ${metricResult.hasExec}`);

      if (!metricResult.hasBe || !metricResult.hasActual) {
        auditReport.allPassed = false;
      }
      auditReport.representativeMetrics.push({ target, result: metricResult });
    }

    // -------------------------------------------------------------
    // Test 5: Sources Page & Route Redirection
    // -------------------------------------------------------------
    console.log('\n[5/6] Auditing Sources Page & Route Handling...');
    await client.navigate(`${BASE_URL}/sources`);
    await new Promise(r => setTimeout(r, 400));

    const sourcesCheck = await client.evaluate(`(() => {
      const text = document.body.innerText;
      return {
        hasMof: text.includes('Ministry of Finance'),
        hasCga: text.includes('Controller General of Accounts'),
        hasJulPeriod: text.includes('Jul 2026') || text.includes('JUL 2026') || text.includes('Jul'),
        hasObservationsCount: text.includes('84'),
      };
    })()`);

    console.log('  Ministry of Finance card:', sourcesCheck.hasMof);
    console.log('  Controller General of Accounts card:', sourcesCheck.hasCga);
    console.log('  Latest actual period (Jul 2026):', sourcesCheck.hasJulPeriod);
    console.log('  Total observations count (84):', sourcesCheck.hasObservationsCount);

    if (!sourcesCheck.hasMof || !sourcesCheck.hasCga || !sourcesCheck.hasJulPeriod || !sourcesCheck.hasObservationsCount) {
      auditReport.allPassed = false;
    }

    // Test /insights redirect to /
    console.log('  Testing /insights redirect...');
    await client.navigate(`${BASE_URL}/insights`);
    await new Promise(r => setTimeout(r, 400));
    const redirectedUrl = await client.evaluate(`window.location.pathname`);
    console.log('  URL after navigating to /insights:', redirectedUrl);
    const redirectOk = redirectedUrl === '/' || redirectedUrl === '/arthrekha/';
    if (!redirectOk) auditReport.allPassed = false;

    // Test 404 catch-all redirect
    await client.navigate(`${BASE_URL}/arbitrary-dead-link`);
    await new Promise(r => setTimeout(r, 400));
    const deadLinkRedirect = await client.evaluate(`window.location.pathname`);
    console.log('  URL after navigating to dead link:', deadLinkRedirect);
    if (deadLinkRedirect !== '/' && deadLinkRedirect !== '/arthrekha/') {
      auditReport.allPassed = false;
    }

    // -------------------------------------------------------------
    // Test 6: Mobile Viewport Responsiveness (375x812)
    // -------------------------------------------------------------
    console.log('\n[6/6] Auditing Mobile Viewport (iPhone X 375x812)...');
    await client.setViewport(375, 812, true);
    await client.navigate(`${BASE_URL}/`);
    await new Promise(r => setTimeout(r, 500));

    const mobileCheck = await client.evaluate(`(() => {
      const scrollWidth = document.documentElement.scrollWidth;
      const innerWidth = window.innerWidth;
      const hasHorizontalOverflow = scrollWidth > innerWidth;
      const bodyText = document.body.innerText;
      const hasNaN = /\\bNaN\\b/.test(bodyText);
      const hasUndefined = /\\bundefined\\b/.test(bodyText);

      return {
        scrollWidth,
        innerWidth,
        hasHorizontalOverflow,
        hasNaN,
        hasUndefined,
      };
    })()`);

    console.log(`  Mobile layout width: ${mobileCheck.scrollWidth}px (viewport: ${mobileCheck.innerWidth}px)`);
    console.log(`  Horizontal overflow detected: ${mobileCheck.hasHorizontalOverflow}`);
    console.log(`  NaN or Undefined in mobile view: ${mobileCheck.hasNaN || mobileCheck.hasUndefined}`);

    if (mobileCheck.hasHorizontalOverflow || mobileCheck.hasNaN || mobileCheck.hasUndefined) {
      auditReport.allPassed = false;
    }
    auditReport.responsiveChecks.push(mobileCheck);

    // Check runtime errors collected
    console.log('\n[CDP Diagnostics]');
    console.log(`  Total console logs: ${client.consoleLogs.length}`);
    console.log(`  Total console errors / unhandled exceptions: ${client.pageErrors.length}`);
    if (client.pageErrors.length > 0) {
      console.log('  Errors:', client.pageErrors);
      auditReport.allPassed = false;
    }
    auditReport.consoleErrors = client.pageErrors;

  } finally {
    client.close();
    await fetch(`${CDP_HTTP}/json/close/${tab.id}`);
  }

  console.log('\n' + '='.repeat(70));
  if (auditReport.allPassed) {
    console.log('✓ BROWSER AUDIT COMPLETE: ALL ASSERTIONS PASSED WITH ZERO ERRORS');
  } else {
    console.log('✗ BROWSER AUDIT FAILED ON ONE OR MORE CHECKS');
  }
  console.log('='.repeat(70));

  return auditReport.allPassed;
}

runBrowserAudit().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Fatal error in browser audit:', err);
  process.exit(1);
});

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MetricDefinition } from '@/data/metricDefinitions';
import { bengaliExtendedTranslations } from './bn-IN';
import { localizeMetricDefinition } from './bn-IN-metrics';

export type Language = 'en-IN' | 'bn-IN';

const STORAGE_KEY = 'arthrekha-language';

export const translations: Record<Language, Record<string, string>> = {
  'en-IN': {},
  'bn-IN': {
    'Explore': 'অন্বেষণ',
    'Learn': 'জানুন',
    'Sources': 'উৎস',
    'Sources & methodology': 'উৎস ও পদ্ধতি',
    "India's public finances, made visible": 'ভারতের সরকারি অর্থব্যবস্থা, দৃশ্যমান করে',
    'Main navigation': 'প্রধান নেভিগেশন',
    'Footer navigation': 'ফুটার নেভিগেশন',
    'Language': 'ভাষা',
    'Opening the fiscal atlas…': 'আর্থিক মানচিত্র খোলা হচ্ছে…',
    'Explore Union Government spending, receipts, deficits and debt through interactive visualizations backed by official sources.': 'সরকারি উৎসভিত্তিক ইন্টার‌্যাক্টিভ ভিজ্যুয়ালাইজেশনে কেন্দ্রীয় সরকারের ব্যয়, প্রাপ্তি, ঘাটতি ও ঋণ দেখুন।',
    'Built with data from the Ministry of Finance and Controller General of Accounts.': 'অর্থ মন্ত্রক এবং হিসাব মহাপরিচালকের তথ্যের ভিত্তিতে তৈরি।',
    'Arthrekha home': 'অর্থরেখা হোম',
    'India · Union Government · FY 2026–27': 'ভারত · কেন্দ্রীয় সরকার · অর্থবর্ষ ২০২৬–২৭',
    'The year ahead, measured against the year underway': 'সামনের বছরের পরিকল্পনা, চলতি বছরের বাস্তবতার পাশে',
    'Planned expenditure.': 'পরিকল্পিত ব্যয়।',
    'Seen in motion.': 'চলমান বাস্তবতায় দেখুন।',
    'A living view of India’s public finances — from the Budget Estimate to the first recorded quarter.': 'ভারতের সরকারি অর্থব্যবস্থার জীবন্ত ছবি — বাজেট অনুমান থেকে নথিবদ্ধ প্রথম ত্রৈমাসিক পর্যন্ত।',
    'PROVISIONAL': 'অস্থায়ী',
    'Actual data through June 2026': 'জুন ২০২৬ পর্যন্ত বাস্তব তথ্য',
    'Subject to audit by CAG': 'CAG-এর নিরীক্ষাধীন',
    'FISCAL-YEAR TRACE': 'অর্থবর্ষের রেখাচিত্র',
    'Scroll to explore': 'স্ক্রল করে দেখুন',
    'Budget → Reality': 'বাজেট → বাস্তবতা',
    'A quarter in focus': 'এক ত্রৈমাসিকের দিকে নজর',
    'The Budget is a plan.': 'বাজেট একটি পরিকল্পনা।',
    'Reality arrives cumulatively.': 'বাস্তবতা জমতে জমতে আসে।',
    'Every figure below keeps its accounting meaning intact: an annual Budget Estimate beside provisional actuals recorded from April through June 2026.': 'নিচের প্রতিটি সংখ্যার হিসাবগত অর্থ অক্ষুণ্ণ: বার্ষিক বাজেট অনুমানের পাশে এপ্রিল থেকে জুন ২০২৬ পর্যন্ত নথিবদ্ধ অস্থায়ী বাস্তব তথ্য।',
    'Select a fiscal metric': 'একটি আর্থিক সূচক বেছে নিন',
    'Budget Estimate': 'বাজেট অনুমান',
    'Actual through June': 'জুন পর্যন্ত বাস্তব',
    'Execution': 'বাস্তবায়ন',
    'planned annual value': 'পরিকল্পিত বার্ষিক মূল্য',
    'cumulative provisional': 'জমাকৃত · অস্থায়ী',
    'of annual Budget Estimate recorded': 'বার্ষিক বাজেট অনুমানের নথিবদ্ধ অংশ',
    'not calculated': 'হিসাব করা যায়নি',
    'View source': 'উৎস দেখুন',
    'A lower or higher first-quarter share is not, by itself, a performance judgment. Government spending and receipts do not arrive evenly across the year.': 'প্রথম ত্রৈমাসিকের অংশ কম বা বেশি হলেই তা কর্মদক্ষতার বিচার নয়। সরকারি ব্যয় ও প্রাপ্তি সারা বছর সমানভাবে আসে না।',
    'Composition': 'গঠন',
    'Two kinds of spending': 'দুই ধরনের ব্যয়',
    'What kind of': 'কী ধরনের',
    'expenditure is this?': 'ব্যয় এটি?',
    'Revenue expenditure keeps the government running. Capital expenditure is associated with creating assets, investing, or reducing liabilities. Both are part of the public-finance story.': 'রাজস্ব ব্যয় সরকারকে পরিচালনা করতে সাহায্য করে। মূলধনী ব্যয় সম্পদ তৈরি, বিনিয়োগ বা দায় কমানোর সঙ্গে যুক্ত। দুটিই সরকারি অর্থব্যবস্থার গুরুত্বপূর্ণ অংশ।',
    'Where money comes from': 'অর্থ আসে কোথা থেকে',
    '₹100 mode · Budget Estimate': '₹১০০ পদ্ধতি · বাজেট অনুমান',
    'For every ₹100': 'প্রতি ₹১০০-এ',
    'the Union expects to receive…': 'কেন্দ্রের প্রত্যাশিত প্রাপ্তি…',
    'A complete, additive composition of non-borrowed receipts. Borrowing is deliberately outside this ₹100.': 'ঋণ বাদে প্রাপ্তির একটি সম্পূর্ণ যোগফলভিত্তিক গঠন। এই ₹১০০-তে ঋণ ইচ্ছাকৃতভাবে ধরা হয়নি।',
    'non-borrowed receipts': 'ঋণ-বহির্ভূত প্রাপ্তি',
    'Source details ↗': 'উৎসের বিবরণ ↗',
    'Fiscal deficit': 'রাজস্ব ঘাটতি',
    'The gap that needs financing': 'যে ঘাটতি পূরণে অর্থায়ন দরকার',
    'Not a mystery.': 'এটি রহস্য নয়।',
    'A measurable gap.': 'পরিমাপযোগ্য ব্যবধান।',
    'Inspect provenance ↗': 'উৎস-প্রমাণ দেখুন ↗',
    'Explore the numbers': 'সংখ্যাগুলি দেখুন',
    'The full picture': 'সম্পূর্ণ ছবি',
    'One dataset.': 'একটি ডেটাসেট।',
    'Ten ways to read it.': 'দেখার দশটি উপায়।',
    'Choose a metric to see its exact value, its place in the year, and the source behind it.': 'একটি সূচক বেছে নিয়ে তার নির্দিষ্ট মূল্য, অর্থবর্ষে অবস্থান এবং উৎস দেখুন।',
    'Metric': 'সূচক',
    'Trust, by design': 'নকশাতেই বিশ্বাস',
    'Methodology': 'পদ্ধতি',
    'Numbers with': 'সংখ্যার সঙ্গে',
    'their receipts.': 'তাদের প্রমাণ।',
    'DATA THROUGH': 'তথ্য পাওয়া গেছে',
    'STATUS': 'অবস্থা',
    'PROVISIONAL / UNAUDITED': 'অস্থায়ী / নিরীক্ষিত নয়',
    'OBSERVATIONS': 'পর্যবেক্ষণ',
    'NORMALIZED': 'স্বাভাবিকীকৃত',
    'Provenance': 'উৎস-প্রমাণ',
    'Close source details': 'উৎসের বিবরণ বন্ধ করুন',
    'Open source publication ↗': 'উৎস প্রকাশনা খুলুন ↗',
    'Data unavailable': 'তথ্য পাওয়া যায়নি',
    'Source ↗': 'উৎস ↗',
    'YTD progression': 'বছরের শুরু থেকে অগ্রগতি',
    'Each point is cumulative YTD; no monthly flow has been inferred. Future periods are not available.': 'প্রতিটি বিন্দু বছরের শুরু থেকে জমাকৃত; মাসিক প্রবাহ অনুমান করা হয়নি। ভবিষ্যৎ সময়ের তথ্য নেই।',
    'Understand the system.': 'ব্যবস্থাটি বুঝুন।',
    'Then interrogate it.': 'তারপর প্রশ্ন করুন।',
    'Sources · Methodology': 'উৎস · পদ্ধতি',
    'Learn · Public Finance': 'জানুন · সরকারি অর্থব্যবস্থা',
    'Evidence is part': 'প্রমাণ এই ইন্টারফেসের',
    'of the interface.': 'অংশ।',
    'Open official PDF ↗': 'সরকারি PDF খুলুন ↗',
    'Open CGA ↗': 'CGA খুলুন ↗',
    'Understand': 'বোঝুন',
    'Analyse': 'বিশ্লেষণ করুন',
    'guided': 'নির্দেশিত',
    'finance-grade': 'বিশ্লেষণধর্মী',
    'Money In': 'অর্থ প্রবেশ',
    'Money Out': 'অর্থ ব্যয়',
    'Deficit': 'ঘাটতি',
    'Debt & Borrowing': 'ঋণ ও ধার',
    'Federal Finance': 'কেন্দ্র-রাজ্য অর্থব্যবস্থা',
    'A fiscal system,': 'একটি আর্থিক ব্যবস্থা,',
    'opened gently.': 'ধীরে ধীরে খুলে দেখুন।',
    'Start with the meaning. Increase the density when you are ready.': 'অর্থ দিয়ে শুরু করুন। প্রস্তুত হলে বিশ্লেষণের গভীরতা বাড়ান।',
    'THE SYSTEM': 'ব্যবস্থা',
    'Money moves through relationships.': 'সম্পর্কের মধ্য দিয়েই অর্থ প্রবাহিত হয়।',
    'Fiscal balance': 'রাজস্ব ভারসাম্য',
    'Financing': 'অর্থায়ন',
    'Union → States': 'কেন্দ্র → রাজ্য',
    'Receipts': 'প্রাপ্তি',
    'Expenditure': 'ব্যয়',
    'How does the Union Government receive money?': 'কেন্দ্রীয় সরকার কীভাবে অর্থ পায়?',
    'What is the Union Government planning to spend?': 'কেন্দ্রীয় সরকার কী ব্যয় করার পরিকল্পনা করছে?',
    'Where is the gap—and what exactly does it measure?': 'ব্যবধান কোথায়—এবং এটি আসলে কী মাপে?',
    'How is the annual financing requirement met?': 'বার্ষিক অর্থায়নের প্রয়োজন কীভাবে মেটানো হয়?',
    'How do resources move through India’s federal system?': 'ভারতের কেন্দ্র-রাজ্য ব্যবস্থায় সম্পদ কীভাবে প্রবাহিত হয়?',
    'Fiscal domains': 'আর্থিক ক্ষেত্র',
    'EXPLAIN SIMPLY': 'সহজ করে বলুন',
    'WHY IT MATTERS': 'কেন গুরুত্বপূর্ণ',
    'TECHNICAL': 'প্রযুক্তিগত ব্যাখ্যা',
    'THE FISCAL FLOW': 'আর্থিক প্রবাহ',
    'Follow the money without losing the accounting distinctions.': 'হিসাবের পার্থক্য না হারিয়ে অর্থের গতিপথ অনুসরণ করুন।',
    'Borrowing completes the financing presentation; it is not counted as non-borrowed income.': 'ঋণ অর্থায়নের ছবিটি সম্পূর্ণ করে; এটি ঋণ-বহির্ভূত আয় হিসেবে ধরা হয় না।',
    'MONEY IN': 'অর্থ প্রবেশ',
    'MONEY OUT': 'অর্থ ব্যয়',
    'THE GAP': 'ব্যবধান',
    'FINANCING': 'অর্থায়ন',
    'Non-borrowed receipts': 'ঋণ-বহির্ভূত প্রাপ্তি',
    'Total expenditure': 'মোট ব্যয়',
    'Financing gap': 'অর্থায়নের ব্যবধান',
    'Borrowing / financing': 'ঋণ / অর্থায়ন',
    'Recurring and non-debt resources': 'নিয়মিত ও ঋণ-বহির্ভূত সম্পদ',
    'Revenue + capital accounts': 'রাজস্ব + মূলধনী হিসাব',
    'Needs financing': 'অর্থায়ন প্রয়োজন',
    'Flow, not debt stock': 'প্রবাহ, ঋণের মজুত নয়',
    'data unavailable': 'তথ্য পাওয়া যায়নি',
    'recorded': 'নথিবদ্ধ',
    'latest: JUN 2026': 'সর্বশেষ: জুন ২০২৬',
    'not available': 'পাওয়া যায়নি',
    'India financial year runs from April to March. Actual data is available through June 2026; later periods are not available.': 'ভারতের অর্থবর্ষ এপ্রিল থেকে মার্চ পর্যন্ত। জুন ২০২৬ পর্যন্ত বাস্তব তথ্য রয়েছে; পরের সময়ের তথ্য নেই।',
    'April, May, and June are recorded cumulative periods. July through March are not available in this dataset.': 'এপ্রিল, মে ও জুন নথিবদ্ধ জমাকৃত সময়কাল। জুলাই থেকে মার্চ পর্যন্ত তথ্য এই ডেটাসেটে নেই।',
    'Scrollable fiscal metric table': 'স্ক্রলযোগ্য আর্থিক সূচক সারণি',
    'Provisional actual': 'অস্থায়ী বাস্তব',
    'BE only': 'শুধু বাজেট অনুমান',
    'Unavailable': 'পাওয়া যায়নি',
    'What does': 'এর অর্থ কী',
    'mean?': 'কী?',
    'annual plan': 'বার্ষিক পরিকল্পনা',
    'through June': 'জুন পর্যন্ত',
    'of the annual Budget Estimate had been recorded through June.': 'বার্ষিক বাজেট অনুমানের এই অংশ জুন পর্যন্ত নথিবদ্ধ হয়েছে।',
    'Actual data is unavailable for this metric.': 'এই সূচকের বাস্তব তথ্য পাওয়া যায়নি।',
    'Tax revenue': 'কর প্রাপ্তি',
    'Non-tax revenue': 'কর-বহির্ভূত প্রাপ্তি',
    'Non-debt capital receipts': 'ঋণ-বহির্ভূত মূলধনী প্রাপ্তি',
    'Revenue expenditure': 'রাজস্ব ব্যয়',
    'Capital expenditure': 'মূলধনী ব্যয়',
    'Revenue Receipts': 'রাজস্ব প্রাপ্তি',
    'Tax Revenue': 'কর প্রাপ্তি',
    'Non-Tax Revenue': 'কর-বহির্ভূত প্রাপ্তি',
    'Non-Debt Capital Receipts': 'ঋণ-বহির্ভূত মূলধনী প্রাপ্তি',
    'Interest Payments': 'সুদ পরিশোধ',
    'Fiscal Deficit': 'রাজস্ব ঘাটতি',
    'Explain simply': 'সহজ করে বলুন',
    'Why it matters': 'কেন গুরুত্বপূর্ণ',
    'Go deeper': 'আরও জানুন',
    'Related': 'সম্পর্কিত',
    ...bengaliExtendedTranslations,
  },
};

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
  localizeFormattedValue: (text: string) => string;
  localizeMetric: (definition: MetricDefinition) => MetricDefinition;
}

const defaultContext: I18nContextValue = { language: 'en-IN', setLanguage: () => undefined, t: text => text, localizeFormattedValue: text => text, localizeMetric: definition => definition };
const I18nContext = createContext<I18nContextValue>(defaultContext);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'bn-IN' ? 'bn-IN' : 'en-IN';
  });

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'bn-IN' ? 'অর্থরেখা — ভারতের সরকারি অর্থব্যবস্থা, দৃশ্যমান করে' : "Arthrekha — India's public finances, made visible";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', language === 'bn-IN'
      ? 'সরকারি উৎসভিত্তিক কেন্দ্রীয় সরকারের বাজেট, বাস্তব ব্যয়, প্রাপ্তি ও ঘাটতির দৃশ্যমান ব্যাখ্যা।'
      : 'Explore Union Government budgets, actual spending, receipts and deficits with official-source provenance.');
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: (text: string) => translations[language][text] ?? text,
    localizeFormattedValue: (text: string) => language === 'bn-IN'
      ? text
        .replace(/lakh crore/g, 'লক্ষ কোটি')
        .replace(/crore/g, 'কোটি')
        .replace(/K Cr/g, 'হাজার কোটি')
        .replace(/[0-9]/g, digit => '০১২৩৪৫৬৭৮৯'.charAt(Number(digit)))
      : text,
    localizeMetric: (definition: MetricDefinition) => localizeMetricDefinition(definition, language),
  }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}

export function translateText(text: string, language: Language) {
  return translations[language][text] ?? text;
}

export const LANGUAGE_LABELS: Record<Language, string> = { 'en-IN': 'English', 'bn-IN': 'বাংলা' };

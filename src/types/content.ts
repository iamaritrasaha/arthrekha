/**
 * Content types for glossary and explanations
 */

export interface GlossaryTerm {
  term: string;
  slug: string;
  shortDefinition: string;        // One sentence for tooltip
  explanation: string;            // 2-3 sentences, plain language
  example?: string;               // Illustrative example
  relatedTerms?: string[];        // Slugs of related terms
}

export interface EstimateTypeInfo {
  type: 'BE' | 'RE' | 'actual' | 'provisional';
  name: string;
  shortDescription: string;
  explanation: string;
}

export interface MethodologySection {
  title: string;
  slug: string;
  content: string;
  subsections?: Array<{
    title: string;
    content: string;
  }>;
}

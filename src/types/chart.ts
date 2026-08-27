/**
 * Chart and visualization types
 */

import type { FinancialObservation } from './financial';

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  observation?: FinancialObservation;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesPoint extends ChartDataPoint {
  financialYear: string;
  period?: string;
}

export interface ComparisonPoint extends ChartDataPoint {
  budget?: number;
  actual?: number;
  previousYear?: number;
}

export type ChartType =
  | 'line'
  | 'bar'
  | 'grouped-bar'
  | 'stacked-bar'
  | 'composition'
  | 'progress'
  | 'hundred-rupee';

export interface ChartConfig {
  type: ChartType;
  title: string;
  description?: string;
  dimensions?: Partial<ChartDimensions>;
  showLegend?: boolean;
  showGrid?: boolean;
  responsive?: boolean;
}

export interface ChartExplanation {
  whatIsThis: string;      // Explain the metric
  whatAmISeeing: string;   // Describe the visualization
  whyItMatters: string;    // Economic/public-finance context
}

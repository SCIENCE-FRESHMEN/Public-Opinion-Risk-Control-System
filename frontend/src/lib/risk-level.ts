import type { RiskLevel } from './api/types';

/**
 * 全站统一的风险等级语义配色：高=红、中=琥珀、低=青绿。
 * 集中维护，避免各组件出现不一致的风险色。
 */

export function riskChipClass(level: RiskLevel): string {
  if (level === '高') return 'bg-[rgba(176,4,30,0.18)] text-[var(--color-error)]';
  if (level === '中') return 'bg-[rgba(255,200,87,0.16)] text-[#ffd36d]';
  return 'bg-[rgba(45,219,222,0.14)] text-[var(--color-tertiary)]';
}

export function riskDotColor(level: RiskLevel): string {
  if (level === '高') return 'var(--color-error)';
  if (level === '中') return '#ffd36d';
  return 'var(--color-tertiary)';
}

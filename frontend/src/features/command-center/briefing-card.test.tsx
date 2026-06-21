import { render, screen } from '@testing-library/react';

import { BriefingCard } from './briefing-card';

describe('BriefingCard', () => {
  it('wraps long meta content and avoids forcing four narrow columns at xl size', () => {
    const { container } = render(
      <BriefingCard
        brief={{
          headline: '长江电力舆情热度高于行业基线',
          summary: '摘要内容',
          sentiment_view: '情绪内容',
          risk_view: '风险内容',
          action_view: '建议内容',
        }}
        report={{
          title: '600900.SH 个股研判简报',
          event_summary: '事件总结',
          sentiment_analysis: '情绪分析',
          rumor_assessment: '谣言评估',
          risk_warning: '风险提示',
          suggestion: '跟踪建议',
        }}
        meta={{
          generationMode: 'local_template_a_b_fusion',
          dataSources: ['A: stock_source_overview/source_coverage', 'B: sentiment/topic/risk', 'C: briefing_template'],
          referenceTime: '2026-06-02',
          ticker: '600900.SH',
          stockName: '长江电力',
        }}
      />,
    );

    expect(screen.getByText('输入来源')).toBeInTheDocument();
    expect(screen.getByText(/A: stock_source_overview\/source_coverage/)).toBeInTheDocument();

    const metaGrid = container.querySelector('[data-testid="briefing-meta-grid"]');
    expect(metaGrid).not.toBeNull();
    expect(metaGrid?.className).not.toContain('xl:grid-cols-4');
    expect(metaGrid?.className).toContain('xl:grid-cols-2');

    const sourceValue = screen.getByText(/A: stock_source_overview\/source_coverage/);
    expect(sourceValue.className).toContain('break-words');
    expect(sourceValue.className).toContain('whitespace-normal');
  });
});

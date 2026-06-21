import { render, screen } from '@testing-library/react';

import { CommandCenterChart, buildChartRows } from './command-center-chart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  CartesianGrid: () => null,
  ReferenceLine: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

describe('command-center-chart helpers', () => {
  it('merges three series by date without collapsing later values', () => {
    const rows = buildChartRows({
      price: [
        { date: '2026-05-19', value: 12.68 },
        { date: '2026-05-20', value: 12.76 },
        { date: '2026-05-21', value: 12.46 },
      ],
      sentiment: [
        { date: '2026-05-19', value: 0.59 },
        { date: '2026-05-20', value: 0.71 },
        { date: '2026-05-21', value: 0.44 },
      ],
      heat: [
        { date: '2026-05-19', value: 100 },
        { date: '2026-05-20', value: 47 },
        { date: '2026-05-21', value: 52 },
      ],
    });

    expect(rows).toHaveLength(3);
    expect(rows[0].date).toBe('05-19');
    expect(rows[2].price).toBe(12.46);
    expect(rows[1].sentiment).toBe(0.71);
    expect(rows[0].heat).toBe(100);
  });

  it('prefers the most recent effective window when the input series is too long', () => {
    const dates = Array.from({ length: 60 }, (_, index) => `2026-04-${String(index + 1).padStart(2, '0')}`);
    const rows = buildChartRows({
      price: dates.map((date, index) => ({ date, value: 100 + index })),
      sentiment: dates.map((date, index) => ({ date, value: (index % 10) / 10 })),
      heat: dates.map((date, index) => ({ date, value: 50 + index })),
    });

    expect(rows).toHaveLength(45);
    expect(rows[0].date).toBe('04-16');
    expect(rows[44].date).toBe('04-60');
  });
});

describe('CommandCenterChart', () => {
  it('renders a three-lane linked chart instead of a single overlaid line chart', () => {
    render(
      <CommandCenterChart
        series={{
          price: [
            { date: '2026-05-19', value: 12.68 },
            { date: '2026-05-20', value: 12.76 },
            { date: '2026-05-21', value: 12.46 },
          ],
          sentiment: [
            { date: '2026-05-19', value: 0.59 },
            { date: '2026-05-20', value: 0.71 },
            { date: '2026-05-21', value: 0.44 },
          ],
          heat: [
            { date: '2026-05-19', value: 100 },
            { date: '2026-05-20', value: 47 },
            { date: '2026-05-21', value: 52 },
          ],
        }}
        topicTags={['电力', '算力']}
        title="联动图"
        description="测试说明"
        riskLevel="中"
      />,
    );

    expect(screen.getByText('价格走势')).toBeInTheDocument();
    expect(screen.getByText('情绪走势')).toBeInTheDocument();
    expect(screen.getByText('热度走势')).toBeInTheDocument();
    expect(screen.getByText('联动诊断')).toBeInTheDocument();
    expect(screen.getByText('当前联动结论')).toBeInTheDocument();
    expect(screen.getByText(/热度先抬升后价格承压/)).toBeInTheDocument();
    expect(screen.getByText('关键锚点')).toBeInTheDocument();
    expect(screen.getByText('峰值热度')).toBeInTheDocument();
    expect(screen.getByText(/三层共用同一时间轴/)).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-chart')).toHaveLength(3);
  });

  it('shows a dedicated placeholder instead of rendering empty lanes when no samples exist', () => {
    render(
      <CommandCenterChart
        series={{
          price: [],
          sentiment: [],
          heat: [],
        }}
        topicTags={[]}
        title="联动图"
        description="测试说明"
        riskLevel="中"
      />,
    );

    expect(screen.getByText('当前窗口样本不足')).toBeInTheDocument();
    expect(screen.getByText(/暂无法形成有效的价格、情绪与热度联动走势/)).toBeInTheDocument();
    expect(screen.queryByText('价格走势')).not.toBeInTheDocument();
    expect(screen.queryByText('情绪走势')).not.toBeInTheDocument();
    expect(screen.queryByText('热度走势')).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('mock-chart')).toHaveLength(0);
  });
});

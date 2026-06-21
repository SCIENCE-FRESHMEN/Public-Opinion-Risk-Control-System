import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { useFiltersStore } from "../store/filters";

vi.mock("../features/backtest/useBacktestQuery", () => ({
    useBacktestQuery: vi.fn(() => ({
        data: {
            summary: {
                historical_triggers: 128,
                mean_forward_return: -3.42,
                max_drawdown: -18.7,
                negative_hit_rate: 0.682,
            },
            trajectory: [
                { horizon: 1, avg_return: -0.5 },
                { horizon: 5, avg_return: -3.42 },
            ],
            distribution: {
                min: -8.1,
                q1: -4.7,
                median: -1.4,
                q3: 0.8,
                max: 3.0,
            },
            active_alert_type: "负面情绪激增",
            events: [
                {
                    ticker: "601318.SH",
                    trade_date: "2024-10-24",
                    alert_type: "news_heat_spike",
                    horizon: 5,
                    forward_return: -3.42,
                },
            ],
        },
        isLoading: false,
        isError: false,
    })),
}));

vi.mock("../features/meta/useMemberBAnalysisQuery", () => ({
    useMemberBAnalysisQuery: () => ({
        data: null,
        isLoading: false,
        isError: false,
    }),
}));

vi.mock("../features/meta/useFiltersQuery", () => ({
    useFiltersQuery: () => ({
        data: {
            tickers: ["601318.SH"],
            instrument_groups: [
                {
                    group_name: "金融",
                    instruments: [{ symbol: "601318.SH", code: "601318", name: "中国平安", full_name: "中国平安保险(集团)股份有限公司", market: "SSE", board: "main_board", sector_group: "金融", industry: "保险", aliases: ["平安"], is_featured: true, sort_order: 702, is_active: true }],
                },
            ],
            date_range: { start: "2020-01-01", end: "2026-04-22" },
            defaults: { ticker: "601318.SH", start_date: "2020-01-01", end_date: "2026-04-22" },
        },
        isLoading: false,
        isError: false,
    }),
}));

import { BacktestPage } from "./backtest-page";
import { useBacktestQuery } from "../features/backtest/useBacktestQuery";

beforeEach(() => {
    useFiltersStore.setState({
        ticker: "601318.SH",
        startDate: "2026-04-01",
        endDate: "2026-04-21",
    });
});

it("renders summary stats and anchor date from backtest payload", () => {
    const client = new QueryClient();
    render(
        <QueryClientProvider client={client}>
            <BacktestPage />
        </QueryClientProvider>,
    );
    expect(screen.getByText("情绪因子有效性验证")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("-342.00")).toBeInTheDocument();
    expect(screen.getByText("-1870.0")).toBeInTheDocument();
    expect(screen.getByText(/锚点日期：2024-10-24/i)).toBeInTheDocument();
    expect(screen.getByText("负面情绪激增")).toBeInTheDocument();
    expect(screen.getByText("当前标的：中国平安")).toBeInTheDocument();
    expect(screen.getByText("检验情绪因子触发后价格在后续窗口的表现，量化这一增量因子相对量价的预测有效性。")).toBeInTheDocument();
    expect(screen.getByText("过去出现过多少次类似信号")).toBeInTheDocument();
    expect(screen.getByText("这些信号出现后，后续区间平均涨跌幅")).toBeInTheDocument();
    expect(screen.getByText("这些信号里，后续出现亏损的占比")).toBeInTheDocument();
    expect(screen.getByText("算法风险对比图")).toBeInTheDocument();
    expect(screen.getByAltText("综合风险评分对比")).toBeInTheDocument();
});

it("formats decimal return metrics as percentages", () => {
    const client = new QueryClient();
    render(
        <QueryClientProvider client={client}>
            <BacktestPage />
        </QueryClientProvider>,
    );

    expect(screen.getByText("-342.00")).toBeInTheDocument();
    expect(screen.getByText("-1870.0")).toBeInTheDocument();
});

it("shows a non-zero historical trigger count in the rendered page", () => {
    const client = new QueryClient();
    render(
        <QueryClientProvider client={client}>
            <BacktestPage />
        </QueryClientProvider>,
    );

    expect(screen.getByText("累计 128 次")).toBeInTheDocument();
});

it("passes the current global filters into the backtest query", () => {
    const client = new QueryClient();
    render(
        <QueryClientProvider client={client}>
            <BacktestPage />
        </QueryClientProvider>,
    );

    expect(useBacktestQuery).toHaveBeenCalledWith("601318.SH", "2026-04-01", "2026-04-21", "新闻热度激增", 5);
});

it("shows a neutral empty state when backtest api returns an empty payload", () => {
    vi.mocked(useBacktestQuery).mockReturnValueOnce({
        data: {
            summary: {
                historical_triggers: 0,
                mean_forward_return: 0,
                max_drawdown: 0,
                negative_hit_rate: 0,
            },
            trajectory: [],
            distribution: {
                min: 0,
                q1: 0,
                median: 0,
                q3: 0,
                max: 0,
            },
            active_alert_type: "新闻热度激增",
            events: [],
        },
        isLoading: false,
        isError: false,
    } as never);

    const client = new QueryClient();
    render(
        <QueryClientProvider client={client}>
            <BacktestPage />
        </QueryClientProvider>,
    );

    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
    expect(screen.queryByText(/累计 30 次/i)).not.toBeInTheDocument();
    expect(screen.getByText(/锚点日期：当前窗口暂无历史触发/i)).toBeInTheDocument();
    expect(screen.getByText(/当前窗口样本不足，暂无法形成有效的历史回测结论/)).toBeInTheDocument();
    expect(screen.getByText(/暂无法形成有效的平均收益轨迹/)).toBeInTheDocument();
});

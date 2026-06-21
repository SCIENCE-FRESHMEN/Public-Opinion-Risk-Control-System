import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

const overviewQueryState = {
    data: {
        header: { ticker: "600519.SH", as_of: "2026-04-18T14:32:00" },
        kpis: {
            price: { value: 1428.56, delta: 0.012 },
            sentiment: { value: -0.42, label: "中性偏空" },
            news_heat: { value: 1245, label: "24H" },
            risk: { level: "HIGH", label: "高风险" },
        },
        price_context: [
            { date: "2026-04-14", value: 1410.12 },
            { date: "2026-04-15", value: 1416.04 },
            { date: "2026-04-16", value: 1428.56 },
        ],
        alerts: [
            {
                trade_date: "2026-04-18",
                timestamp: "14:15:00",
                alert_type: "负面情绪激增",
                severity: "高",
                description: "白酒板块分销政策传闻发酵，负面舆情明显升温。",
            },
        ],
    },
};

vi.mock("../features/overview/useOverviewQuery", () => ({
    useOverviewQuery: () => ({
        data: overviewQueryState.data,
        isLoading: false,
        isError: false,
    }),
}));

vi.mock("../features/meta/useMemberBAnalysisQuery", () => ({
    useMemberBAnalysisQuery: () => ({
        data: null,
        isLoading: false,
        isError: false,
    }),
}));

vi.mock("../features/meta/useSubmissionStockCoverageQuery", () => ({
    useSubmissionStockCoverageQuery: () => ({
        data: null,
        isLoading: false,
        isError: false,
    }),
}));

vi.mock("../features/meta/useFiltersQuery", () => ({
    useFiltersQuery: () => ({
        data: {
            tickers: ["600519.SH"],
            instrument_groups: [
                {
                    group_name: "消费",
                    instruments: [{ symbol: "600519.SH", code: "600519", name: "贵州茅台", full_name: "贵州茅台酒股份有限公司", market: "SSE", board: "main_board", sector_group: "消费", industry: "白酒", aliases: ["茅台"], is_featured: true, sort_order: 101, is_active: true }],
                },
            ],
            date_range: { start: "2020-01-01", end: "2026-04-22" },
            defaults: { ticker: "600519.SH", start_date: "2020-01-01", end_date: "2026-04-22" },
        },
        isLoading: false,
        isError: false,
    }),
}));

import { OverviewPage } from "./overview-page";

describe("OverviewPage", () => {
    afterEach(() => {
        overviewQueryState.data = {
            header: { ticker: "600519.SH", as_of: "2026-04-18T14:32:00" },
            kpis: {
                price: { value: 1428.56, delta: 0.012 },
                sentiment: { value: -0.42, label: "中性偏空" },
                news_heat: { value: 1245, label: "24H" },
                risk: { level: "HIGH", label: "高风险" },
            },
            price_context: [
                { date: "2026-04-14", value: 1410.12 },
                { date: "2026-04-15", value: 1416.04 },
                { date: "2026-04-16", value: 1428.56 },
            ],
            alerts: [
                {
                    trade_date: "2026-04-18",
                    timestamp: "14:15:00",
                    alert_type: "负面情绪激增",
                    severity: "高",
                    description: "白酒板块分销政策传闻发酵，负面舆情明显升温。",
                },
            ],
        };
    });

    it("renders overview metrics and alert rows from the overview payload", () => {
        const client = new QueryClient();

        render(
            <QueryClientProvider client={client}>
                <OverviewPage />
            </QueryClientProvider>,
        );

        expect(screen.getByText("贵州茅台 历史复盘")).toBeInTheDocument();
        expect(screen.getByText("复盘结论")).toBeInTheDocument();
        expect(screen.getByText(/近 30 日内共识别 1 个关键预警节点/)).toBeInTheDocument();
        expect(screen.getByText("复盘区间")).toBeInTheDocument();
        expect(screen.getByText("累计预警")).toBeInTheDocument();
        expect(screen.getByText("主导风险")).toBeInTheDocument();
        expect(screen.getByText("区间振幅")).toBeInTheDocument();
        expect(screen.getByText("关键预警节点")).toBeInTheDocument();
        expect(screen.getByText("原因归纳")).toBeInTheDocument();
        expect(screen.getByText("结果总结")).toBeInTheDocument();
        expect(screen.getAllByText("白酒板块分销政策传闻发酵，负面舆情明显升温。").length).toBeGreaterThan(0);
        expect(screen.getByText(/回看指定窗口内的价格背景/)).toBeInTheDocument();
        expect(screen.getByText(/新闻驱动/)).toBeInTheDocument();
        expect(screen.getByText(/情绪驱动/)).toBeInTheDocument();
        expect(screen.getByText(/风险规则/)).toBeInTheDocument();
    });

    it("keeps the current price metric fully visible inside the card", () => {
        const client = new QueryClient();
        const { container } = render(
            <QueryClientProvider client={client}>
                <OverviewPage />
            </QueryClientProvider>,
        );

        const priceCard = screen.getByText("当前价格").closest("section, div");
        const priceValue = screen.getByText("¥1428.56");

        expect(priceCard?.className).not.toContain("overflow-hidden");
        expect(priceValue.className).toContain("leading-none");
        expect(container.querySelector("[data-overview-price-row]")?.className).toContain("flex-wrap");
    });

    it("shows explicit empty-state guidance when the current overview window has no samples", () => {
        overviewQueryState.data = {
            header: { ticker: "600519.SH", as_of: "" },
            kpis: {
                price: { value: 0, delta: 0, label: "暂无数据" },
                sentiment: { value: 0, label: "暂无结论" },
                news_heat: { value: 0, label: "暂无样本" },
                risk: { level: "待分析", label: "待分析" },
            },
            price_context: [],
            alerts: [],
        };

        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <OverviewPage />
            </QueryClientProvider>,
        );

        expect(screen.getByText(/当前窗口样本不足，暂无法形成价格上下文与预警摘要/)).toBeInTheDocument();
        expect(screen.getByText(/暂无法形成有效的价格走势上下文/)).toBeInTheDocument();
        expect(screen.getByText(/当前窗口暂无关键预警节点/)).toBeInTheDocument();
        expect(screen.getByText(/当前窗口暂无可供归纳的新闻、情绪与规则证据/)).toBeInTheDocument();
    });
});

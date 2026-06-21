import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

const linkageQueryState = {
    data: {
        summary: {
            ticker: "300750.SZ",
            sector: "新能源",
            avg_sentiment: -0.42,
            risk_status: "高",
        },
        series: {
            price: [
                { date: "2026-04-14", value: 410.12 },
                { date: "2026-04-15", value: 416.04 },
            ],
            sentiment: [
                { date: "2026-04-14", value: -0.2 },
                { date: "2026-04-15", value: -0.42 },
            ],
            news_volume: [
                { date: "2026-04-14", value: 820 },
                { date: "2026-04-15", value: 1245 },
            ],
        },
        alert_spikes: [
            {
                date: "2026-04-15",
                price: 416.04,
                sentiment: -0.42,
                news_volume: 1245,
                label: "预警触发",
            },
        ],
        anchor: {
            anchor_date: "2026-04-15",
            note: "计算相对于指定交易日收盘时点",
        },
    },
};

vi.mock("../features/linkage/useLinkageQuery", () => ({
    useLinkageQuery: () => ({
        data: linkageQueryState.data,
        isLoading: false,
        isError: false,
    }),
}));

vi.mock("../features/meta/useFiltersQuery", () => ({
    useFiltersQuery: () => ({
        data: {
            tickers: ["300750.SZ"],
            instrument_groups: [
                {
                    group_name: "新能源",
                    instruments: [{ symbol: "300750.SZ", code: "300750", name: "宁德时代", full_name: "宁德时代新能源科技股份有限公司", market: "SZSE", board: "chinext", sector_group: "新能源", industry: "动力电池", aliases: ["宁王"], is_featured: true, sort_order: 301, is_active: true }],
                },
            ],
            date_range: { start: "2020-01-01", end: "2026-04-22" },
            defaults: { ticker: "300750.SZ", start_date: "2020-01-01", end_date: "2026-04-22" },
        },
        isLoading: false,
        isError: false,
    }),
}));

import { LinkagePage } from "./linkage-page";

describe("LinkagePage", () => {
    afterEach(() => {
        linkageQueryState.data = {
            summary: {
                ticker: "300750.SZ",
                sector: "新能源",
                avg_sentiment: -0.42,
                risk_status: "高",
            },
            series: {
                price: [
                    { date: "2026-04-14", value: 410.12 },
                    { date: "2026-04-15", value: 416.04 },
                ],
                sentiment: [
                    { date: "2026-04-14", value: -0.2 },
                    { date: "2026-04-15", value: -0.42 },
                ],
                news_volume: [
                    { date: "2026-04-14", value: 820 },
                    { date: "2026-04-15", value: 1245 },
                ],
            },
            alert_spikes: [
                {
                    date: "2026-04-15",
                    price: 416.04,
                    sentiment: -0.42,
                    news_volume: 1245,
                    label: "预警触发",
                },
            ],
            anchor: {
                anchor_date: "2026-04-15",
                note: "计算相对于指定交易日收盘时点",
            },
        };
    });

    it("renders linkage summary values from the API payload", () => {
        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <LinkagePage />
            </QueryClientProvider>,
        );
        expect(screen.getByText("情绪与价格联动")).toBeInTheDocument();
        expect(screen.getByText("联动诊断结论")).toBeInTheDocument();
        expect(screen.getByText("联动关系卡")).toBeInTheDocument();
        expect(screen.getByText("联动观察结论")).toBeInTheDocument();
        expect(screen.getByText("页面定位说明")).toBeInTheDocument();
        expect(screen.getByText("标的：宁德时代")).toBeInTheDocument();
        expect(screen.getByText("板块：新能源")).toBeInTheDocument();
        expect(screen.getByText("联动类型")).toBeInTheDocument();
        expect(screen.getByText("同步下压")).toBeInTheDocument();
        expect(screen.getAllByText("-0.42").length).toBeGreaterThan(0);
        expect(screen.getByText(/锚点日期：2026-04-15/i)).toBeInTheDocument();
        expect(screen.getByText("¥416.04")).toBeInTheDocument();
        expect(screen.queryByText("$416.04")).not.toBeInTheDocument();
        expect(screen.getByText("帮助你判断价格变化是否与新闻情绪、新闻数量同步出现变化。")).toBeInTheDocument();
        expect(screen.getByText(/价格下行与负面情绪放大同步出现/)).toBeInTheDocument();
        expect(screen.getByText("同步性")).toBeInTheDocument();
        expect(screen.getByText("背离点")).toBeInTheDocument();
        expect(screen.getByText("触发说明")).toBeInTheDocument();
    });

    it("shows explicit empty-state guidance when the linkage window has no usable samples", () => {
        linkageQueryState.data = {
            summary: {
                ticker: "300750.SZ",
                sector: "新能源",
                avg_sentiment: 0,
                risk_status: "待分析",
            },
            series: {
                price: [],
                sentiment: [],
                news_volume: [],
            },
            alert_spikes: [],
            anchor: {
                anchor_date: "",
                note: "当前范围内尚未形成可用联动样本，请切换股票或调整日期范围后重试。",
            },
        };

        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <LinkagePage />
            </QueryClientProvider>,
        );

        expect(screen.getByText(/当前窗口样本不足，暂无法形成价格、情绪与新闻热度的联动判断/)).toBeInTheDocument();
        expect(screen.getByText(/暂无法形成价格、情绪与新闻热度的联动图谱/)).toBeInTheDocument();
    });
});

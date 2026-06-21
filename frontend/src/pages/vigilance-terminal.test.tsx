import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../features/meta/useFiltersQuery", () => ({
    useFiltersQuery: () => ({
        data: {
            tickers: ["600519.SH", "300750.SZ", "601318.SH"],
            instrument_groups: [
                {
                    group_name: "消费",
                    instruments: [{ symbol: "600519.SH", code: "600519", name: "贵州茅台", full_name: "贵州茅台酒股份有限公司", market: "SSE", board: "main_board", sector_group: "消费", industry: "白酒", aliases: ["茅台"], is_featured: true, sort_order: 101, is_active: true }],
                },
                {
                    group_name: "新能源",
                    instruments: [{ symbol: "300750.SZ", code: "300750", name: "宁德时代", full_name: "宁德时代新能源科技股份有限公司", market: "SZSE", board: "chinext", sector_group: "新能源", industry: "动力电池", aliases: ["宁王"], is_featured: true, sort_order: 301, is_active: true }],
                },
                {
                    group_name: "金融",
                    instruments: [{ symbol: "601318.SH", code: "601318", name: "中国平安", full_name: "中国平安保险(集团)股份有限公司", market: "SSE", board: "main_board", sector_group: "金融", industry: "保险", aliases: ["平安"], is_featured: true, sort_order: 702, is_active: true }],
                },
            ],
            date_range: { start: "2020-01-01", end: "2026-04-22" },
            defaults: { ticker: "600519.SH", start_date: "2020-01-01", end_date: "2026-04-22" },
        },
        isLoading: false,
        isError: false,
    }),
}));

vi.mock("../features/meta/useStatusQuery", () => ({
    useStatusQuery: () => ({
        data: {
            artifacts: [
                { name: "prices.parquet", exists: true, path: "/tmp/prices.parquet" },
                { name: "news_sentiment.parquet", exists: false, path: "/tmp/news_sentiment.parquet" },
            ],
        },
        isLoading: false,
        isError: false,
    }),
}));

vi.mock("../features/meta/useAcquisitionSummaryQuery", () => ({
    useAcquisitionSummaryQuery: () => ({
        data: {
            stock_pool_count: 1000,
            selection_mode: "guba_hot",
            window_start: "2026-05-03",
            window_end: "2026-06-02",
            unified_event_coverage: 997,
            latest_generated_at: "2026-06-02 16:12",
            external_site_url: "https://tobykskgd.life/stock-opinion-web/",
            coverage_items: [
                { source: "东方财富股吧", covered: 997, total: 1000, coverage_ratio: 0.997 },
                { source: "新浪财经新闻", covered: 995, total: 1000, coverage_ratio: 0.995 },
                { source: "巨潮资讯公告", covered: 973, total: 1000, coverage_ratio: 0.973 },
                { source: "上交所公告", covered: 19, total: 1000, coverage_ratio: 0.019 },
                { source: "腾讯实时行情", covered: 1000, total: 1000, coverage_ratio: 1 },
                { source: "东方财富实时行情", covered: 78, total: 1000, coverage_ratio: 0.078 },
            ],
        },
        isLoading: false,
        isError: false,
    }),
}));

import { VigilanceTerminalPage } from "./vigilance-terminal";
import { useFiltersStore } from "../store/filters";

beforeEach(() => {
    useFiltersStore.setState({
        ticker: "300750.SZ",
        startDate: "2020-01-01",
        endDate: "2026-04-20",
    });
});

describe("VigilanceTerminalPage", () => {
    it("renders current global filters and artifact health", () => {
        const client = new QueryClient();

        render(
            <QueryClientProvider client={client}>
                <VigilanceTerminalPage />
            </QueryClientProvider>,
        );

        expect(screen.getByText("监控终端")).toBeInTheDocument();
        expect(screen.getByText("当前标的")).toBeInTheDocument();
        expect(screen.getByText("当前区间")).toBeInTheDocument();
        expect(screen.getByLabelText("终端标的")).toHaveValue("300750.SZ");
        expect(screen.getAllByText("宁德时代").length).toBeGreaterThan(0);
        expect(screen.getByText("2020-01-01 → 2026-04-20")).toBeInTheDocument();
        expect(screen.getByText("价格行情数据")).toBeInTheDocument();
        expect(screen.getAllByText("已生成并可用于页面联调").length).toBeGreaterThan(0);
        expect(screen.getByText("就绪")).toBeInTheDocument();
        expect(screen.getByText("缺失")).toBeInTheDocument();
        expect(screen.getByText("采集链路")).toBeInTheDocument();
        expect(screen.getByText("1000")).toBeInTheDocument();
        expect(screen.getAllByText((_, element) => element?.textContent?.includes("补足策略 guba_hot") ?? false).length).toBeGreaterThan(0);
        expect(screen.getByText("东方财富股吧")).toBeInTheDocument();
        expect(screen.getByText("997 / 1000 支股票有有效结果")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "打开采集展示站" })).toHaveAttribute("href", "https://tobykskgd.life/stock-opinion-web/");
        expect(screen.queryByText("prices.parquet")).not.toBeInTheDocument();
        expect(screen.queryByText("/tmp/prices.parquet")).not.toBeInTheDocument();
    });

    it("uses current global filter state instead of static defaults and applies changes", () => {
        const client = new QueryClient();

        render(
            <QueryClientProvider client={client}>
                <VigilanceTerminalPage />
            </QueryClientProvider>,
        );

        fireEvent.change(screen.getByLabelText("终端标的"), { target: { value: "601318.SH" } });
        fireEvent.change(screen.getByLabelText("终端开始日期"), { target: { value: "2024-01-01" } });
        fireEvent.change(screen.getByLabelText("终端结束日期"), { target: { value: "2026-04-20" } });
        fireEvent.click(screen.getByRole("button", { name: "应用全局筛选" }));

        expect(useFiltersStore.getState()).toMatchObject({
            ticker: "601318.SH",
            startDate: "2024-01-01",
            endDate: "2026-04-20",
        });
    });
});

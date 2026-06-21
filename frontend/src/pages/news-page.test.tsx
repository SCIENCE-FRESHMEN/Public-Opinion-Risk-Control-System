import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useFiltersStore } from "../store/filters";

const newsDatesState = {
    dates: ["2024-05-15", "2024-05-14"],
};

vi.mock("../features/news/useNewsDatesQuery", () => ({
    useNewsDatesQuery: () => ({
        data: {
            dates: newsDatesState.dates,
            range_start: "2020-01-01",
            range_end: "2026-04-22",
            latest_anchor_in_range: newsDatesState.dates[0] ?? null,
        },
        isLoading: false,
        isError: false,
    }),
}));

vi.mock("../features/meta/useFiltersQuery", () => ({
    useFiltersQuery: () => ({
        data: {
            tickers: ["600519.SH", "300750.SZ"],
            instrument_groups: [
                {
                    group_name: "消费",
                    instruments: [{ symbol: "600519.SH", code: "600519", name: "贵州茅台", full_name: "贵州茅台酒股份有限公司", market: "SSE", board: "main_board", sector_group: "消费", industry: "白酒", aliases: ["茅台"], is_featured: true, sort_order: 101, is_active: true }],
                },
                {
                    group_name: "新能源",
                    instruments: [{ symbol: "300750.SZ", code: "300750", name: "宁德时代", full_name: "宁德时代新能源科技股份有限公司", market: "SZSE", board: "chinext", sector_group: "新能源", industry: "动力电池", aliases: ["宁王"], is_featured: true, sort_order: 301, is_active: true }],
                },
            ],
            date_range: { start: "2020-01-01", end: "2026-04-22" },
            defaults: { ticker: "600519.SH", start_date: "2020-01-01", end_date: "2026-04-22" },
        },
        isLoading: false,
        isError: false,
    }),
}));

const useNewsDrilldownQueryMock = vi.fn((_: string, alertDate: string) => ({
    data: {
        header: {
            ticker: "600519.SH",
            alert_date: alertDate,
            summary: alertDate === "2024-05-15" ? "新的预警日期摘要" : "负面情绪激增主要由反垄断与罚款新闻驱动",
            range_start: "2020-01-01",
            range_end: "2026-04-22",
        },
        stats: {
            negative_ratio: 0.68,
            negative_vs_30d: 0.42,
            total_signals: 1204,
        },
        drivers: [
            { term: alertDate === "2024-05-15" ? "诉讼" : "反垄断", count: 142 },
            { term: "罚款", count: 54 },
        ],
        news_items: newsDatesState.dates.length === 0 && alertDate === "2026-04-22"
            ? []
            : [
                {
                    id: "n1",
                    title: alertDate === "2024-05-15" ? "第二天新闻标题" : "欧盟委员会就捆绑销售行为启动反垄断调查",
                    source: "路透",
                    publish_time: "14:32 北京时间",
                    topic_tags: ["法务", "监管"],
                    sentiment: "负面",
                    confidence: 0.94,
                    summary: alertDate === "2024-05-15" ? "第二天新闻摘要" : "调查范围已扩大至欧盟企业许可条款。",
                },
            ],
        anchor: {
            anchor_date: alertDate,
            note: "该锚点日期用于锁定新闻聚合口径，并与全局筛选日期范围协同工作",
            in_range: true,
        },
    },
    isLoading: false,
    isError: false,
}));

vi.mock("../features/news/useNewsDrilldownQuery", () => ({
    useNewsDrilldownQuery: (ticker: string, alertDate: string) => useNewsDrilldownQueryMock(ticker, alertDate),
}));

vi.mock("../features/meta/useSubmissionStockCoverageQuery", () => ({
    useSubmissionStockCoverageQuery: () => ({
        data: {
            ticker: "600519.SH",
            stock_name: "贵州茅台",
            quote: 1308.45,
            important_official_count: 2,
            official_count: 9,
            news_count: 20,
            guba_count: 100,
            active_source_count: 4,
            latest_capture_time: "2026-06-02 16:12",
            quote_status: "OK",
            source_items: [
                { source: "东方财富股吧", record_count: 100, status: "OK" },
                { source: "新浪财经", record_count: 20, status: "OK" },
                { source: "巨潮公告", record_count: 9, status: "OK" },
                { source: "腾讯行情", record_count: 1, status: "OK" },
            ],
        },
        isLoading: false,
        isError: false,
    }),
}));

import { NewsPage } from "./news-page";

function renderNewsPage(route = "/news") {
    const client = new QueryClient();

    return render(
        <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <QueryClientProvider client={client}>
                <NewsPage />
            </QueryClientProvider>
        </MemoryRouter>,
    );
}

beforeEach(() => {
    newsDatesState.dates = ["2024-05-15", "2024-05-14"];
    useFiltersStore.setState({
        ticker: "600519.SH",
        startDate: "2020-01-01",
        endDate: "2026-04-22",
    });
});

it("renders drilldown content from news payloads", () => {
    renderNewsPage();
    expect(screen.getByText("预警分析")).toBeInTheDocument();
    expect(screen.getByText("当日主题结论")).toBeInTheDocument();
    expect(screen.getByText("风险摘要")).toBeInTheDocument();
    expect(screen.getByText("重点观察主题")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /贵州茅台/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue("2024-05-15")).toBeInTheDocument();
    expect(screen.getByText(/当前预警日围绕/)).toBeInTheDocument();
    expect(screen.getByText(/负面占比 68%/)).toBeInTheDocument();
    expect(screen.getAllByText((_, element) => element?.textContent === "诉讼 142").length).toBeGreaterThan(0);
    expect(screen.getByText("第二天新闻标题")).toBeInTheDocument();
    expect(screen.getByText(/14:32 北京时间/)).toBeInTheDocument();
    expect(screen.getByText(/锚点日期：2024-05-15/i)).toBeInTheDocument();
    expect(screen.getByText(/全局日期范围：2020-01-01 至 2026-04-22/)).toBeInTheDocument();
    expect(screen.getByText("数据覆盖情报")).toBeInTheDocument();
    expect(screen.getByText("活跃来源")).toBeInTheDocument();
    expect(screen.getByText("最近采集时间")).toBeInTheDocument();
    expect(screen.getByText(/2026-06-02 16:12/)).toBeInTheDocument();
    expect(screen.getByText("算法情绪附证图")).toBeInTheDocument();
    expect(screen.getByAltText("情绪分布结构对比")).toBeInTheDocument();
    expect(screen.queryByText("未分类")).not.toBeInTheDocument();
    expect(screen.queryByText(/45 个来源/)).not.toBeInTheDocument();
    expect(screen.getByText(/基于当前预警日期下的新闻样本聚合/)).toBeInTheDocument();
});

it("uses alertDate from the route query string as the initial selected date", () => {
    renderNewsPage("/news?alertDate=2024-05-14");

    expect(screen.getByDisplayValue("2024-05-14")).toBeInTheDocument();
    expect(screen.getByText("欧盟委员会就捆绑销售行为启动反垄断调查")).toBeInTheDocument();
});

it("allows changing the alert date on the news page", () => {
    renderNewsPage();

    fireEvent.change(screen.getByLabelText("预警日期"), { target: { value: "2024-05-15" } });

    expect(screen.getByDisplayValue("2024-05-15")).toBeInTheDocument();
    expect(screen.getByText("第二天新闻标题")).toBeInTheDocument();
    expect(screen.getByText(/锚点日期：2024-05-15/i)).toBeInTheDocument();
});

it("allows choosing any date within the global date range instead of clamping to anchor dates", () => {
    renderNewsPage();

    const input = screen.getByLabelText("预警日期");

    expect(input).toHaveAttribute("min", "2020-01-01");
    expect(input).toHaveAttribute("max", "2026-04-22");
});

it("keeps a manually selected in-range date even when it is not an alert anchor date", () => {
    useFiltersStore.setState({
        ticker: "600519.SH",
        startDate: "2020-01-01",
        endDate: "2026-04-22",
    });

    renderNewsPage();

    const input = screen.getByLabelText("预警日期");
    fireEvent.change(input, { target: { value: "2026-04-22" } });

    expect(screen.getByDisplayValue("2026-04-22")).toBeInTheDocument();
});

it("keeps the global end date as the initial selected date when it is within range", () => {
    newsDatesState.dates = ["2026-04-22", "2026-04-21"];

    useFiltersStore.setState({
        ticker: "600519.SH",
        startDate: "2026-04-01",
        endDate: "2026-04-22",
    });

    renderNewsPage();

    expect(screen.getByDisplayValue("2026-04-22")).toBeInTheDocument();
});

it("does not render stock code tokens as driver tags", () => {
    renderNewsPage();

    expect(screen.queryByText(/aapl/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nvda/i)).not.toBeInTheDocument();
});

it("resets an out-of-range selected alert date to the latest available anchor date", () => {
    useFiltersStore.setState({
        ticker: "600519.SH",
        startDate: "2020-01-01",
        endDate: "2026-04-23",
    });

    renderNewsPage();

    const input = screen.getByLabelText("预警日期");
    fireEvent.change(input, { target: { value: "2030-04-23" } });

    expect(screen.getByDisplayValue("2024-05-15")).toBeInTheDocument();
});

it("shows empty-range guidance without falling back to unrelated sample news", () => {
    newsDatesState.dates = [];

    renderNewsPage();

    expect(screen.getByText("当前范围内暂无可用预警日")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-04-22")).toBeInTheDocument();
    expect(screen.queryByText("“光之暗面”集体爆发，涪陵电力热度冲至观察窗口峰值")).not.toBeInTheDocument();
    expect(screen.getByText("当前窗口暂无新闻样本，已保留页面结构便于继续切换日期或股票。")).toBeInTheDocument();
    expect(screen.getByText("当天暂无可展示新闻")).toBeInTheDocument();
    expect(screen.getByText("你可以切换预警日期，或调整全局时间范围后重新查看。")).toBeInTheDocument();
    expect(screen.getByText("0 条结果")).toBeInTheDocument();
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../features/meta/useFiltersQuery", () => ({
    useFiltersQuery: () => ({
        data: {
            tickers: ["600519.SH", "300750.SZ", "601318.SH"],
            instrument_groups: [
                {
                    group_name: "消费",
                    instruments: [
                        {
                            symbol: "600519.SH",
                            code: "600519",
                            name: "贵州茅台",
                            full_name: "贵州茅台酒股份有限公司",
                            market: "SSE",
                            board: "main_board",
                            sector_group: "消费",
                            industry: "白酒",
                            aliases: ["茅台"],
                            is_featured: true,
                            sort_order: 101,
                            is_active: true,
                        },
                    ],
                },
                {
                    group_name: "新能源",
                    instruments: [
                        {
                            symbol: "300750.SZ",
                            code: "300750",
                            name: "宁德时代",
                            full_name: "宁德时代新能源科技股份有限公司",
                            market: "SZSE",
                            board: "chinext",
                            sector_group: "新能源",
                            industry: "动力电池",
                            aliases: ["宁王"],
                            is_featured: true,
                            sort_order: 301,
                            is_active: true,
                        },
                    ],
                },
                {
                    group_name: "金融",
                    instruments: [
                        {
                            symbol: "601318.SH",
                            code: "601318",
                            name: "中国平安",
                            full_name: "中国平安保险(集团)股份有限公司",
                            market: "SSE",
                            board: "main_board",
                            sector_group: "金融",
                            industry: "保险",
                            aliases: ["平安"],
                            is_featured: true,
                            sort_order: 701,
                            is_active: true,
                        },
                    ],
                },
            ],
            date_range: { start: "2020-01-01", end: "2026-04-22" },
            defaults: { ticker: "600519.SH", start_date: "2020-01-01", end_date: "2026-04-22" },
        },
        isLoading: false,
        isError: false,
    }),
}));

import { AppShell } from "./app-shell";
import { useFiltersStore } from "../../store/filters";

beforeEach(() => {
    if (
        typeof window !== "undefined" &&
        "localStorage" in window &&
        typeof window.localStorage?.clear === "function"
    ) {
        window.localStorage.clear();
    }
    useFiltersStore.setState({
        ticker: "600519.SH",
        startDate: "2020-01-01",
        endDate: "2026-04-22",
    });
});

describe("AppShell", () => {
    it("renders global navigation and top bar placeholders", () => {
        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell>
                        <div>content</div>
                    </AppShell>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        expect(screen.getByText("上市公司舆情风控指挥台")).toBeInTheDocument();
        expect(screen.getByText("上市公司舆情风控中枢")).toBeInTheDocument();
        expect(screen.getByText("券商舆情风控态势")).toBeInTheDocument();
        expect(screen.getByLabelText("搜索")).toBeInTheDocument();
        expect(screen.queryByLabelText("执行顶部搜索")).not.toBeInTheDocument();
        expect(screen.getByText("消费")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("搜索代码或股票简称")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "因子总览" })).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", { name: "个股因子" })).toHaveAttribute("href", "/stock");
        expect(screen.getByRole("link", { name: "因子验证" })).toHaveAttribute("href", "/backtest");
        expect(screen.getByRole("link", { name: "舆情证据" })).toHaveAttribute("href", "/news");
        expect(screen.getByText("本系统用于《大数据处理技术》课程答辩展示，舆情与行情样本按交易日批处理更新。")).toBeInTheDocument();
        expect(screen.getByText("数据治理链路")).toBeInTheDocument();
        expect(screen.getByText("模型研判方法")).toBeInTheDocument();
        expect(screen.getByText("展示使用边界")).toBeInTheDocument();
        expect(screen.queryByText("JD")).not.toBeInTheDocument();
        expect(screen.queryByText("dashboard")).not.toBeInTheDocument();
        expect(screen.queryByText("show_chart")).not.toBeInTheDocument();
        expect(screen.queryByText("newspaper")).not.toBeInTheDocument();
        expect(screen.queryByText("history")).not.toBeInTheDocument();
        expect(screen.queryByText("notifications")).not.toBeInTheDocument();
        expect(screen.queryByText("settings")).not.toBeInTheDocument();
        expect(screen.getByText("content")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "应用全局筛选" })).toBeVisible();
        const sideNav = screen.getByText("上市公司舆情风控指挥台").closest("aside");
        expect(sideNav?.className).toContain("overflow-y-auto");
    });

    it("updates global filters when ticker and date range are changed from the side nav", () => {
        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell>
                        <div>content</div>
                    </AppShell>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        fireEvent.change(screen.getByLabelText("全局标的"), { target: { value: "300750.SZ" } });
        fireEvent.change(screen.getByLabelText("开始日期"), { target: { value: "2024-01-01" } });
        fireEvent.change(screen.getByLabelText("结束日期"), { target: { value: "2026-04-22" } });
        fireEvent.click(screen.getByRole("button", { name: "应用全局筛选" }));

        expect(useFiltersStore.getState()).toMatchObject({
            ticker: "300750.SZ",
            startDate: "2024-01-01",
            endDate: "2026-04-22",
        });
    });

    it("persists global filters for full page reload scenarios", () => {
        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell>
                        <div>content</div>
                    </AppShell>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        fireEvent.change(screen.getByLabelText("全局标的"), { target: { value: "300750.SZ" } });
        fireEvent.change(screen.getByLabelText("开始日期"), { target: { value: "2026-04-01" } });
        fireEvent.change(screen.getByLabelText("结束日期"), { target: { value: "2026-04-21" } });
        fireEvent.click(screen.getByRole("button", { name: "应用全局筛选" }));

        const stored = window.localStorage.getItem("formal-ui-filters");
        expect(stored).toContain("\"ticker\":\"300750.SZ\"");
        expect(stored).toContain("\"startDate\":\"2026-04-01\"");
        expect(stored).toContain("\"endDate\":\"2026-04-21\"");
    });

    it("preserves existing ticker and start date while rolling end date forward when metadata defaults arrive", () => {
        useFiltersStore.setState({
            ticker: "300750.SZ",
            startDate: "2026-04-05",
            endDate: "2026-04-21",
        });

        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell>
                        <div>content</div>
                    </AppShell>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        expect(screen.getByLabelText("全局标的")).toHaveValue("300750.SZ");
        expect(screen.getByLabelText("开始日期")).toHaveValue("2026-04-05");
        expect(screen.getByLabelText("结束日期")).toHaveValue("2026-04-22");
        expect(useFiltersStore.getState()).toMatchObject({
            ticker: "300750.SZ",
            startDate: "2026-04-05",
            endDate: "2026-04-22",
        });
    });

    it("rolls the end date forward to the latest metadata default while preserving persisted ticker and start date", () => {
        useFiltersStore.setState({
            ticker: "300750.SZ",
            startDate: "2026-04-05",
            endDate: "2026-04-21",
        });

        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell>
                        <div>content</div>
                    </AppShell>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        expect(screen.getByLabelText("全局标的")).toHaveValue("300750.SZ");
        expect(screen.getByLabelText("开始日期")).toHaveValue("2026-04-05");
        expect(screen.getByLabelText("结束日期")).toHaveValue("2026-04-22");
        expect(useFiltersStore.getState()).toMatchObject({
            ticker: "300750.SZ",
            startDate: "2026-04-05",
            endDate: "2026-04-22",
        });
    });

    it("does not roll the end date forward within the same day when persisted date context is still current", () => {
        window.localStorage.setItem(
            "formal-ui-filters",
            JSON.stringify({
                ticker: "300750.SZ",
                startDate: "2026-04-05",
                endDate: "2026-04-21",
                lastSyncedEndDate: "2026-04-22",
            }),
        );
        useFiltersStore.setState({
            ticker: "300750.SZ",
            startDate: "2026-04-05",
            endDate: "2026-04-21",
        });

        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell>
                        <div>content</div>
                    </AppShell>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        expect(screen.getByLabelText("全局标的")).toHaveValue("300750.SZ");
        expect(screen.getByLabelText("开始日期")).toHaveValue("2026-04-05");
        expect(screen.getByLabelText("结束日期")).toHaveValue("2026-04-21");
    });

    it("persists global filters even when localStorage only exposes item methods", () => {
        const originalStorage = window.localStorage;
        const store = new Map<string, string>();

        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: {
                getItem: (key: string) => store.get(key) ?? null,
                setItem: (key: string, value: string) => {
                    store.set(key, value);
                },
                removeItem: (key: string) => {
                    store.delete(key);
                },
            },
        });

        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell>
                        <div>content</div>
                    </AppShell>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        fireEvent.change(screen.getByLabelText("全局标的"), { target: { value: "300750.SZ" } });
        fireEvent.change(screen.getByLabelText("开始日期"), { target: { value: "2026-04-10" } });
        fireEvent.change(screen.getByLabelText("结束日期"), { target: { value: "2026-04-21" } });
        fireEvent.click(screen.getByRole("button", { name: "应用全局筛选" }));

        expect(store.get("formal-ui-filters")).toContain("\"ticker\":\"300750.SZ\"");

        Object.defineProperty(window, "localStorage", {
            configurable: true,
            value: originalStorage,
        });
    });



    it("falls back to metadata default when persisted ticker is no longer in the reliable pool", () => {
        useFiltersStore.setState({
            ticker: "000858.SZ",
            startDate: "2026-04-05",
            endDate: "2026-04-21",
        });

        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell>
                        <div>content</div>
                    </AppShell>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        expect(screen.getByLabelText("全局标的")).toHaveValue("600519.SH");
        expect(useFiltersStore.getState()).toMatchObject({
            ticker: "600519.SH",
            startDate: "2020-01-01",
            endDate: "2026-04-22",
        });
    });

    it("allows switching sector tabs without forcing the current ticker group back", () => {
        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell>
                        <div>content</div>
                    </AppShell>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        fireEvent.click(screen.getByRole("button", { name: "新能源" }));

        expect(screen.getByText("宁德时代")).toBeInTheDocument();
        expect(screen.queryByText("贵州茅台")).not.toBeInTheDocument();
    });

    it("submits top search and updates the global ticker", () => {
        const client = new QueryClient();
        render(
            <QueryClientProvider client={client}>
                <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <AppShell>
                        <div>content</div>
                    </AppShell>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        fireEvent.change(screen.getByPlaceholderText("搜索..."), { target: { value: "ndsd" } });
        fireEvent.submit(screen.getByLabelText("顶部股票搜索"));

        expect(useFiltersStore.getState()).toMatchObject({
            ticker: "300750.SZ",
            startDate: "2020-01-01",
            endDate: "2026-04-22",
        });
        expect(screen.getByLabelText("全局标的")).toHaveValue("300750.SZ");
    });
});

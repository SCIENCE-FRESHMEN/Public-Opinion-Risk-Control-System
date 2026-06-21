import { render, screen } from "@testing-library/react";

import { CompositeLinkageChart } from "./composite-linkage-chart";

describe("CompositeLinkageChart", () => {
    it("shows a dedicated placeholder when linkage series are empty", () => {
        render(
            <CompositeLinkageChart
                series={{
                    price: [],
                    sentiment: [],
                    news_volume: [],
                }}
            />,
        );

        expect(screen.getByText(/当前窗口样本不足/)).toBeInTheDocument();
        expect(screen.getByText(/暂无法形成价格、情绪与新闻热度的联动图谱/)).toBeInTheDocument();
        expect(screen.queryByText("价格走势")).not.toBeInTheDocument();
        expect(screen.queryByText("日度情绪")).not.toBeInTheDocument();
        expect(screen.queryByText("新闻热度")).not.toBeInTheDocument();
    });

    it("renders anchored diagnostic overlays when linkage data is available", () => {
        render(
            <CompositeLinkageChart
                series={{
                    price: [
                        { date: "2026-04-10", value: 18.4 },
                        { date: "2026-04-11", value: 18.1 },
                        { date: "2026-04-12", value: 17.9 },
                        { date: "2026-04-13", value: 17.5 },
                        { date: "2026-04-14", value: 17.2 },
                        { date: "2026-04-15", value: 16.8 },
                    ],
                    sentiment: [
                        { date: "2026-04-10", value: 0.1 },
                        { date: "2026-04-11", value: -0.05 },
                        { date: "2026-04-12", value: -0.18 },
                        { date: "2026-04-13", value: -0.28 },
                        { date: "2026-04-14", value: -0.35 },
                        { date: "2026-04-15", value: -0.42 },
                    ],
                    news_volume: [
                        { date: "2026-04-08", value: 220 },
                        { date: "2026-04-09", value: 240 },
                        { date: "2026-04-10", value: 310 },
                        { date: "2026-04-11", value: 480 },
                        { date: "2026-04-12", value: 620 },
                        { date: "2026-04-13", value: 900 },
                        { date: "2026-04-14", value: 1180 },
                        { date: "2026-04-15", value: 1245 },
                    ],
                }}
                spike={{
                    date: "2026-04-15",
                    price: 16.8,
                    sentiment: -0.42,
                    news_volume: 1245,
                    label: "预警触发",
                }}
            />,
        );

        expect(screen.getByText("观测窗口")).toBeInTheDocument();
        expect(screen.getByText("锚点诊断线")).toBeInTheDocument();
        expect(screen.getByText("价格回撤确认")).toBeInTheDocument();
        expect(screen.getByText("情绪转负")).toBeInTheDocument();
        expect(screen.getByText("热度先抬升")).toBeInTheDocument();
    });
});

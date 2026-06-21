import { render, screen } from "@testing-library/react";

import { DistributionCard } from "./distribution-card";

describe("DistributionCard", () => {
    it("renders distribution diagnostics and percentile labels", () => {
        render(
            <DistributionCard
                distribution={{
                    min: -2.8,
                    q1: -1.4,
                    median: -0.3,
                    q3: 0.9,
                    max: 2.4,
                }}
            />,
        );

        expect(screen.getByText("收益分布（后 5 日）")).toBeInTheDocument();
        expect(screen.getByText("分布诊断")).toBeInTheDocument();
        expect(screen.getByText("偏弱分布")).toBeInTheDocument();
        expect(screen.getByText("中位数位置")).toBeInTheDocument();
        expect(screen.getAllByText("-0.3%").length).toBeGreaterThan(0);
        expect(screen.getByText("极值跨度")).toBeInTheDocument();
        expect(screen.getAllByText("5.2%").length).toBeGreaterThan(0);
        expect(screen.getByText("四分位距（中间 50%）")).toBeInTheDocument();
    });
});

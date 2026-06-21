import { render, screen } from "@testing-library/react";

import { TrajectoryChart } from "./trajectory-chart";

describe("TrajectoryChart", () => {
    it("renders percentage-scaled y-axis labels for decimal returns", () => {
        const { container } = render(
            <TrajectoryChart
                points={[
                    { horizon: 1, avg_return: 0.0012 },
                    { horizon: 2, avg_return: -0.0015 },
                    { horizon: 3, avg_return: -0.005497904290956566 },
                    { horizon: 4, avg_return: -0.0061 },
                    { horizon: 5, avg_return: -0.0032648284161348865 },
                    { horizon: 10, avg_return: -0.005698068479686698 },
                ]}
            />,
        );

        expect(screen.getByText("+0.6%")).toBeInTheDocument();
        expect(screen.getByText("+0.3%")).toBeInTheDocument();
        expect(screen.getByText("-0.3%")).toBeInTheDocument();
        expect(screen.getByText("-0.6%")).toBeInTheDocument();
        expect(screen.getByText("回测轨迹诊断")).toBeInTheDocument();
        expect(screen.getByText("关键观察窗")).toBeInTheDocument();
        expect(screen.getAllByText("后 4 日").length).toBeGreaterThan(0);
        expect(screen.getByText("下行确认段")).toBeInTheDocument();
        expect(screen.getByText("收益转负")).toBeInTheDocument();
        expect(screen.getByText("平均回撤加深")).toBeInTheDocument();

        const circles = Array.from(container.querySelectorAll("circle"));
        expect(circles).toHaveLength(6);

        const yValues = circles.map((circle) => Number(circle.getAttribute("cy")));
        expect(new Set(yValues).size).toBeGreaterThan(1);
    });

    it("shows a dedicated placeholder when trajectory points are empty", () => {
        render(<TrajectoryChart points={[]} />);

        expect(screen.getByText(/当前窗口样本不足/)).toBeInTheDocument();
        expect(screen.getByText(/暂无法形成有效的平均收益轨迹/)).toBeInTheDocument();
        expect(screen.queryByText("后 1 日到后 10 日")).not.toBeInTheDocument();
    });
});

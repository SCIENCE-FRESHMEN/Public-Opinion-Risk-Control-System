import { fireEvent, render, screen } from "@testing-library/react";

import { PriceContextChart } from "./price-context-chart";

const data = Array.from({ length: 30 }, (_, index) => ({
    date: `2026-04-${String(index + 1).padStart(2, "0")}`,
    value: 100 + index,
}));

describe("PriceContextChart", () => {
    it("can recover from an empty first render to a populated second render without hook-order crashes", () => {
        const { rerender } = render(<PriceContextChart data={[]} />);

        expect(screen.getByText(/当前窗口样本不足/)).toBeInTheDocument();

        expect(() => {
            rerender(<PriceContextChart data={data} />);
        }).not.toThrow();

        expect(screen.getByRole("button", { name: "前 30 日" })).toBeInTheDocument();
    });

    it("switches between 30日、15日和今日视图", () => {
        const { container } = render(<PriceContextChart data={data} />);

        expect(screen.getByRole("button", { name: "前 30 日" })).toHaveAttribute("aria-pressed", "true");
        expect(container.querySelector("[data-window-size]")).toHaveAttribute("data-window-size", "30");

        fireEvent.click(screen.getByRole("button", { name: "前 15 日" }));
        expect(screen.getByRole("button", { name: "前 15 日" })).toHaveAttribute("aria-pressed", "true");
        expect(container.querySelector("[data-window-size]")).toHaveAttribute("data-window-size", "15");

        fireEvent.click(screen.getByRole("button", { name: "今日" }));
        expect(screen.getByRole("button", { name: "今日" })).toHaveAttribute("aria-pressed", "true");
        expect(container.querySelector("[data-window-size]")).toHaveAttribute("data-window-size", "1");
    });

    it("shows a dedicated placeholder when price context is empty", () => {
        render(<PriceContextChart data={[]} />);

        expect(screen.getByText(/当前窗口样本不足/)).toBeInTheDocument();
        expect(screen.getByText(/暂无法形成有效的价格走势上下文/)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "前 30 日" })).not.toBeInTheDocument();
    });
});

import { describe, expect, it } from "vitest";

import { filterInstrumentGroups } from "./filterable-instrument-list";

const groups = [
    {
        group_name: "消费",
        instruments: [
            {
                symbol: "600519.SH",
                code: "600519",
                name: "贵州茅台",
                full_name: "贵州茅台酒股份有限公司",
                aliases: ["茅台"],
            },
            {
                symbol: "000858.SZ",
                code: "000858",
                name: "五粮液",
                full_name: "宜宾五粮液股份有限公司",
                aliases: [],
            },
            {
                symbol: "300750.SZ",
                code: "300750",
                name: "宁德时代",
                full_name: "宁德时代新能源科技股份有限公司",
                aliases: ["宁王"],
            },
            {
                symbol: "601318.SH",
                code: "601318",
                name: "中国平安",
                full_name: "中国平安保险(集团)股份有限公司",
                aliases: ["平安"],
            },
        ],
    },
];

describe("filterInstrumentGroups", () => {
    it("matches code, name and aliases", () => {
        expect(filterInstrumentGroups(groups, "600519")[0].instruments[0].name).toBe("贵州茅台");
        expect(filterInstrumentGroups(groups, "贵州茅台")[0].instruments[0].symbol).toBe("600519.SH");
        expect(filterInstrumentGroups(groups, "茅台")[0].instruments[0].code).toBe("600519");
    });

    it("matches pinyin initials and shorthand", () => {
        expect(filterInstrumentGroups(groups, "mt")[0].instruments[0].symbol).toBe("600519.SH");
        expect(filterInstrumentGroups(groups, "gzmt")[0].instruments[0].symbol).toBe("600519.SH");
        expect(filterInstrumentGroups(groups, "ndsd")[0].instruments[0].symbol).toBe("300750.SZ");
        expect(filterInstrumentGroups(groups, "ningde")[0].instruments[0].symbol).toBe("300750.SZ");
        expect(filterInstrumentGroups(groups, "zgpa")[0].instruments[0].symbol).toBe("601318.SH");
    });
});

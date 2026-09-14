import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import V2OperationsPanel from "../../ui/V2OperationsPanel";


describe("V2OperationsPanel", () => {
  it("surfaces template learning, persistent Word behavior, audit, transaction history and an honest pending release matrix", () => {
    const html = renderToStaticMarkup(<V2OperationsPanel />);

    expect(html).toContain("V2 Operations &amp; QA");
    expect(html).toContain("Học từ tài liệu hiện tại");
    expect(html).toContain("Luôn mở HPC Assistant cùng tài liệu này");
    expect(html).toContain("Xuất Audit JSON");
    expect(html).toContain("Transaction History");
    expect(html).toContain("Word Desktop Release Matrix");
    expect(html).toContain("PENDING MANUAL");
    expect(html).toContain("NOT RUN");
  });
});

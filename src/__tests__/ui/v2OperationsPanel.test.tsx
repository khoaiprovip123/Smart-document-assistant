import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import V2OperationsPanel from "../../ui/V2OperationsPanel";


describe("V2OperationsPanel", () => {
  it("surfaces template learning, persistent Word behavior, audit, change history and an honest pending release matrix", () => {
    const html = renderToStaticMarkup(<V2OperationsPanel />);

    expect(html).toContain("Công cụ nâng cao &amp; QA");
    expect(html).toContain("Học từ tài liệu hiện tại");
    expect(html).toContain("Luôn mở HPC Assistant cùng tài liệu này");
    expect(html).toContain("Xuất Audit JSON");
    expect(html).toContain("Lịch sử thay đổi");
    expect(html).toContain("Ma trận phát hành Word Desktop");
    expect(html).toContain("CHỜ KIỂM TRA THỦ CÔNG");
    expect(html).toContain("CHƯA CHẠY");
  });
});

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "../../App";
import V2OperationsPanel from "../../ui/V2OperationsPanel";

describe("Ribbon-first Detail Center", () => {
  it("uses clear Vietnamese labels for detail and release workflows", () => {
    const html = renderToStaticMarkup(<><App /><V2OperationsPanel /></>);

    expect(html).toContain("Trung tâm chi tiết");
    expect(html).toContain("Tình trạng tài liệu");
    expect(html).toContain("Kiểm tra trước phát hành");
    expect(html).toContain("Lịch sử thay đổi");
    expect(html).toContain("Bộ tiêu chuẩn");
  });
});

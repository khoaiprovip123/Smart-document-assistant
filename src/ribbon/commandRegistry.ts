export interface RibbonFunctionCommand {
  functionName: string;
  label: string;
}

export const RIBBON_FUNCTION_COMMANDS: readonly RibbonFunctionCommand[] = Object.freeze([
  Object.freeze({ functionName: "hpcRollback", label: "Hoàn tác HPC" }),
  Object.freeze({ functionName: "hpcNormalizeSelection", label: "Chuẩn hóa vùng chọn" }),
  Object.freeze({ functionName: "hpcEnsureStyles", label: "HPC Styles" }),
  Object.freeze({ functionName: "hpcStandardizeTables", label: "Chuẩn hóa bảng" }),
  Object.freeze({ functionName: "hpcNumberHeadings", label: "Đánh số Heading" }),
  Object.freeze({ functionName: "hpcManageToc", label: "Tạo/Cập nhật mục lục" })
]);

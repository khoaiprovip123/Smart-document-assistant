import { readFile, writeFile } from "node:fs/promises";

const sourcePath = process.env.ADDIN_MANIFEST_SOURCE || "manifest.xml";
const outputPath = process.env.ADDIN_MANIFEST_OUTPUT || "manifest.production.xml";
const rawOrigin = process.env.ADDIN_ORIGIN;

if (!rawOrigin) {
  throw new Error("Thiếu ADDIN_ORIGIN. Ví dụ: ADDIN_ORIGIN=https://documents.hpc.example");
}

const origin = rawOrigin.replace(/\/+$/, "");
if (!/^https:\/\//i.test(origin)) {
  throw new Error("ADDIN_ORIGIN production bắt buộc dùng HTTPS.");
}

const source = await readFile(sourcePath, "utf8");
const developmentOrigin = "https://localhost:3000";
if (!source.includes(developmentOrigin)) {
  throw new Error(`Không tìm thấy development origin ${developmentOrigin} trong ${sourcePath}.`);
}

const output = source.replaceAll(developmentOrigin, origin);
await writeFile(outputPath, output, "utf8");
console.log(`Generated ${outputPath} for ${origin}`);

import { useMemo, useState, type ChangeEvent } from "react";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Option,
  ProgressBar,
  Spinner,
  Text,
  Title2,
  makeStyles,
  tokens
} from "@fluentui/react-components";
import { RULE_PROFILES, getProfile } from "./config/rules";
import { parseRuleProfiles } from "./config/profileLoader";
import { createBuiltinDomainRegistry } from "./domains/builtinDomainRegistry";
import { evaluateDocument } from "./rules/ruleEngine";
import {
  applyFindings,
  normalizeSelectedText,
  readDocumentSnapshot,
  rollbackLastChange,
  selectFinding
} from "./services/wordService";
import { ensureHpcStyles } from "./services/styleManager";
import { standardizeTables } from "./services/tableService";
import { normalizeHeadingNumbering } from "./services/headingNumberingService";
import { insertOrUpdateTableOfContents } from "./services/tocService";
import { evaluateReleaseReadiness } from "./validators/preReleaseValidator";
import { filterFindings, type FindingFilter } from "./ui/findingFilters";
import { readSemanticDocumentSnapshot } from "./word/semanticWordService";
import { evaluateV2Quality, resolveLegacyProfileRef, type V2QualityReport } from "./v2/workflow";
import type { DocumentCheckResult, DocumentRuleProfile, Finding } from "./types";

const V2_REGISTRY = createBuiltinDomainRegistry();

const useStyles = makeStyles({
  page: { padding: "16px", display: "flex", flexDirection: "column", gap: "12px" },
  header: { display: "flex", flexDirection: "column", gap: "4px" },
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  filters: { display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" },
  scoreRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" },
  counts: { display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" },
  finding: {
    display: "grid",
    gridTemplateColumns: "24px 1fr",
    gap: "8px",
    padding: "10px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  findingBody: { display: "flex", flexDirection: "column", gap: "4px" },
  findingActions: { display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" },
  previewItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "8px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  error: { padding: "10px", borderRadius: "6px", background: tokens.colorPaletteRedBackground1 },
  warning: { padding: "10px", borderRadius: "6px", background: tokens.colorPaletteYellowBackground1 },
  note: { color: tokens.colorNeutralForeground3 },
  fileInput: { maxWidth: "100%" }
});

const severityColor = (finding: Finding): "danger" | "warning" | "informative" | "success" => {
  if (finding.severity === "critical") return "danger";
  if (finding.severity === "warning") return "warning";
  if (finding.severity === "suggestion") return "informative";
  return "success";
};

const preflightColor = (status: V2QualityReport["preflight"]["status"]): "danger" | "warning" | "success" => {
  if (status === "BLOCKED") return "danger";
  if (status === "REVIEW_REQUIRED") return "warning";
  return "success";
};

const formatValue = (value: unknown): string => {
  if (value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export default function App() {
  const styles = useStyles();
  const [profileId, setProfileId] = useState("HPC-ND30");
  const [customProfiles, setCustomProfiles] = useState<DocumentRuleProfile[]>([]);
  const [result, setResult] = useState<DocumentCheckResult | null>(null);
  const [v2Report, setV2Report] = useState<V2QualityReport | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FindingFilter>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const profiles = useMemo(() => [...RULE_PROFILES, ...customProfiles], [customProfiles]);
  const profile = useMemo(
    () => profiles.find((item) => item.id === profileId) ?? getProfile("HPC-ND30"),
    [profileId, profiles]
  );
  const visibleFindings = useMemo(() => filterFindings(result?.findings ?? [], filter), [result, filter]);
  const release = useMemo(() => (result ? evaluateReleaseReadiness(result) : null), [result]);

  async function scan() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const snapshot = await readDocumentSnapshot();
      const next = evaluateDocument(profile, snapshot);
      setResult(next);
      setSelected(
        new Set(next.findings.filter((finding) => finding.autoFixable && finding.severity !== "passed").map((f) => f.id))
      );

      const v2Ref = resolveLegacyProfileRef(profile.id);
      let nextV2Report: V2QualityReport | null = null;
      if (v2Ref) {
        const semanticSnapshot = await readSemanticDocumentSnapshot();
        nextV2Report = evaluateV2Quality(V2_REGISTRY, v2Ref, semanticSnapshot);
      }
      setV2Report(nextV2Report);

      const v2Status = nextV2Report
        ? ` V2: ${nextV2Report.profile.name} — ${nextV2Report.preflight.status}.`
        : " Bộ tiêu chuẩn tùy chỉnh hiện chạy V1 compatibility; chưa có V2 mapping.";
      setStatus(`Đã kiểm tra ${snapshot.paragraphs.length} đoạn văn theo ${profile.name}.${v2Status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kiểm tra tài liệu.");
    } finally {
      setBusy(false);
    }
  }

  async function fixSelected() {
    if (!result) return;
    const fixes = result.findings.filter((finding) => selected.has(finding.id));
    setBusy(true);
    setError(null);
    try {
      await applyFindings(profile, fixes);
      await scan();
      setStatus(`Đã áp dụng ${fixes.length} thay đổi định dạng và kiểm tra lại. Không thay đổi nội dung văn bản.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể áp dụng thay đổi.");
      setBusy(false);
    }
  }

  async function undo() {
    setBusy(true);
    setError(null);
    try {
      const restored = await rollbackLastChange();
      if (restored) {
        await scan();
        setStatus("Đã hoàn tác lần thay đổi HPC gần nhất và kiểm tra lại tài liệu.");
      } else {
        setStatus("Chưa có thay đổi HPC phù hợp để hoàn tác.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hoàn tác HPC thất bại.");
      setBusy(false);
    }
  }

  async function formatSelection() {
    setBusy(true);
    setError(null);
    try {
      await normalizeSelectedText(profile);
      await scan();
      setStatus("Đã chuẩn hóa vùng chọn, lưu snapshot hoàn tác và kiểm tra lại.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chuẩn hóa vùng chọn.");
    } finally {
      setBusy(false);
    }
  }

  async function createStyles() {
    setBusy(true);
    setError(null);
    try {
      const stylesResult = await ensureHpcStyles(profile);
      const conflictText = stylesResult.conflicts.length > 0 ? `, xung đột loại ${stylesResult.conflicts.length}` : "";
      setStatus(`HPC Styles: tạo mới ${stylesResult.created.length}, cập nhật ${stylesResult.updated.length}${conflictText}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo HPC Styles.");
    } finally {
      setBusy(false);
    }
  }

  async function normalizeTables() {
    setBusy(true);
    setError(null);
    try {
      const tableResult = await standardizeTables(profile);
      setStatus(`Đã chuẩn hóa ${tableResult.processed} bảng; bỏ qua ${tableResult.skipped} bảng không hợp lệ. Không sửa nội dung ô.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chuẩn hóa bảng.");
    } finally {
      setBusy(false);
    }
  }

  async function normalizeNumbering() {
    setBusy(true);
    setError(null);
    try {
      const numbering = await normalizeHeadingNumbering();
      await scan();
      setStatus(
        `Đã đánh số ${numbering.numbered} Heading. Bỏ qua ${numbering.skippedExistingLists} Heading đã thuộc list để tránh phá numbering hiện hữu.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đánh số Heading.");
    } finally {
      setBusy(false);
    }
  }

  async function manageToc() {
    setBusy(true);
    setError(null);
    try {
      const toc = await insertOrUpdateTableOfContents();
      setStatus(
        toc.inserted
          ? "Đã chèn mục lục tại vị trí con trỏ. WordApiDesktop 1.4 dùng Heading/Outline Level 1-4."
          : `Đã cập nhật số trang cho ${toc.updated} mục lục hiện có.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể quản lý mục lục.");
    } finally {
      setBusy(false);
    }
  }

  async function importRuleProfiles(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const imported = parseRuleProfiles(await file.text());
      const builtInIds = new Set(RULE_PROFILES.map((item) => item.id));
      const collision = imported.find((item) => builtInIds.has(item.id));
      if (collision) throw new Error(`Bộ tiêu chuẩn import trùng ID hệ thống: ${collision.id}.`);
      setCustomProfiles(imported);
      setProfileId(imported[0].id);
      setResult(null);
      setV2Report(null);
      setSelected(new Set());
      setStatus(`Đã nạp ${imported.length} bộ tiêu chuẩn từ ${file.name}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể nạp bộ tiêu chuẩn JSON.");
    } finally {
      event.target.value = "";
    }
  }

  async function goToFinding(finding: Finding) {
    setError(null);
    try {
      const selectedFinding = await selectFinding(finding);
      if (!selectedFinding) setStatus("Vấn đề này thuộc cấp tài liệu/cấu trúc nên không có đoạn cụ thể để chọn.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chuyển tới vị trí lỗi.");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Title2>Trung tâm chi tiết</Title2>
        <Text className={styles.note}>Ribbon-first · Tình trạng tài liệu · Vấn đề · Bộ tiêu chuẩn · Kiểm tra trước phát hành</Text>
      </header>

      <Card>
        <Text weight="semibold">Bộ tiêu chuẩn</Text>
        <Dropdown
          value={profile.name}
          selectedOptions={[profileId]}
          onOptionSelect={(_, data) => {
            const next = String(data.optionValue);
            setProfileId(next);
            setResult(null);
            setV2Report(null);
            setSelected(new Set());
            setFilter("all");
          }}
        >
          {profiles.map((item) => (
            <Option key={item.id} value={item.id} text={item.name}>
              {item.name} {item.status === "draft" ? "(DRAFT)" : ""}
            </Option>
          ))}
        </Dropdown>
        <Text size={200} className={styles.note}>{profile.description}</Text>
        <Text size={200} weight="semibold">Nạp bộ tiêu chuẩn JSON tùy chỉnh</Text>
        <input className={styles.fileInput} type="file" accept="application/json,.json" onChange={(event) => void importRuleProfiles(event)} />
        {profile.status === "draft" && (
          <div className={styles.warning}>
            <Text weight="semibold">Bộ tiêu chuẩn DRAFT:</Text>{" "}
            <Text>chỉ dùng pilot/kiểm thử cho đến khi HPC phê duyệt rule chính thức.</Text>
          </div>
        )}
      </Card>

      <div className={styles.actions}>
        <Button appearance="primary" onClick={scan} disabled={busy}>Kiểm tra văn bản</Button>
        <Button onClick={fixSelected} disabled={busy || !result || selected.size === 0}>Sửa vấn đề đã chọn ({selected.size})</Button>
        <Button onClick={formatSelection} disabled={busy}>Chuẩn hóa vùng chọn</Button>
        <Button onClick={normalizeTables} disabled={busy}>Chuẩn hóa bảng</Button>
        <Button onClick={normalizeNumbering} disabled={busy}>Đánh số Heading</Button>
        <Button onClick={manageToc} disabled={busy}>Mục lục</Button>
        <Button onClick={undo} disabled={busy}>Hoàn tác HPC</Button>
        <Button onClick={createStyles} disabled={busy}>Tạo/Cập nhật HPC Styles</Button>
      </div>

      {busy && <Spinner label="Đang xử lý tài liệu..." />}
      {error && <div className={styles.error}><Text>{error}</Text></div>}
      {status && <Text>{status}</Text>}

      {result && (
        <>
          <Card>
            <div className={styles.scoreRow}>
              <Text weight="semibold">Điểm tuân thủ V1</Text>
              <Title2>{result.score}%</Title2>
            </div>
            <ProgressBar value={result.score / 100} />
            <div className={styles.counts}>
              <Badge color="danger">Critical {result.counts.critical}</Badge>
              <Badge color="warning">Warning {result.counts.warning}</Badge>
              <Badge color="informative">Suggestion {result.counts.suggestion}</Badge>
              <Badge color="success">Passed {result.counts.passed}</Badge>
            </div>
          </Card>

          {release && (
            <Card>
              <div className={styles.scoreRow}>
                <Text weight="semibold">Kiểm tra trước phát hành V1</Text>
                <Badge color={release.status === "blocked" ? "danger" : release.status === "review" ? "warning" : "success"}>
                  {release.label}
                </Badge>
              </div>
              <Text size={200}>{release.message}</Text>
            </Card>
          )}

          {v2Report && (
            <Card>
              <div className={styles.scoreRow}>
                <Text weight="semibold">Tình trạng tài liệu V2</Text>
                <Badge color={preflightColor(v2Report.preflight.status)}>{v2Report.preflight.status}</Badge>
              </div>
              <Text size={200}>
                {v2Report.profile.name} · {v2Report.profile.status.toUpperCase()} · {v2Report.findings.length} vấn đề
              </Text>
              <div className={styles.counts}>
                <Badge color="danger">Critical {v2Report.health.bySeverity.critical}</Badge>
                <Badge color="warning">Warning {v2Report.health.bySeverity.warning}</Badge>
                <Badge color="informative">Suggestion {v2Report.health.bySeverity.suggestion}</Badge>
                <Badge appearance="outline">Info {v2Report.health.bySeverity.info}</Badge>
              </div>
              <div className={styles.counts}>
                <Badge appearance="outline">Tự sửa an toàn {v2Report.health.fixability.safeAuto}</Badge>
                <Badge appearance="outline">Cần xem trước {v2Report.health.fixability.previewRequired}</Badge>
                <Badge appearance="outline">Cần xem xét {v2Report.health.fixability.reviewRequired}</Badge>
                <Badge appearance="outline">Không tự sửa {v2Report.health.fixability.forbidden}</Badge>
              </div>
              {v2Report.missingCapabilities.length > 0 && (
                <div className={styles.warning}>
                  <Text size={200}>Thiếu khả năng Word: {v2Report.missingCapabilities.join(", ")}</Text>
                </div>
              )}
              <Text size={200} className={styles.note}>
                V2 chỉ hiển thị xem trước thay đổi có nguồn trong pilot; thao tác sửa Word vẫn dùng V1 compatibility cho tới smoke test adapter V2.
              </Text>
              <Text weight="semibold">Xem trước sửa lỗi V2</Text>
              {v2Report.preview.length === 0 && <Text size={200}>Không có thay đổi cần xem trước theo rule V2 hiện tại.</Text>}
              {v2Report.preview.slice(0, 6).map((item) => (
                <div className={styles.previewItem} key={item.findingId}>
                  <div className={styles.counts}>
                    <Badge appearance="outline">{item.disposition}</Badge>
                    <Text weight="semibold">{item.title}</Text>
                  </div>
                  <Text size={200}>{item.message}</Text>
                  <Text size={200} className={styles.note}>
                    Hiện tại: {formatValue(item.current)} → Chuẩn: {formatValue(item.expected)}
                  </Text>
                  <Text size={200} className={styles.note}>Nguồn: {item.sourceLabel}</Text>
                </div>
              ))}
              {v2Report.preview.length > 6 && (
                <Text size={200} className={styles.note}>Còn {v2Report.preview.length - 6} vấn đề V2 khác.</Text>
              )}
            </Card>
          )}

          <Card>
            <div className={styles.filters}>
              <Text weight="semibold">Hiển thị:</Text>
              {(["all", "critical", "warning", "suggestion", "capability"] as FindingFilter[]).map((item) => (
                <Button
                  key={item}
                  size="small"
                  appearance={filter === item ? "primary" : "secondary"}
                  onClick={() => setFilter(item)}
                >
                  {item === "all" ? "Tất cả" : item}
                </Button>
              ))}
            </div>
            <Text weight="semibold">Các vấn đề cần xem xét ({visibleFindings.length})</Text>
            {visibleFindings.length === 0 && <Text>Không phát hiện lỗi theo bộ lọc hiện tại.</Text>}
            {visibleFindings.map((finding) => (
              <div className={styles.finding} key={finding.id}>
                <Checkbox
                  checked={selected.has(finding.id)}
                  disabled={!finding.autoFixable}
                  onChange={(_, data) => {
                    const next = new Set(selected);
                    data.checked ? next.add(finding.id) : next.delete(finding.id);
                    setSelected(next);
                  }}
                />
                <div className={styles.findingBody}>
                  <div className={styles.counts}>
                    <Badge color={severityColor(finding)}>{finding.severity.toUpperCase()}</Badge>
                    <Badge appearance="outline">{finding.scope}</Badge>
                    <Text weight="semibold">{finding.title}</Text>
                  </div>
                  <Text size={200}>{finding.message}</Text>
                  {(finding.current !== undefined || finding.target !== undefined) && (
                    <Text size={200} className={styles.note}>
                      Hiện tại: {String(finding.current ?? "-")} → Chuẩn: {String(finding.target ?? "-")}
                    </Text>
                  )}
                  <div className={styles.findingActions}>
                    {finding.paragraphIndex !== undefined && (
                      <Button size="small" appearance="subtle" onClick={() => void goToFinding(finding)}>
                        Đi tới vị trí
                      </Button>
                    )}
                    {!finding.autoFixable && finding.severity !== "passed" && (
                      <Text size={200} className={styles.note}>Cần xem thủ công</Text>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </main>
  );
}

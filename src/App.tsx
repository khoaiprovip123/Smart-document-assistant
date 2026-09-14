import { useMemo, useState } from "react";
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
import { evaluateReleaseReadiness } from "./validators/preReleaseValidator";
import { filterFindings, type FindingFilter } from "./ui/findingFilters";
import type { DocumentCheckResult, Finding } from "./types";

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
  error: { padding: "10px", borderRadius: "6px", background: tokens.colorPaletteRedBackground1 },
  warning: { padding: "10px", borderRadius: "6px", background: tokens.colorPaletteYellowBackground1 },
  note: { color: tokens.colorNeutralForeground3 }
});

const severityColor = (finding: Finding): "danger" | "warning" | "informative" | "success" => {
  if (finding.severity === "critical") return "danger";
  if (finding.severity === "warning") return "warning";
  if (finding.severity === "suggestion") return "informative";
  return "success";
};

export default function App() {
  const styles = useStyles();
  const [profileId, setProfileId] = useState("HPC-ND30");
  const [result, setResult] = useState<DocumentCheckResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FindingFilter>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const profile = useMemo(() => getProfile(profileId), [profileId]);
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
      setStatus(`Đã kiểm tra ${snapshot.paragraphs.length} đoạn văn theo ${profile.name}.`);
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
        setStatus("Đã rollback lần thay đổi HPC gần nhất và kiểm tra lại tài liệu.");
      } else {
        setStatus("Chưa có snapshot để rollback.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rollback thất bại.");
      setBusy(false);
    }
  }

  async function formatSelection() {
    setBusy(true);
    setError(null);
    try {
      await normalizeSelectedText(profile);
      await scan();
      setStatus("Đã chuẩn hóa vùng chọn, lưu snapshot rollback và kiểm tra lại.");
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

  async function goToFinding(finding: Finding) {
    setError(null);
    try {
      const selectedFinding = await selectFinding(finding);
      if (!selectedFinding) setStatus("Finding này thuộc cấp tài liệu/cấu trúc nên không có đoạn cụ thể để chọn.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể chuyển tới vị trí lỗi.");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Title2>HPC Smart Document Assistant</Title2>
        <Text className={styles.note}>v1 — Scan → Review → Safe Fix → Rollback → Pre-release</Text>
      </header>

      <Card>
        <Text weight="semibold">Chuẩn áp dụng</Text>
        <Dropdown
          value={profile.name}
          selectedOptions={[profileId]}
          onOptionSelect={(_, data) => {
            const next = String(data.optionValue);
            setProfileId(next);
            setResult(null);
            setSelected(new Set());
            setFilter("all");
          }}
        >
          {RULE_PROFILES.map((item) => (
            <Option key={item.id} value={item.id} text={item.name}>
              {item.name} {item.status === "draft" ? "(DRAFT)" : ""}
            </Option>
          ))}
        </Dropdown>
        <Text size={200} className={styles.note}>{profile.description}</Text>
        {profile.status === "draft" && (
          <div className={styles.warning}>
            <Text weight="semibold">Profile DRAFT:</Text>{" "}
            <Text>chỉ dùng pilot/kiểm thử cho đến khi HPC phê duyệt rule chính thức.</Text>
          </div>
        )}
      </Card>

      <div className={styles.actions}>
        <Button appearance="primary" onClick={scan} disabled={busy}>Kiểm tra văn bản</Button>
        <Button onClick={fixSelected} disabled={busy || !result || selected.size === 0}>Sửa mục đã chọn ({selected.size})</Button>
        <Button onClick={formatSelection} disabled={busy}>Chuẩn hóa vùng chọn</Button>
        <Button onClick={normalizeTables} disabled={busy}>Chuẩn hóa bảng</Button>
        <Button onClick={undo} disabled={busy}>Rollback</Button>
        <Button onClick={createStyles} disabled={busy}>Tạo/Cập nhật HPC Styles</Button>
      </div>

      {busy && <Spinner label="Đang xử lý tài liệu..." />}
      {error && <div className={styles.error}><Text>{error}</Text></div>}
      {status && <Text>{status}</Text>}

      {result && (
        <>
          <Card>
            <div className={styles.scoreRow}>
              <Text weight="semibold">Compliance Score</Text>
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
                <Text weight="semibold">Pre-release Check</Text>
                <Badge color={release.status === "blocked" ? "danger" : release.status === "review" ? "warning" : "success"}>
                  {release.label}
                </Badge>
              </div>
              <Text size={200}>{release.message}</Text>
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
                      <Text size={200} className={styles.note}>Manual review</Text>
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

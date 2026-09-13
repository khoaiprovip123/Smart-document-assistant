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
import { applyFindings, normalizeSelectedText, readDocumentSnapshot, rollbackLastChange } from "./services/wordService";
import { ensureHpcStyles } from "./services/styleManager";
import type { DocumentCheckResult, Finding } from "./types";

const useStyles = makeStyles({
  page: { padding: "16px", display: "flex", flexDirection: "column", gap: "12px" },
  header: { display: "flex", flexDirection: "column", gap: "4px" },
  actions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  scoreRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" },
  counts: { display: "flex", gap: "6px", flexWrap: "wrap" },
  finding: {
    display: "grid",
    gridTemplateColumns: "24px 1fr",
    gap: "8px",
    padding: "8px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  findingBody: { display: "flex", flexDirection: "column", gap: "2px" },
  error: { padding: "10px", borderRadius: "6px", background: tokens.colorPaletteRedBackground1 },
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const profile = useMemo(() => getProfile(profileId), [profileId]);
  const visibleFindings = result?.findings.filter((finding) => finding.severity !== "passed") ?? [];

  async function scan() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const snapshot = await readDocumentSnapshot();
      const next = evaluateDocument(profile, snapshot);
      setResult(next);
      setSelected(new Set(next.findings.filter((finding) => finding.autoFixable && finding.severity !== "passed").map((f) => f.id)));
      setStatus(`Đã kiểm tra ${snapshot.paragraphs.length} đoạn văn.`);
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
      setStatus(`Đã áp dụng ${fixes.length} thay đổi định dạng. Không thay đổi nội dung văn bản.`);
      await scan();
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
      setStatus(restored ? "Đã rollback lần thay đổi HPC gần nhất." : "Chưa có snapshot để rollback.");
      if (restored) await scan();
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
      setStatus("Đã chuẩn hóa vùng đang chọn.");
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
      setStatus(
        `HPC Styles: tạo mới ${stylesResult.created.length}, cập nhật ${stylesResult.updated.length}${conflictText}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo HPC Styles.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Title2>HPC Smart Document Assistant</Title2>
        <Text className={styles.note}>MVP 0.1 — Scan → Preview → Fix Selected → Validate lại</Text>
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
          }}
        >
          {RULE_PROFILES.map((item) => (
            <Option key={item.id} value={item.id} text={item.name}>
              {item.name} {item.status === "draft" ? "(DRAFT)" : ""}
            </Option>
          ))}
        </Dropdown>
        <Text size={200} className={styles.note}>{profile.description}</Text>
      </Card>

      <div className={styles.actions}>
        <Button appearance="primary" onClick={scan} disabled={busy}>Kiểm tra văn bản</Button>
        <Button onClick={fixSelected} disabled={busy || !result || selected.size === 0}>Sửa mục đã chọn</Button>
        <Button onClick={formatSelection} disabled={busy}>Chuẩn hóa vùng chọn</Button>
        <Button onClick={undo} disabled={busy}>Rollback</Button>
        <Button onClick={createStyles} disabled={busy}>Tạo HPC Styles</Button>
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

          <Card>
            <Text weight="semibold">Các vấn đề cần xem xét ({visibleFindings.length})</Text>
            {visibleFindings.length === 0 && <Text>Không phát hiện lỗi theo profile hiện tại.</Text>}
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
                    <Text weight="semibold">{finding.title}</Text>
                  </div>
                  <Text size={200}>{finding.message}</Text>
                  {(finding.current !== undefined || finding.target !== undefined) && (
                    <Text size={200} className={styles.note}>
                      Hiện tại: {String(finding.current ?? "-")} → Chuẩn: {String(finding.target ?? "-")}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </main>
  );
}

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Option,
  Spinner,
  Text,
  makeStyles,
  tokens
} from "@fluentui/react-components";
import { createBuiltinDomainRegistry } from "../domains/builtinDomainRegistry";
import { compatibilityTransactionStore } from "../fixes/compatTransactionSession";
import { buildTransactionHistoryView, type TransactionHistoryItem } from "../fixes/transactionHistory";
import { buildV2AuditReport } from "../preflight/auditReport";
import { createDefaultWordDesktopReleaseMatrix } from "../qa/defaultReleaseMatrix";
import { WORD_DESKTOP_SMOKE_CHECKLIST } from "../qa/releaseQualification";
import { isQualityRequirement } from "../quality/requirements";
import { analyzeTrustedTemplate, type TrustedTemplateAnalysis } from "../templates/templateAnalyzer";
import { generateDraftProfile, type LearnedRuleDecision } from "../templates/draftProfileGenerator";
import { buildReviewedProfileExport } from "../templates/profileExport";
import {
  createProfileReviewState,
  reviewProposal,
  type ProfileReviewState
} from "../templates/profileReview";
import { evaluateV2Quality } from "../v2/workflow";
import { readSemanticDocumentSnapshot } from "../word/semanticWordService";
import PersistentWordCard from "./PersistentWordCard";
import TemplateReviewPanel from "./TemplateReviewPanel";

const V2_REGISTRY = createBuiltinDomainRegistry();
const DEFAULT_RELEASE_MATRIX = createDefaultWordDesktopReleaseMatrix();
const DEFAULT_PROFILE = { id: "VN-ND30-ADMIN", version: "1.0.0" };

const useStyles = makeStyles({
  root: { padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: "12px" },
  row: { display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" },
  spread: { display: "flex", gap: "8px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" },
  stack: { display: "flex", flexDirection: "column", gap: "7px" },
  item: { padding: "8px 0", borderBottom: `1px solid ${tokens.colorNeutralStroke2}` },
  note: { color: tokens.colorNeutralForeground3 },
  error: { padding: "10px", borderRadius: "6px", background: tokens.colorPaletteRedBackground1 },
  warning: { padding: "10px", borderRadius: "6px", background: tokens.colorPaletteYellowBackground1 }
});

function profileKey(id: string, version: string): string {
  return `${id}@${version}`;
}

function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function safeFilePart(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "profile";
}

export default function V2OperationsPanel() {
  const styles = useStyles();
  const profiles = useMemo(
    () => [...V2_REGISTRY.profiles.all()].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );
  const [profileRef, setProfileRef] = useState(DEFAULT_PROFILE);
  const [analysis, setAnalysis] = useState<TrustedTemplateAnalysis | null>(null);
  const [reviewState, setReviewState] = useState<ProfileReviewState | null>(null);
  const [requirementJson, setRequirementJson] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<readonly TransactionHistoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const selectedProfile = V2_REGISTRY.profiles.require(profileRef);

  async function learnFromCurrentDocument() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const semantic = await readSemanticDocumentSnapshot();
      const nextAnalysis = analyzeTrustedTemplate(semantic);
      const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
      const draft = generateDraftProfile({
        analysis: nextAnalysis,
        id: `LEARNED-${safeFilePart(selectedProfile.id)}-${stamp}`,
        version: "0.1.0",
        name: `Learned from current document (${selectedProfile.name})`,
        sourceId: `LOCAL-TRUSTED-TEMPLATE-${stamp}`
      });
      const nextState = createProfileReviewState(draft);
      setAnalysis(nextAnalysis);
      setReviewState(nextState);
      setRequirementJson(Object.fromEntries(
        nextState.proposals.map((proposal) => [proposal.id, JSON.stringify(proposal.rule.requirement, null, 2)])
      ));
      setStatus(`Đã phân tích template: ${nextState.proposals.length} proposal, confidence ${Math.round(nextAnalysis.confidence * 100)}%. Tất cả vẫn UNVERIFIED.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phân tích template hiện tại.");
    } finally {
      setBusy(false);
    }
  }

  function decideProposal(proposalId: string, decision: LearnedRuleDecision) {
    if (!reviewState) return;
    setError(null);
    try {
      setReviewState(reviewProposal(reviewState, proposalId, { decision }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật quyết định review.");
    }
  }

  function applyRequirementJson(proposalId: string) {
    if (!reviewState) return;
    setError(null);
    try {
      const raw = requirementJson[proposalId];
      const parsed = JSON.parse(raw ?? "null") as unknown;
      if (!isQualityRequirement(parsed)) throw new Error("Requirement JSON không đúng QualityRequirement schema hỗ trợ.");
      const current = reviewState.proposals.find((proposal) => proposal.id === proposalId);
      if (!current) throw new Error(`Không tìm thấy proposal ${proposalId}.`);
      setReviewState(reviewProposal(reviewState, proposalId, { decision: current.decision, requirement: parsed }));
      setRequirementJson((value) => ({ ...value, [proposalId]: JSON.stringify(parsed, null, 2) }));
      setStatus(`Đã cập nhật requirement cho ${proposalId}; trạng thái xác minh vẫn UNVERIFIED.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Requirement JSON không hợp lệ.");
    }
  }

  function exportReviewedProfile() {
    if (!reviewState) return;
    setError(null);
    try {
      const artifact = buildReviewedProfileExport(reviewState);
      downloadJson(`${safeFilePart(artifact.profile.id)}-${safeFilePart(artifact.profile.version)}-unverified.json`, artifact);
      setStatus(`Đã xuất ${artifact.rules.length} rule đã review. Profile vẫn UNVERIFIED và chưa tự đăng ký vào standards registry.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xuất learned profile draft.");
    }
  }

  async function exportAudit() {
    setBusy(true);
    setError(null);
    try {
      const semantic = await readSemanticDocumentSnapshot();
      const report = evaluateV2Quality(V2_REGISTRY, profileRef, semantic);
      const audit = buildV2AuditReport(report);
      downloadJson(`${safeFilePart(report.profile.id)}-${safeFilePart(report.profile.version)}-audit.json`, audit);
      setStatus(`Đã xuất audit V2: ${audit.unresolvedFindings.length} finding, preflight ${audit.preflightStatus}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo audit report V2.");
    } finally {
      setBusy(false);
    }
  }

  async function refreshTransactionHistory() {
    setBusy(true);
    setError(null);
    try {
      const semantic = await readSemanticDocumentSnapshot();
      const next = buildTransactionHistoryView(compatibilityTransactionStore.history(), semantic);
      setHistory(next);
      setStatus(`Transaction History: ${next.length} mục; chỉ transaction mới nhất và còn nguyên cấu trúc mới đủ điều kiện rollback.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đọc transaction history.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.root}>
      <Card className={styles.stack}>
        <div className={styles.spread}>
          <Text weight="semibold">V2 Operations & QA</Text>
          <Badge color="warning">PILOT</Badge>
        </div>
        <Text size={200} className={styles.note}>
          Các công cụ V2 quản trị template/audit/release. V1 compatibility vẫn là mutation path cho tới khi Word Desktop smoke hoàn tất.
        </Text>
        <Dropdown
          value={selectedProfile.name}
          selectedOptions={[profileKey(profileRef.id, profileRef.version)]}
          onOptionSelect={(_, data) => {
            const value = String(data.optionValue ?? "");
            const [id, version] = value.split("@");
            if (id && version) setProfileRef({ id, version });
          }}
        >
          {profiles.map((profile) => (
            <Option key={profileKey(profile.id, profile.version)} value={profileKey(profile.id, profile.version)} text={profile.name}>
              {profile.name} · {profile.status}
            </Option>
          ))}
        </Dropdown>
        <div className={styles.row}>
          <Button appearance="primary" onClick={() => void learnFromCurrentDocument()} disabled={busy}>Học từ tài liệu hiện tại</Button>
          <Button onClick={() => void exportAudit()} disabled={busy}>Xuất Audit JSON</Button>
          <Button onClick={() => void refreshTransactionHistory()} disabled={busy}>Làm mới Transaction History</Button>
        </div>
      </Card>

      <PersistentWordCard />

      {busy && <Spinner label="Đang xử lý V2..." />}
      {error && <div className={styles.error}><Text>{error}</Text></div>}
      {status && <Text size={200}>{status}</Text>}

      {reviewState && analysis && (
        <TemplateReviewPanel
          state={reviewState}
          analysisConfidence={analysis.confidence}
          requirementJson={requirementJson}
          busy={busy}
          onRequirementJsonChange={(proposalId, value) => setRequirementJson((current) => ({ ...current, [proposalId]: value }))}
          onApplyRequirement={applyRequirementJson}
          onDecision={decideProposal}
          onExport={exportReviewedProfile}
          onReset={() => {
            setAnalysis(null);
            setReviewState(null);
            setRequirementJson({});
          }}
        />
      )}

      <Card className={styles.stack}>
        <div className={styles.spread}>
          <Text weight="semibold">Transaction History</Text>
          <Badge appearance="outline">{history.length}</Badge>
        </div>
        {history.length === 0 ? (
          <Text size={200} className={styles.note}>Chưa có transaction compatibility trong phiên hoặc chưa bấm làm mới.</Text>
        ) : history.map((transaction) => (
          <div className={styles.item} key={transaction.id}>
            <div className={styles.row}>
              <Text weight="semibold">{transaction.label}</Text>
              {transaction.isLatest && <Badge appearance="outline">LATEST</Badge>}
              <Badge color={transaction.rollbackEligible ? "success" : "subtle"}>
                {transaction.rollbackEligible ? "ROLLBACK ELIGIBLE" : "READ ONLY"}
              </Badge>
            </div>
            <Text size={200} className={styles.note}>
              {transaction.createdAt ?? "Không có timestamp"} · {transaction.findingCount} finding
            </Text>
          </div>
        ))}
        <Text size={200} className={styles.note}>
          Lịch sử này theo dõi Fix Selected, Normalize Selection và Heading Numbering trên V1 compatibility path; không thay thế safety guard của rollback hiện hữu.
        </Text>
      </Card>

      <Card className={styles.stack}>
        <div className={styles.spread}>
          <Text weight="semibold">Word Desktop Release Matrix</Text>
          <Badge color="warning">PENDING MANUAL</Badge>
        </div>
        {DEFAULT_RELEASE_MATRIX.environments.map((environment) => (
          <div className={styles.item} key={environment.id}>
            <div className={styles.row}>
              <Text>{environment.label}</Text>
              {environment.required && <Badge appearance="outline">REQUIRED</Badge>}
              <Badge color="warning">NOT RUN</Badge>
            </div>
          </div>
        ))}
        <Text size={200} weight="semibold">Smoke checklist</Text>
        <Text size={200}>{WORD_DESKTOP_SMOKE_CHECKLIST.join(" → ")}</Text>
        <div className={styles.warning}>
          <Text size={200}>
            Không tự đánh dấu QUALIFIED. Production qualification chỉ hợp lệ sau khi môi trường Word Desktop bắt buộc chạy đủ checklist và kết quả thật được ghi nhận.
          </Text>
        </div>
      </Card>
    </section>
  );
}

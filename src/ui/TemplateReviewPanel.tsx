import {
  Badge,
  Button,
  Card,
  Text,
  Textarea,
  makeStyles,
  tokens
} from "@fluentui/react-components";
import { canSaveReviewedProfile } from "../templates/profileExport";
import type { LearnedRuleDecision } from "../templates/draftProfileGenerator";
import type { ProfileReviewState } from "../templates/profileReview";

const useStyles = makeStyles({
  card: { display: "flex", flexDirection: "column", gap: "10px" },
  row: { display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" },
  proposal: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "10px 0",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  note: { color: tokens.colorNeutralForeground3 },
  warning: { padding: "8px", borderRadius: "6px", background: tokens.colorPaletteYellowBackground1 }
});

export interface TemplateReviewPanelProps {
  state: ProfileReviewState;
  analysisConfidence: number;
  requirementJson: Readonly<Record<string, string>>;
  busy: boolean;
  onRequirementJsonChange: (proposalId: string, value: string) => void;
  onApplyRequirement: (proposalId: string) => void;
  onDecision: (proposalId: string, decision: LearnedRuleDecision) => void;
  onExport: () => void;
  onReset: () => void;
}

function decisionLabel(decision: LearnedRuleDecision): string {
  return decision.toUpperCase();
}

export default function TemplateReviewPanel(props: TemplateReviewPanelProps) {
  const styles = useStyles();
  const canExport = canSaveReviewedProfile(props.state);
  const confidence = Math.round(Math.max(0, Math.min(1, props.analysisConfidence)) * 100);

  return (
    <Card className={styles.card}>
      <div className={styles.row}>
        <Text weight="semibold">Template Learning Review</Text>
        <Badge appearance="outline">Confidence {confidence}%</Badge>
        <Badge color="warning">UNVERIFIED</Badge>
      </div>
      <div className={styles.warning}>
        <Text size={200}>
          Template chỉ là nguồn quan sát. Rule học được không trở thành chuẩn chính thức cho tới khi được con người duyệt và quy trình quản trị nguồn xác minh riêng.
        </Text>
      </div>

      {props.state.proposals.length === 0 && (
        <Text size={200}>Không có rule đủ bằng chứng để đề xuất từ template hiện tại.</Text>
      )}

      {props.state.proposals.map((proposal) => (
        <div className={styles.proposal} key={proposal.id}>
          <div className={styles.row}>
            <Badge appearance="outline">{decisionLabel(proposal.decision)}</Badge>
            <Badge appearance="outline">{Math.round(proposal.confidence * 100)}%</Badge>
            <Text weight="semibold">{proposal.rule.title}</Text>
          </div>
          <Text size={200} className={styles.note}>
            {proposal.rule.id} · {proposal.rule.fixPolicy} · Evidence {proposal.evidence.length}
          </Text>
          {proposal.evidence.slice(0, 2).map((evidence) => (
            <Text key={evidence.id} size={200} className={styles.note}>
              {evidence.kind}: {String(evidence.observed)} ({Math.round(evidence.confidence * 100)}%)
            </Text>
          ))}
          <Textarea
            resize="vertical"
            value={props.requirementJson[proposal.id] ?? JSON.stringify(proposal.rule.requirement, null, 2)}
            onChange={(_, data) => props.onRequirementJsonChange(proposal.id, data.value)}
            aria-label={`Requirement JSON for ${proposal.rule.title}`}
          />
          <div className={styles.row}>
            <Button size="small" onClick={() => props.onApplyRequirement(proposal.id)} disabled={props.busy}>
              Áp dụng JSON
            </Button>
            <Button
              size="small"
              appearance={proposal.decision === "accepted" ? "primary" : "secondary"}
              onClick={() => props.onDecision(proposal.id, "accepted")}
              disabled={props.busy}
            >
              Accept
            </Button>
            <Button
              size="small"
              appearance={proposal.decision === "rejected" ? "primary" : "secondary"}
              onClick={() => props.onDecision(proposal.id, "rejected")}
              disabled={props.busy}
            >
              Reject
            </Button>
            <Button
              size="small"
              appearance="subtle"
              onClick={() => props.onDecision(proposal.id, "pending")}
              disabled={props.busy}
            >
              Pending
            </Button>
          </div>
        </div>
      ))}

      <div className={styles.row}>
        <Button appearance="primary" onClick={props.onExport} disabled={props.busy || !canExport}>
          Xuất draft JSON
        </Button>
        <Button onClick={props.onReset} disabled={props.busy}>Đóng review</Button>
        {!canExport && <Text size={200} className={styles.note}>Cần Accept/Reject toàn bộ proposal trước khi xuất.</Text>}
      </div>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { Badge, Card, Checkbox, Text, makeStyles, tokens } from "@fluentui/react-components";
import {
  readCurrentDocumentAutoOpenPreference,
  setCurrentDocumentAutoOpenPreference
} from "../services/documentAutoOpenService";

const useStyles = makeStyles({
  stack: { display: "flex", flexDirection: "column", gap: "7px" },
  row: { display: "flex", gap: "8px", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
  note: { color: tokens.colorNeutralForeground3 },
  error: { padding: "8px", borderRadius: "6px", background: tokens.colorPaletteRedBackground1 }
});

export default function PersistentWordCard() {
  const styles = useStyles();
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setEnabled(readCurrentDocumentAutoOpenPreference());
    } catch {
      // SSR/browser preview can render the card without an Office host.
    }
  }, []);

  async function updatePreference(next: boolean) {
    setSaving(true);
    setError(null);
    try {
      await setCurrentDocumentAutoOpenPreference(next);
      setEnabled(next);
      setStatus(
        next
          ? "Đã gắn cấu hình: tài liệu này sẽ tự mở HPC Assistant khi mở lại, nếu add-in đã được cài."
          : "Đã tắt tự mở Task Pane cho tài liệu này. Nút HPC Assistant trên Ribbon không bị gỡ."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu cấu hình tự mở Task Pane.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={styles.stack}>
      <div className={styles.row}>
        <Text weight="semibold">HPC Assistant trong Word</Text>
        <Badge color="success">PERSISTENT READY</Badge>
      </div>
      <Checkbox
        checked={enabled}
        disabled={saving}
        label="Luôn mở HPC Assistant cùng tài liệu này"
        onChange={(_, data) => void updatePreference(Boolean(data.checked))}
      />
      <Text size={200} className={styles.note}>
        Tùy chọn này chỉ gắn auto-open vào file Word hiện tại. Khi add-in được triển khai tập trung qua Microsoft 365, HPC Assistant sẽ có trên Ribbon mà không cần chạy npm hay mở một file trắng bằng debug launcher.
      </Text>
      {status && <Text size={200}>{status}</Text>}
      {error && <div className={styles.error}><Text size={200}>{error}</Text></div>}
    </Card>
  );
}

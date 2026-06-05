"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Shield,
  Database,
  Palette,
  AlertTriangle,
  Star,
} from "lucide-react";
import { Toggle } from "@/components/common/toggle";
import { Modal } from "@/components/common/modal";
import { ColorPicker } from "@/components/common/color-picker";
import { useToast } from "@/components/common/toast";
import { adminColorPresets } from "@/lib/ui-presets";
import {
  backupDataAction,
  changePasswordAction,
  clearAllDataAction,
  exportRecordsAction,
  restoreDataAction,
  updateSettingAction,
} from "@/lib/actions";
import { useUiStore } from "@/lib/stores/ui";
import type { Settings } from "@/lib/queries/settings";
import styles from "@/app/admin/admin.module.css";

type SectionIcon = "security" | "data" | "theme" | "about" | "danger";

const iconClassMap: Record<SectionIcon, string> = {
  security: styles.settingsSectionIconSecurity,
  data: styles.settingsSectionIconData,
  theme: styles.settingsSectionIconTheme,
  about: styles.settingsSectionIconAbout,
  danger: styles.settingsSectionIconDanger,
};

const THEME_KEYS = ["cafe", "sky", "coral", "mint", "lavender", "sun"] as const;

function SettingsSection({
  iconKey,
  title,
  desc,
  danger,
  children,
}: {
  iconKey: SectionIcon;
  title: string;
  desc: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.settingsSection} ${danger ? styles.settingsSectionDanger : ""}`}>
      <div className={styles.settingsSectionHeader}>
        <div className={`${styles.settingsSectionIcon} ${iconClassMap[iconKey]}`}>
          {iconKey === "security" && <Shield size={16} />}
          {iconKey === "data" && <Database size={16} />}
          {iconKey === "theme" && <Palette size={16} />}
          {iconKey === "about" && <Star size={16} />}
          {iconKey === "danger" && <AlertTriangle size={16} />}
        </div>
        <div>
          <div className={styles.settingsSectionTitle}>{title}</div>
          <div className={styles.settingsSectionDesc}>{desc}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Row({
  label,
  desc,
  action,
}: {
  label: string;
  desc: string;
  action: React.ReactNode;
}) {
  return (
    <div className={styles.settingsRow}>
      <div className={styles.settingsRowInfo}>
        <div className={styles.settingsRowLabel}>{label}</div>
        <div className={styles.settingsRowDesc}>{desc}</div>
      </div>
      <div className={styles.settingsRowAction}>{action}</div>
    </div>
  );
}

function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SettingsClient({ initial }: { initial: Settings }) {
  const [globalTheme, setGlobalTheme] = useState(initial.globalTheme);
  const [soundOpen, setSoundOpen] = useState(initial.soundOpen);
  const [compactMode, setCompactMode] = useState(initial.compactMode);
  const [childAccessEnabled, setChildAccessEnabled] = useState(initial.childAccessPwdEnabled);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [clearDataOpen, setClearDataOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const hydrate = useUiStore((s) => s.hydrate);
  const t = useTranslations("admin.settings");
  const c = useTranslations("common");
  const e = useTranslations("error");
  const colorT = useTranslations("adminColorPresets");

  useEffect(() => {
    hydrate({ globalTheme: initial.globalTheme, soundOpen: initial.soundOpen, compactMode: initial.compactMode });
  }, [hydrate, initial]);
  useEffect(() => {
    setChildAccessEnabled(initial.childAccessPwdEnabled);
  }, [initial.childAccessPwdEnabled]);

  const handleExportRecords = () => {
    startTransition(async () => {
      const r = await exportRecordsAction();
      if (r.ok && r.data) {
        downloadJson(r.data.json, r.data.filename);
        toast.success(t("toast.exported"));
      } else if (!r.ok) {
        toast.error(e(r.error));
      }
    });
  };

  const handleBackup = () => {
    startTransition(async () => {
      const r = await backupDataAction();
      if (r.ok && r.data) {
        downloadJson(r.data.json, r.data.filename);
        toast.success(t("toast.backupDone"));
      } else if (!r.ok) {
        toast.error(e(r.error));
      }
    });
  };

  const handleRestore = (file: File) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("file", file);
      const r = await restoreDataAction(fd);
      if (r.ok) {
        const counts = r.data?.counts ?? {};
        toast.success(
          t("toast.restored", { children: counts.children ?? 0, tasks: counts.tasks ?? 0 })
        );
      } else if (!r.ok) {
        toast.error(e(r.error));
      }
    });
  };

  const handleClearAll = () => {
    startTransition(async () => {
      const r = await clearAllDataAction();
      if (r.ok) toast.success(t("toast.clearDone"));
      else if (!r.ok) toast.error(e(r.error));
    });
  };

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t("pageTitle")}</h1>
      </div>

      <SettingsSection iconKey="security" title={t("security.title")} desc={t("security.desc")}>
        <Row
          label={t("security.passwordLabel")}
          desc={t("security.passwordDesc")}
          action={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => setPasswordOpen(true)}
            >
              {t("security.setPassword")}
            </button>
          }
        />
        <Row
          label={t("security.childAccessLabel")}
          desc={t("security.childAccessDesc")}
          action={
            <Toggle
              checked={childAccessEnabled}
              onChange={async (b) => {
                const r = await updateSettingAction("child_access_pwd_enabled", b);
                if (r.ok) setChildAccessEnabled(b);
                else toast.error(e(r.error));
              }}
            />
          }
        />
      </SettingsSection>

      <SettingsSection iconKey="data" title={t("data.title")} desc={t("data.desc")}>
        <Row
          label={t("data.exportLabel")}
          desc={t("data.exportDesc")}
          action={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={handleExportRecords}
              disabled={pending}
            >
              {t("data.exportButton")}
            </button>
          }
        />
        <Row
          label={t("data.backupLabel")}
          desc={t("data.backupDesc")}
          action={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={handleBackup}
              disabled={pending}
            >
              {t("data.backupButton")}
            </button>
          }
        />
        <Row
          label={t("data.restoreLabel")}
          desc={t("data.restoreDesc")}
          action={
            <>
              <input
                ref={restoreFileRef}
                type="file"
                accept="application/json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleRestore(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className={`${styles.btn} ${styles.btnOutline}`}
                onClick={() => restoreFileRef.current?.click()}
                disabled={pending}
              >
                {t("data.selectFile")}
              </button>
            </>
          }
        />
      </SettingsSection>

      {/* Personalized & About sections temporarily hidden — pending future implementation */}

      <SettingsSection iconKey="danger" title={t("danger.title")} desc={t("danger.desc")} danger>
        <Row
          label={t("danger.clearLabel")}
          desc={t("danger.clearDesc")}
          action={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => setClearDataOpen(true)}
            >
              {t("danger.clearButton")}
            </button>
          }
        />
      </SettingsSection>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title={t("passwordModal.title")}
        maxWidth={420}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnLg}`}
              onClick={() => setPasswordOpen(false)}
            >
              {c("cancel")}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
              disabled={pending}
              onClick={() => {
                const form = document.getElementById("password-form") as HTMLFormElement | null;
                if (!form) return;
                const fd = new FormData(form);
                startTransition(async () => {
                  const r = await changePasswordAction(fd);
                  if (r.ok) {
                    toast.success(t("passwordModal.success"));
                    setPasswordOpen(false);
                  } else {
                    toast.error(e(r.error));
                  }
                });
              }}
            >
              {c("save")}
            </button>
          </>
        }
      >
        <form id="password-form" onSubmit={(e) => e.preventDefault()}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("passwordModal.label")}</label>
            <input
              type="password"
              name="password"
              className={styles.formInput}
              maxLength={4}
              inputMode="numeric"
              placeholder={t("passwordModal.placeholder")}
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={clearDataOpen}
        onClose={() => setClearDataOpen(false)}
        title={t("clearDataModal.title")}
        maxWidth={420}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnLg}`}
              onClick={() => setClearDataOpen(false)}
            >
              {c("cancel")}
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger} ${styles.btnLg}`}
              disabled={pending}
              onClick={() => {
                const form = document.getElementById("clear-form") as HTMLFormElement | null;
                if (!form) return;
                const fd = new FormData(form);
                const confirm = String(fd.get("confirm") ?? "");
                if (confirm !== t("clearDataModal.confirmText")) {
                  toast.error(t("clearDataModal.inputRequired"));
                  return;
                }
                startTransition(async () => {
                  handleClearAll();
                  setClearDataOpen(false);
                });
              }}
            >
              {t("clearDataModal.submit")}
            </button>
          </>
        }
      >
        <p className={styles.formHint}>
          {t("clearDataModal.desc")}
        </p>
        <form id="clear-form" onSubmit={(e) => e.preventDefault()}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{t("clearDataModal.label")}</label>
            <input
              type="text"
              name="confirm"
              className={styles.formInput}
              placeholder={t("clearDataModal.placeholder")}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

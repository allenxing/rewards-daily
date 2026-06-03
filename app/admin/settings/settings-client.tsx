"use client";

import { useState, useTransition, useRef } from "react";
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
  setSecurityQuestionAction,
  updateSettingAction,
} from "@/lib/actions";
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
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [clearDataOpen, setClearDataOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleExportRecords = () => {
    startTransition(async () => {
      const r = await exportRecordsAction();
      if (r.ok && r.data) {
        downloadJson(r.data.json, r.data.filename);
        toast.success("流水已导出");
      } else if (!r.ok) {
        toast.error(r.error);
      }
    });
  };

  const handleBackup = () => {
    startTransition(async () => {
      const r = await backupDataAction();
      if (r.ok && r.data) {
        downloadJson(r.data.json, r.data.filename);
        toast.success("备份完成,已下载");
      } else if (!r.ok) {
        toast.error(r.error);
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
          `已恢复 (孩子 ${counts.children ?? 0} · 任务 ${counts.tasks ?? 0})`
        );
      } else if (!r.ok) {
        toast.error(r.error);
      }
    });
  };

  const handleClearAll = () => {
    startTransition(async () => {
      const r = await clearAllDataAction();
      if (r.ok) toast.success("所有数据已清空");
      else if (!r.ok) toast.error(r.error);
    });
  };

  return (
    <div className={styles.pageBody}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>系统设置</h1>
      </div>

      <SettingsSection iconKey="security" title="安全设置" desc="管理登录密码和密保问题">
        <Row
          label="登录密码"
          desc="用于家长端登录的4位数字密码"
          action={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => setPasswordOpen(true)}
            >
              修改密码
            </button>
          }
        />
        <Row
          label="密保问题"
          desc="用于找回密码的安全问题"
          action={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => setSecurityOpen(true)}
            >
              {initial.securityQuestion ? "修改密保" : "设置密保"}
            </button>
          }
        />
      </SettingsSection>

      <SettingsSection iconKey="data" title="数据管理" desc="备份、恢复或清空所有数据">
        <Row
          label="导出流水"
          desc="导出最近的积分变动记录(最多 1000 条)"
          action={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={handleExportRecords}
              disabled={pending}
            >
              导出 JSON
            </button>
          }
        />
        <Row
          label="数据备份"
          desc="将所有数据导出为 JSON 文件,可用于跨设备迁移"
          action={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={handleBackup}
              disabled={pending}
            >
              立即备份
            </button>
          }
        />
        <Row
          label="数据恢复"
          desc="从备份文件恢复数据,当前数据将被覆盖"
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
                选择文件
              </button>
            </>
          }
        />
      </SettingsSection>

      <SettingsSection iconKey="theme" title="个性化设置" desc="自定义界面主题和交互体验">
        <Row
          label="主题色"
          desc="选择家长端的主色调"
          action={
            <ColorPicker
              defaultIndex={Math.max(0, THEME_KEYS.indexOf(globalTheme as typeof THEME_KEYS[number]))}
              options={adminColorPresets.map((c) => ({
                color: c.color,
                label: c.label,
              }))}
              onChange={async (k) => {
                const r = await updateSettingAction("global_theme", k);
                if (r.ok) setGlobalTheme(k);
                else toast.error(r.error);
              }}
            />
          }
        />
        <Row
          label="操作音效"
          desc="按钮点击和任务完成时的提示音"
          action={
            <Toggle
              checked={soundOpen}
              onChange={async (b) => {
                const r = await updateSettingAction("sound_open", b);
                if (r.ok) setSoundOpen(b);
                else toast.error(r.error);
              }}
            />
          }
        />
        <Row
          label="紧凑模式"
          desc="减小间距,在一屏内展示更多内容"
          action={
            <Toggle
              checked={compactMode}
              onChange={async (b) => {
                const r = await updateSettingAction("compact_mode", b);
                if (r.ok) setCompactMode(b);
                else toast.error(r.error);
              }}
            />
          }
        />
      </SettingsSection>

      <SettingsSection iconKey="about" title="关于" desc="产品信息与帮助">
        <Row
          label="版本号"
          desc="当前版本 v1.0.0"
          action={<span className={`${styles.badge} ${styles.badgeNeutral}`}>最新</span>}
        />
        <Row
          label="意见反馈"
          desc="遇到问题或有好的建议?"
          action={
            <button type="button" className={`${styles.btn} ${styles.btnOutline}`}>
              提交反馈
            </button>
          }
        />
        <Row
          label="使用帮助"
          desc="查看产品使用指南和常见问题"
          action={
            <button type="button" className={`${styles.btn} ${styles.btnOutline}`}>
              查看帮助
            </button>
          }
        />
      </SettingsSection>

      <SettingsSection iconKey="danger" title="危险操作" desc="以下操作不可逆,请谨慎执行" danger>
        <Row
          label="清空所有数据"
          desc="删除全部孩子、任务、积分和愿望数据,此操作无法恢复"
          action={
            <button
              type="button"
              className={`${styles.btn} ${styles.btnDanger}`}
              onClick={() => setClearDataOpen(true)}
            >
              清空数据
            </button>
          }
        />
      </SettingsSection>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="修改登录密码"
        maxWidth={420}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnLg}`}
              onClick={() => setPasswordOpen(false)}
            >
              取消
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
                    toast.success("密码修改成功");
                    setPasswordOpen(false);
                  } else {
                    toast.error(r.error);
                  }
                });
              }}
            >
              确认修改
            </button>
          </>
        }
      >
        <form id="password-form" onSubmit={(e) => e.preventDefault()}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>当前密码</label>
            <input
              type="password"
              name="current"
              className={styles.formInput}
              maxLength={4}
              inputMode="numeric"
              placeholder="输入当前4位密码"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>新密码</label>
            <input
              type="password"
              name="next"
              className={styles.formInput}
              maxLength={4}
              inputMode="numeric"
              placeholder="输入新的4位密码"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>确认新密码</label>
            <input
              type="password"
              name="confirm"
              className={styles.formInput}
              maxLength={4}
              inputMode="numeric"
              placeholder="再次输入新密码"
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={securityOpen}
        onClose={() => setSecurityOpen(false)}
        title="设置密保问题"
        maxWidth={420}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnLg}`}
              onClick={() => setSecurityOpen(false)}
            >
              取消
            </button>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnLg}`}
              disabled={pending}
              onClick={() => {
                const form = document.getElementById("security-form") as HTMLFormElement | null;
                if (!form) return;
                const fd = new FormData(form);
                startTransition(async () => {
                  const r = await setSecurityQuestionAction(fd);
                  if (r.ok) {
                    toast.success("密保问题已设置");
                    setSecurityOpen(false);
                  } else {
                    toast.error(r.error);
                  }
                });
              }}
            >
              保存密保
            </button>
          </>
        }
      >
        <form id="security-form" onSubmit={(e) => e.preventDefault()}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>密保问题</label>
            <select name="question" className={styles.formInput} defaultValue="" required>
              <option value="" disabled>
                请选择
              </option>
              <option>您母亲的姓名是?</option>
              <option>您的第一所学校是?</option>
              <option>您最喜欢的宠物名字是?</option>
              <option>自定义问题</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>密保答案</label>
            <input
              type="text"
              name="answer"
              className={styles.formInput}
              placeholder="请输入答案"
              required
            />
          </div>
        </form>
      </Modal>

      <Modal
        open={clearDataOpen}
        onClose={() => setClearDataOpen(false)}
        title="清空所有数据"
        maxWidth={420}
        footer={
          <>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnOutline} ${styles.btnLg}`}
              onClick={() => setClearDataOpen(false)}
            >
              取消
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
                if (confirm !== "确认清空") {
                  toast.error('请输入「确认清空」');
                  return;
                }
                startTransition(async () => {
                  handleClearAll();
                  setClearDataOpen(false);
                });
              }}
            >
              确认清空
            </button>
          </>
        }
      >
        <p className={styles.formHint}>
          此操作将删除全部孩子、任务、积分和愿望数据,且无法恢复。请确认后操作。
        </p>
        <form id="clear-form" onSubmit={(e) => e.preventDefault()}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>输入「确认清空」以继续</label>
            <input
              type="text"
              name="confirm"
              className={styles.formInput}
              placeholder="确认清空"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

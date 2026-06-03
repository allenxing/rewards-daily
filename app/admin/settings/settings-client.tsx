"use client";

import { useState } from "react";
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
import styles from "@/app/admin/admin.module.css";

type SectionIcon = "security" | "data" | "theme" | "about" | "danger";

const iconClassMap: Record<SectionIcon, string> = {
  security: styles.settingsSectionIconSecurity,
  data: styles.settingsSectionIconData,
  theme: styles.settingsSectionIconTheme,
  about: styles.settingsSectionIconAbout,
  danger: styles.settingsSectionIconDanger,
};

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

export function SettingsClient() {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [clearDataOpen, setClearDataOpen] = useState(false);
  const toast = useToast();

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
              设置密保
            </button>
          }
        />
        <Row
          label="登录通知"
          desc="每次登录时发送通知提醒"
          action={<Toggle checked />}
        />
      </SettingsSection>

      <SettingsSection iconKey="data" title="数据管理" desc="备份、恢复或清空所有数据">
        <Row
          label="数据备份"
          desc="将所有数据导出为 JSON 文件,可用于跨设备迁移"
          action={
            <button type="button" className={`${styles.btn} ${styles.btnOutline}`}>
              立即备份
            </button>
          }
        />
        <Row
          label="数据恢复"
          desc="从备份文件恢复数据,当前数据将被覆盖"
          action={
            <button type="button" className={`${styles.btn} ${styles.btnOutline}`}>
              选择文件
            </button>
          }
        />
        <Row
          label="自动备份"
          desc="每周自动备份一次数据到本地存储"
          action={<Toggle checked={false} />}
        />
      </SettingsSection>

      <SettingsSection iconKey="theme" title="个性化设置" desc="自定义界面主题和交互体验">
        <Row
          label="主题色"
          desc="选择家长端的主色调"
          action={
            <ColorPicker
              defaultIndex={0}
              options={adminColorPresets.map((c) => ({
                color: c.color,
                label: c.label,
              }))}
            />
          }
        />
        <Row
          label="操作音效"
          desc="按钮点击和任务完成时的提示音"
          action={<Toggle checked />}
        />
        <Row
          label="紧凑模式"
          desc="减小间距,在一屏内展示更多内容"
          action={<Toggle checked={false} />}
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
              onClick={() => {
                setPasswordOpen(false);
                toast.success("密码修改成功");
              }}
            >
              确认修改
            </button>
          </>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>当前密码</label>
          <input
            type="password"
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
            className={styles.formInput}
            maxLength={4}
            inputMode="numeric"
            placeholder="再次输入新密码"
          />
        </div>
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
              onClick={() => {
                setSecurityOpen(false);
                toast.success("密保问题已设置");
              }}
            >
              保存密保
            </button>
          </>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>密保问题</label>
          <select className={styles.formInput} defaultValue="">
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
          <input type="text" className={styles.formInput} placeholder="请输入答案" />
        </div>
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
              onClick={() => {
                setClearDataOpen(false);
                toast.success("所有数据已清空");
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
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>输入「确认清空」以继续</label>
          <input type="text" className={styles.formInput} placeholder="确认清空" />
        </div>
      </Modal>
    </div>
  );
}

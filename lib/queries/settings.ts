// Stub: real implementation in Phase 2 task 2.1
export type Settings = {
  ownerId: string;
  adminPwd: string;
  securityQuestion: string | null;
  securityAnswer: string | null;
  globalTheme: string;
  soundOpen: boolean;
  compactMode: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getSettings(): Promise<Settings> {
  throw new Error("not implemented: getSettings (Phase 2)");
}

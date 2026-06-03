// Stub: real implementation in Phase 2 task 2.2
export type Child = {
  id: number;
  ownerId: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  themeKey: string;
  themeColor: string;
  totalPoints: number;
  level: number;
  shareToken: string;
  createdAt: string;
  updatedAt: string;
};

export async function getChildren(): Promise<Child[]> {
  throw new Error("not implemented: getChildren (Phase 2)");
}

export async function getChildByShareToken(_token: string): Promise<Child | null> {
  throw new Error("not implemented: getChildByShareToken (Phase 2)");
}

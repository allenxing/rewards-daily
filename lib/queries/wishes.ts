// Stub: real implementation in Phase 2 task 2.5
export type Wish = {
  id: number;
  ownerId: string;
  name: string;
  imageUrl: string | null;
  emoji: string | null;
  targetPoints: number;
  childId: number | null;
  isFamily: boolean;
  isLock: boolean;
  isTarget: boolean;
  isFinish: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WishWithProgress = Wish & {
  childName: string;
  childTotalPoints: number;
  progressPercent: number;
};

export async function getWishesForAdmin(): Promise<WishWithProgress[]> {
  throw new Error("not implemented: getWishesForAdmin (Phase 2)");
}

export async function getWishesForChild(_shareToken: string): Promise<WishWithProgress[]> {
  throw new Error("not implemented: getWishesForChild (Phase 2)");
}

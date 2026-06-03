import { WishesClient } from "./wishes-client";
import { getWishesForAdmin, toAdminWish } from "@/lib/queries/wishes";
import { getChildren } from "@/lib/queries/children";

export default async function WishesPage() {
  const [wishes, kids] = await Promise.all([getWishesForAdmin(), getChildren()]);
  const initialWishes = wishes.map(toAdminWish);
  return <WishesClient initialWishes={initialWishes} kidsList={kids} />;
}

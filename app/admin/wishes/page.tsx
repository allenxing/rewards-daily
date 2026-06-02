import { WishesClient } from "./wishes-client";
import { wishes } from "@/lib/mock-data";
import { children } from "@/lib/mock-data";

export default function WishesPage() {
  return <WishesClient initialWishes={wishes} kidsList={children} />;
}

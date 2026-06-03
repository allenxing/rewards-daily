import { ChildrenClient } from "./children-client";
import { getChildren } from "@/lib/queries/children";

export default async function ChildrenPage() {
  const children = await getChildren();
  return <ChildrenClient initialChildren={children} />;
}

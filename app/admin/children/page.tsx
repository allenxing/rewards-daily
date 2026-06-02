import { ChildrenClient } from "./children-client";
import { children } from "@/lib/mock-data";

export default function ChildrenPage() {
  return <ChildrenClient initialChildren={children} />;
}

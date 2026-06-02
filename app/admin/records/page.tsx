import { RecordsClient } from "./records-client";
import { records, children } from "@/lib/mock-data";

export default function RecordsPage() {
  return <RecordsClient initialRecords={records} kidsList={children} />;
}

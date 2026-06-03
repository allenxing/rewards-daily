import { RecordsClient } from "./records-client";
import { getRecords, getRecordSummary } from "@/lib/queries/points-records";
import { getChildren } from "@/lib/queries/children";
import type { RecordFilters } from "@/lib/queries/points-records";

type Props = {
  searchParams: Promise<RecordFilters>;
};

export default async function RecordsPage({ searchParams }: Props) {
  const filters = await searchParams;
  const [records, summary, kids] = await Promise.all([
    getRecords(filters),
    getRecordSummary(),
    getChildren(),
  ]);
  return <RecordsClient initialRecords={records} kidsList={kids} summary={summary} />;
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getChildByShareToken } from "@/lib/queries/children";
import { ChildShell } from "@/components/child/child-shell";
import { ChildGate } from "@/components/child/child-gate";

export const metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ shareToken: string }>;
  children: React.ReactNode;
};

export default function ChildLayout({ params, children }: Props) {
  return (
    <Suspense fallback={null}>
      <ChildLayoutInner params={params}>{children}</ChildLayoutInner>
    </Suspense>
  );
}

async function ChildLayoutInner({ params, children }: Props) {
  const { shareToken } = await params;
  const child = await getChildByShareToken(shareToken);
  if (!child) notFound();
  return (
    <ChildGate childId={child.id}>
      <ChildShell child={child}>{children}</ChildShell>
    </ChildGate>
  );
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getChildByShareToken } from "@/lib/queries/children";
import { ChildShell } from "@/components/child/child-shell";
import { ChildGate } from "@/components/child/child-gate";
import type { Viewport } from "next";

export const metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
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
    <>
      <ChildThemeBackground themeKey={child.themeKey} />
      <ChildGate childId={child.id}>
        <ChildShell child={child}>{children}</ChildShell>
      </ChildGate>
    </>
  );
}

function ChildThemeBackground({ themeKey }: { themeKey: string }) {
  const bgMap: Record<string, string> = {
    sky: "#6BCB77",
    coral: "#FF9F8A",
    mint: "#A8E6CF",
    lavender: "#C084FC",
    sun: "#FCD34D",
  };
  const color = bgMap[themeKey] ?? "#6BCB77";
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `html { background: ${color}; overscroll-behavior: none; min-height: 100dvh; } body { background: ${color} !important; min-height: 100dvh; }`,
        }}
      />
      <div
        style={{ position: "fixed", top: -99, right: -99, bottom: -99, left: -99, zIndex: -1, background: color, pointerEvents: "none" }}
        aria-hidden="true"
      />
    </>
  );
}

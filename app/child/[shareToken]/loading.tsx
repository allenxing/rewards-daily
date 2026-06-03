import { Loader } from "lucide-react";

export default function ChildLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100dvh - 140px)",
        color: "rgba(255,255,255,0.7)",
      }}
    >
      <Loader size={32} className="animate-spin" strokeWidth={1.5} />
    </div>
  );
}

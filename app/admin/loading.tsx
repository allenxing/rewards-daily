import { Loader } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center text-[#8b7b6b]" style={{ minHeight: "calc(100dvh - 80px)" }}>
      <Loader size={28} className="animate-spin" strokeWidth={1.5} />
    </div>
  );
}

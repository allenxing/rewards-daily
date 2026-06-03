import { Loader } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-[#8b7b6b]">
      <Loader size={28} className="animate-spin" strokeWidth={1.5} />
    </div>
  );
}

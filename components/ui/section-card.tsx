import { ReactNode } from "react";

type Props = {
  title?: string;
  badge?: string;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({ title, badge, children, className = "" }: Props) {
  return (
    <div className={"rounded-3xl border border-white/10 bg-white/[0.04] p-4 " + className}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          {badge && (
            <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

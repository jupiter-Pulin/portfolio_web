"use client";

import { useAsk } from "./AskDrawer";
import { Icon } from "./Icon";

/**
 * Every way into the guide — design/mock [data-ask]. The header opens it with no
 * scope; a case page opens it scoped to the project whose page it sits on, and
 * keeps `data-scope` so the built page still says which one that is.
 */
export function AskButton({
  className,
  label,
  labelClassName,
  scopeId,
}: {
  className: string;
  label: string;
  labelClassName?: string;
  scopeId?: string;
}) {
  const { openAsk } = useAsk();

  return (
    <button
      className={className}
      type="button"
      aria-haspopup="dialog"
      data-scope={scopeId}
      onClick={() => openAsk(scopeId)}
    >
      <Icon name="spark" className="ic" />
      {labelClassName ? <span className={labelClassName}>{label}</span> : label}
    </button>
  );
}

"use client";

import { useAsk } from "./AskDrawer";
import { Icon } from "./Icon";
import { Sketch, type SketchProps } from "./sketch/Sketch";

/**
 * Every way into the assistant. The header opens it with no scope; a case page
 * opens it scoped to the project whose page it sits on, and keeps `data-scope`
 * so the built page still says which one that is.
 */
export function AskButton({
  className,
  label,
  labelClassName,
  scopeId,
  sketch,
}: {
  className: string;
  label: string;
  labelClassName?: string;
  scopeId?: string;
  /** The hand-drawn outline; the button then needs the `sk` class. */
  sketch?: SketchProps;
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
      {sketch ? <Sketch {...sketch} /> : null}
      <Icon name="spark" className="ic" />
      {labelClassName ? <span className={labelClassName}>{label}</span> : label}
    </button>
  );
}

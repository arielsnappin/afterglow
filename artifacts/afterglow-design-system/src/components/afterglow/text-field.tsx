import * as React from "react";
import { cn } from "../../lib/utils";

type NativeProps = Omit<React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>, "children">;

export interface TextFieldProps extends NativeProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Error text; replaces hint and turns the field danger */
  error?: React.ReactNode;
  multiline?: boolean;
}

/** Source Afterglow TextField (`ag-field`): glass input or textarea with label and hint/error. */
export const TextField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(function TextField(
  { label, hint, error, multiline, className, id, rows, ...rest },
  ref,
) {
  const autoId = React.useId();
  const fieldId = id || `ag-field-${autoId}`;
  const hintId = `${fieldId}-hint`;
  const message = error || hint;
  const shared = {
    id: fieldId,
    className: "ag-field__input",
    "aria-invalid": error ? true : undefined,
    "aria-describedby": message ? hintId : undefined,
  };
  return (
    <div className={cn("ag-field", error ? "ag-field--error" : null, className)}>
      {label ? (
        <label className="ag-field__label" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      {multiline ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          rows={rows ?? 3}
          {...shared}
          {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input ref={ref as React.Ref<HTMLInputElement>} {...shared} {...(rest as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {message ? (
        <span id={hintId} className="ag-field__hint" role={error ? "alert" : undefined}>
          {message}
        </span>
      ) : null}
    </div>
  );
});

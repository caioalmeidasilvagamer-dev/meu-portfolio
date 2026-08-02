import * as React from "react";

const GlassButton = React.forwardRef(function GlassButton(
  { className, style, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={"glass-button" + (className ? " " + className : "")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        borderRadius: "50%",
        lineHeight: 1,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
});

GlassButton.displayName = "GlassButton";

export { GlassButton };

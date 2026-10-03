import { useSheetSwipeDismiss } from "./useSheetSwipeDismiss.js";

/**
 * Bottom sheet « carte » (ms-sheet-card) avec swipe-down sur le handle.
 */
export default function SheetCardShell({
  onClose,
  children,
  overlayProps = {},
  panelClassName = "sheet-panel ms-sheet-card scale-in",
  panelStyle: panelStyleProp = undefined,
}) {
  const { headProps, panelStyle, overlayStyle, panelClassExtra } = useSheetSwipeDismiss(onClose);
  const { style: overlayStyleProp, onClick, ...restOverlay } = overlayProps;

  return (
    <div
      className="sheet-overlay"
      style={{ ...overlayStyle, ...(overlayStyleProp || {}) }}
      onClick={onClick}
      {...restOverlay}
    >
      <div
        className={`${panelClassName} ${panelClassExtra}`.trim()}
        style={{ ...(panelStyleProp || {}), ...panelStyle }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          {...headProps}
          style={{
            ...(headProps.style || {}),
            marginBottom: 4,
          }}
        >
          <div className="ms-sheet-handle" aria-hidden />
        </div>
        {children}
      </div>
    </div>
  );
}

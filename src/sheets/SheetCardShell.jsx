import { useSheetSwipeDismiss } from "./useSheetSwipeDismiss.js";

/**
 * Bottom sheet « carte » (ms-sheet-card) avec swipe-down.
 * `swipeEntirePanel` : geste sur toute la carte (confirm courts) ;
 * sinon uniquement la zone handle (feuilles avec contenu scrollable).
 */
export default function SheetCardShell({
  onClose,
  children,
  overlayProps = {},
  panelClassName = "sheet-panel ms-sheet-card scale-in",
  panelStyle: panelStyleProp = undefined,
  swipeEntirePanel = false,
}) {
  const { headProps, panelStyle, overlayStyle, panelClassExtra } = useSheetSwipeDismiss(onClose);
  const { style: overlayStyleProp, onClick, ...restOverlay } = overlayProps;
  const { style: swipeStyle, ...swipeHandlers } = headProps;

  return (
    <div
      className="sheet-overlay"
      style={{ ...overlayStyle, ...(overlayStyleProp || {}) }}
      onClick={onClick}
      {...restOverlay}
    >
      <div
        className={`${panelClassName} ${panelClassExtra}`.trim()}
        style={{
          ...(panelStyleProp || {}),
          ...panelStyle,
          ...(swipeEntirePanel
            ? {
                overflow: "hidden",
                overscrollBehavior: "none",
                ...swipeStyle,
              }
            : null),
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        {...(swipeEntirePanel ? swipeHandlers : {})}
      >
        <div
          className="ms-sheet-card-grab"
          {...(swipeEntirePanel ? {} : swipeHandlers)}
          style={swipeEntirePanel ? undefined : swipeStyle}
        >
          <div className="ms-sheet-handle" aria-hidden />
        </div>
        {children}
      </div>
    </div>
  );
}

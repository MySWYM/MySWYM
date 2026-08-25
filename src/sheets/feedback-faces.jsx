/** SVG faces — Apple-style minimal, no emoji */
export const FaceGood = ({ size = 56, color = "#00C48C" }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="26" stroke={color} strokeWidth="2.5" fill="none"/>
    <circle cx="20" cy="23" r="2.5" fill={color}/>
    <circle cx="36" cy="23" r="2.5" fill={color}/>
    <path d="M18 33 Q28 43 38 33" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);
export const FaceMid = ({ size = 56, color = "#FF9F0A" }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="26" stroke={color} strokeWidth="2.5" fill="none"/>
    <circle cx="20" cy="23" r="2.5" fill={color}/>
    <circle cx="36" cy="23" r="2.5" fill={color}/>
    <path d="M19 36 H37" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
export const FaceTired = ({ size = 56, color = "#FF3B30" }) => (
  <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="26" stroke={color} strokeWidth="2.5" fill="none"/>
    <circle cx="20" cy="23" r="2.5" fill={color}/>
    <circle cx="36" cy="23" r="2.5" fill={color}/>
    <path d="M18 39 Q28 29 38 39" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);

export const SMILEY_OPTS = [
  { id: "easy", Face: FaceGood,  label: "En forme",         sub: "Séances faciles à tenir",     color: "#00C48C", bg: "#E6FFF6" },
  { id: "ok",   Face: FaceMid,   label: "Correct",          sub: "Effort modéré — bon rythme",  color: "#FF9F0A", bg: "#FFF8EE" },
  { id: "hard", Face: FaceTired, label: "Difficile",        sub: "Fatigue ou surcharge",        color: "#FF3B30", bg: "#FFF0EF" },
];


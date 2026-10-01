/** Drapeaux SVG inline (hors ligne), recadrés en rond par le CSS parent. */

function Fr() {
  return (
    <svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice">
      <rect width="1" height="2" fill="#002395" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ED2939" />
    </svg>
  );
}

function Gb() {
  return (
    <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="2.5" />
      <path d="M30 0 V30 M0 15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

function De() {
  return (
    <svg viewBox="0 0 5 3" preserveAspectRatio="xMidYMid slice">
      <rect width="5" height="1" fill="#000" />
      <rect y="1" width="5" height="1" fill="#DD0000" />
      <rect y="2" width="5" height="1" fill="#FFCE00" />
    </svg>
  );
}

function Es() {
  return (
    <svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice">
      <rect width="3" height="2" fill="#AA151B" />
      <rect y="0.5" width="3" height="1" fill="#F1BF00" />
    </svg>
  );
}

function Jp() {
  return (
    <svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice">
      <rect width="3" height="2" fill="#fff" />
      <circle cx="1.5" cy="1" r="0.6" fill="#BC002D" />
    </svg>
  );
}

function Nl() {
  return (
    <svg viewBox="0 0 9 6" preserveAspectRatio="xMidYMid slice">
      <rect width="9" height="2" fill="#AE1C28" />
      <rect y="2" width="9" height="2" fill="#fff" />
      <rect y="4" width="9" height="2" fill="#21468B" />
    </svg>
  );
}

function It() {
  return (
    <svg viewBox="0 0 3 2" preserveAspectRatio="xMidYMid slice">
      <rect width="1" height="2" fill="#009246" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#CE2B37" />
    </svg>
  );
}

function Pt() {
  return (
    <svg viewBox="0 0 15 10" preserveAspectRatio="xMidYMid slice">
      <rect width="15" height="10" fill="#FF0000" />
      <rect width="6" height="10" fill="#006600" />
      <circle cx="6" cy="5" r="1.8" fill="#FFCC00" />
    </svg>
  );
}

function Br() {
  return (
    <svg viewBox="0 0 20 14" preserveAspectRatio="xMidYMid slice">
      <rect width="20" height="14" fill="#009C3B" />
      <polygon points="10,1.4 18.2,7 10,12.6 1.8,7" fill="#FFDF00" />
      <circle cx="10" cy="7" r="2.5" fill="#002776" />
    </svg>
  );
}

function Se() {
  return (
    <svg viewBox="0 0 16 10" preserveAspectRatio="xMidYMid slice">
      <rect width="16" height="10" fill="#006AA7" />
      <rect x="5" width="2" height="10" fill="#FECC00" />
      <rect y="4" width="16" height="2" fill="#FECC00" />
    </svg>
  );
}

function Dk() {
  return (
    <svg viewBox="0 0 37 28" preserveAspectRatio="xMidYMid slice">
      <rect width="37" height="28" fill="#C60C30" />
      <rect x="12" width="4" height="28" fill="#fff" />
      <rect y="12" width="37" height="4" fill="#fff" />
    </svg>
  );
}

function No() {
  return (
    <svg viewBox="0 0 22 16" preserveAspectRatio="xMidYMid slice">
      <rect width="22" height="16" fill="#BA0C2F" />
      <rect x="6" width="4" height="16" fill="#fff" />
      <rect y="6" width="22" height="4" fill="#fff" />
      <rect x="7" width="2" height="16" fill="#00205B" />
      <rect y="7" width="22" height="2" fill="#00205B" />
    </svg>
  );
}

function Fi() {
  return (
    <svg viewBox="0 0 18 11" preserveAspectRatio="xMidYMid slice">
      <rect width="18" height="11" fill="#fff" />
      <rect x="5" width="3" height="11" fill="#003580" />
      <rect y="4" width="18" height="3" fill="#003580" />
    </svg>
  );
}

const FLAGS = {
  FR: Fr,
  GB: Gb,
  DE: De,
  ES: Es,
  JP: Jp,
  NL: Nl,
  IT: It,
  PT: Pt,
  BR: Br,
  SE: Se,
  DK: Dk,
  NO: No,
  FI: Fi,
};

export default function FlagMark({ code, size = 22, className = "ms-lang-flag" }) {
  const Flag = FLAGS[code];
  if (!Flag) return null;
  return (
    <span className={className} style={{ width: size, height: size }} aria-hidden>
      <Flag />
    </span>
  );
}

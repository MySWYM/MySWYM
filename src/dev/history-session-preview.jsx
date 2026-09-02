import { createRoot } from "react-dom/client";
import HistorySessionSheet from "../sheets/HistorySessionSheet.jsx";
import { G } from "../theme/palette.js";

const session = {
  title: "Séance n°1",
  type: "ENDURANCE",
  distance: "1800m",
  duration: 45,
  completed: true,
  details: [
    "400 m crawl aisance",
    "8 × 100 m éducatif",
    "200 m retour au calme",
  ],
};

createRoot(document.getElementById("root")).render(
  <HistorySessionSheet
    open
    session={session}
    ordinal={0}
    colors={G}
    accent={{ bg: G.blueLight, color: G.blue }}
    isPremium
  />,
);

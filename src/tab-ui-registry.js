/** Gradual extraction: App registers shell UI used by PlanTab / Dashboard. */
let tabUi = null;

export function registerTabUi(next) {
  tabUi = next;
}

export function getTabUi() {
  if (!tabUi) {
    throw new Error("tab UI registry not ready — registerTabUi() must run from App.jsx");
  }
  return tabUi;
}

/** Copy rappels séance (séparé pour tests sans Capacitor). */
export function sessionReminderCopy({ sessionTitle, streak = 0 } = {}) {
  void sessionTitle;
  if (streak >= 3) {
    return {
      title: "Rappel séance",
      body: `Ta prochaine séance t’attend, garde ta série de ${streak}.`,
    };
  }
  return {
    title: "L’eau t’attend",
    body: "Ta prochaine séance est prête. Une session et tu coches la case.",
  };
}

/**
 * Get user color based on connectionId
 * Uses the same color scheme as CollaboratorCursors
 */
export function getUserColor(connectionId: number): string {
  const colors = [
    "rgb(59, 130, 246)", // blue
    "rgb(236, 72, 153)", // pink
    "rgb(34, 197, 94)", // green
    "rgb(251, 146, 60)", // orange
    "rgb(168, 85, 247)", // purple
  ];

  return colors[connectionId % colors.length];
}

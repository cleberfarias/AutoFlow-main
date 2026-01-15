export function needsConfirmation(toolName: string, args: any, ctx: any): boolean {
  if (!toolName) return false;
  // Always confirm calendar.createAppointment
  if (toolName === 'calendar.createAppointment') return true;
  // For other tools, if args.forceConfirm === true
  if (args && args.forceConfirm) return true;
  // sending messages does not require confirmation
  if (toolName === 'whatsapp.gupshup.sendMessage' || toolName === 'whatsapp.web.sendMessage' || toolName === 'http.request') return false;
  return false;
}

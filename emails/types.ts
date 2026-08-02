// Captura de lead + envío de reportes. Ver PROPOSAL.md § carpetas /emails.
// El reporte de diagnóstico está gateado por email (Semana 1).

export type LeadCapture = {
  email: string;
  domain: string;
  scanId: string;
};

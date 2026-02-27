function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'UTC',
  });
}

export function buildSubject(title: string): string {
  return `⏰ Reminder: ${title}`;
}

export function buildTextBody(title: string, scheduledAt: string): string {
  return [
    `You have a reminder:`,
    ``,
    `  ${title}`,
    ``,
    `Scheduled for: ${formatDate(scheduledAt)} (UTC)`,
  ].join('\n');
}

export function buildHtmlBody(title: string, scheduledAt: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="font-family: sans-serif; color: #333; padding: 24px;">
  <h2 style="color: #4f46e5;">⏰ Reminder</h2>
  <p style="font-size: 18px; font-weight: bold;">${escapeHtml(title)}</p>
  <p style="color: #666;">Scheduled for: <strong>${formatDate(scheduledAt)} (UTC)</strong></p>
</body>
</html>`.trim();
}

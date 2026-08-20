import disposableDomains from 'disposable-email-domains';

// Convert array to a Set for O(1) instant lookup
const disposableSet = new Set(disposableDomains as string[]);

// Additional common temp domains
const additionalTempDomains = new Set([
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'cool.fr.nf',
  'jetable.fr.nf',
  'courriel.fr.nf',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamail.info',
  'guerrillamail.biz',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'mailinator.com',
  'trashmail.com',
  'trashmail.net',
  'dispostable.com',
  'getnada.com',
  'inboxkitten.com',
  'generator.email',
  'emailondeck.com',
  'mohmal.com',
]);

/**
 * Validates whether an email address uses a disposable/temporary email provider.
 * Returns true if the email domain is disposable, false if it is legitimate.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;

  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;

  const domain = parts[1];

  return disposableSet.has(domain) || additionalTempDomains.has(domain);
}

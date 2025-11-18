/**
 * Helper functions for fasta strukturen (property structure)
 */

export function getAddressString(adress) {
  if (!adress) return '';

  const parts = [];
  if (adress.adress) parts.push(adress.adress);
  if (adress.postnr && adress.postort) {
    parts.push(`${adress.postnr} ${adress.postort}`);
  } else if (adress.postort) {
    parts.push(adress.postort);
  }

  return parts.join(', ');
}

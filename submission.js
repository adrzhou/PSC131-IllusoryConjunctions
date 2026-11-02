// Public deployment URL, not a secret. The Google Sheet itself remains private.
export const RESULTS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw9_oWz_ebVAJcpn90jaUuM20HsjYsSENpB_7TYYC1GWaKdL2RPGF4TlI1HiPzN50m2/exec';

export function makeSubmission(session, student, records) {
  if (!session || !student.firstName || !student.lastName || !student.email || !records.length || records.length > 32) {
    throw new Error('Student details and at least one completed trial are required.');
  }
  return {session, student: {...student}, records};
}

export async function sendResults(payload, {fetchImpl = globalThis.fetch, timeoutMs = 25000} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // text/plain is a CORS-safelisted content type; the receiver parses its JSON body.
    // Do not use no-cors: an opaque response cannot confirm a write to the Sheet.
    const response = await fetchImpl(RESULTS_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow',
      headers: {'Content-Type': 'text/plain;charset=UTF-8'},
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok || (await response.text()).trim() !== 'Saved') {
      throw new Error('The receiver did not confirm that the results were saved.');
    }
  } finally {
    clearTimeout(timer);
  }
}

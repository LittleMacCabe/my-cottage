// Passes a Google sign-in straight back to the household's own hub.
//
// A household's hub (a gift, opened in their own home) connects its Google
// Calendar from a phone. Google will only send a sign-in back to an address
// registered with it, so it comes here, and this page sends the phone on to
// the hub it started from: the hub's private Tailscale address, written by
// the hub into the sign-in's "state". Nothing is kept or sent anywhere else.
// The one-time code it passes along is useless without a secret only that
// hub holds.

const HUB = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.ts\.net$/;  // a hub's own Tailscale name, and nothing else

/** The hub address to send this sign-in back to, or null if it isn't a hub's. */
export function hubTarget(search) {
  const params = new URLSearchParams(search);
  const state = params.get('state') || '';
  let hub;
  try {
    const base64 = state.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - state.length % 4) % 4);
    hub = JSON.parse(atob(base64)).h;
  } catch {
    return null;
  }
  if (typeof hub !== 'string' || !HUB.test(hub)) return null;
  const back = new URLSearchParams();
  for (const key of ['code', 'state', 'error']) if (params.has(key)) back.set(key, params.get(key));
  return `https://${hub}/api/google/back?${back}`;
}

if (typeof document !== 'undefined') {
  const target = hubTarget(location.search);
  if (target) location.replace(target);
  else document.querySelector('#note').textContent =
    'This page passes a Google sign-in back to your My Cottage hub, but this one didn’t come from a hub. Start again from My Cottage on your phone.';
}

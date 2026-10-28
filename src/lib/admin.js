export function isLocalAdminRequest(request, clientAddress) {
  const hostname = new URL(request.url).hostname.toLowerCase();
  const localHostname = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  const address = String(clientAddress || '').toLowerCase();
  const localClient = address === '::1' || address === '127.0.0.1' || address.endsWith('127.0.0.1');
  return localHostname && localClient;
}

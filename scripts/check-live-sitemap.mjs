async function checkLive() {
  const res = await fetch('https://baemeds.com/sitemap.xml');
  console.log('HTTP Status:', res.status);
  console.log('Server / Cache headers:');
  console.log('  server:', res.headers.get('server'));
  console.log('  x-vercel-id:', res.headers.get('x-vercel-id'));
  console.log('  x-vercel-cache:', res.headers.get('x-vercel-cache'));
  console.log('  cf-cache-status:', res.headers.get('cf-cache-status'));
  console.log('  age:', res.headers.get('age'));
  console.log('  etag:', res.headers.get('etag'));
  const text = await res.text();
  const count = (text.match(/<loc>/g) || []).length;
  console.log('Current URLs in live baemeds.com/sitemap.xml:', count);
}
checkLive();

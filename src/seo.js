export function initSeo() {
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = 'https://432vs440hz.com/';

  document.querySelectorAll('meta[property="og:url"]').forEach((meta) => {
    meta.content = 'https://432vs440hz.com/';
  });

  document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach((meta) => {
    meta.content = 'https://432vs440hz.com/preview.jpg';
  });
}

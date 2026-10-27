/**
 * Carga un script externo probando cada URL en orden hasta que una funcione.
 * Así, si un CDN falla, se usa el siguiente.
 */
export function loadScript(urls) {
  return new Promise((resolve, reject) => {
    let index = 0;

    const tryNext = () => {
      if (index >= urls.length) {
        reject(new Error(`No se pudo cargar ${urls[0]}`));
        return;
      }
      const script = document.createElement("script");
      script.src = urls[index++];
      script.async = false;
      script.onload = () => resolve();
      script.onerror = () => {
        script.remove();
        tryNext();
      };
      document.head.appendChild(script);
    };

    tryNext();
  });
}

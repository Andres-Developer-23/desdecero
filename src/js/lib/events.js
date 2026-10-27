/** Emisor de eventos mínimo para avisar de cambios entre módulos. */
export function createEmitter() {
  const listeners = new Map();

  return {
    /** Suscribe una función a un evento. Devuelve otra función para cancelar. */
    on(event, listener) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(listener);
      return () => listeners.get(event).delete(listener);
    },

    emit(event, payload) {
      for (const listener of listeners.get(event) ?? []) listener(payload);
    },
  };
}

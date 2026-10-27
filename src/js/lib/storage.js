/*
 * Acceso a localStorage que nunca lanza errores.
 * En modo privado, con cookies bloqueadas o dentro de algunos iframes,
 * localStorage no existe o falla: en esos casos la app sigue funcionando
 * y simplemente no recuerda nada entre visitas.
 */

export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* sin almacenamiento disponible */
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* sin almacenamiento disponible */
    }
  },

  getJSON(key) {
    const raw = this.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setJSON(key, value) {
    this.set(key, JSON.stringify(value));
  },
};

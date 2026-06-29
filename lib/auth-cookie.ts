// Nombre de la cookie de sesión. Módulo puro (sin fs ni next/headers) para que
// lo pueda importar el middleware (edge) sin arrastrar dependencias de servidor.
export const COOKIE = "cdp_sesion";

/**
 * Configuración de entorno para el Frontend de Recursos Humanos.
 * El equipo de Backend puede cambiar `useMock: false` y apuntar `apiUrl`
 * a la URL del servidor (Node/Express, Spring Boot, .NET, etc.) cuando esté listo.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  useMock: true,
};

# WebPlataforma

App web para interactuar con el ERP **Plataforma** (Pirkastone) a través de sus Web Services SOAP.
Frontend **Vite + React** + funciones **serverless en `/api`**, pensada para desplegar en **Vercel**.

## Arquitectura

```
Navegador (HTTPS)  ──►  /api/* (Vercel serverless, HTTPS)  ──►  ERP Plataforma (SOAP, HTTP)
```

El proxy serverless es necesario: el ERP responde por **HTTP plano** (`http://wspirkastone.pypcloud.net:1881`),
y un navegador en HTTPS no puede llamarlo directo (bloqueo de *mixed content*). La función server-side sí puede.

## Estado actual (hito 1 — solo lectura)

- `GET /api/health` — verifica conexión con el ERP (`VerificarConexionBD` + conexión por defecto).
- `GET /api/articulos?q=…` — busca artículos por nombre, código de empresa o ID.
- `GET /api/stock?ids=666,667` — stock por depósito (físico, reservado, a ingresar/egresar).
- Frontend: buscador de artículos + panel de stock por depósito.

## Desarrollo local

```bash
npm run install:all   # o: npm install
npm run dev           # Vite en http://localhost:5173, con /api emulado localmente
```

> El plugin `apiDevServer` (en `vite.config.js`) hace correr las funciones de `/api`
> localmente sin necesidad del Vercel CLI. También podés usar `vercel dev` si preferís.

## Deploy en Vercel

1. Subir el repo a GitHub e importarlo en Vercel (framework: **Vite**, detectado solo).
2. (Opcional) Variables de entorno según `.env.example`.
3. Deploy. Verificar en `/api/health` que `conexionOk: true`.

> ⚠️ **Alcance de red:** confirmar que las funciones de Vercel (nube) alcancen
> `wspirkastone.pypcloud.net:1881`. Si el ERP solo es accesible dentro de la red/VPN de la
> empresa, el deploy en Vercel no llegará y habría que usar otra estrategia (host propio / túnel).

## El ERP en resumen

- SOAP ASMX sobre IIS. Namespace `http://plataforma.net.ar/`. Conexión por defecto: **PIRKA**.
- Sin header de autenticación (seguridad a nivel de red). `ServicioAuthenticate` está roto en el server pero no hace falta.
- Lectura confirmada: **1119 artículos**. Servicio principal de este hito: `ServicioSTOCArticulo`.
- Comparadores de filtro (enum): `Equals`, `Distinct`, `LikeLeft`, `LikeRight`, `LikeFull` (contiene),
  `GreaterThan`, `GreaterOrEqualsThan`, `LowerThan`, `LowerOrEqualsThan`, `Null`, `In`, `NotIn`.

### Próximos hitos
- **Fase 2 (lectura):** clientes (`ServicioCCOCliente`), listas de precios, notas de pedido, cuenta corriente.
- **Fase 3 (escritura):** alta/modificación de clientes y creación de notas de pedido vía `ServiciosIMAC`,
  usando siempre los métodos `Validar*` (validan sin persistir) antes de grabar en producción.

// ============================================================================
//  CONFIGURACIÓN DE FILTROS DE BÚSQUEDA DE ARTÍCULOS
// ----------------------------------------------------------------------------
//  Este es el ÚNICO archivo que tenés que tocar para elegir qué filtros
//  aparecen en la pantalla de búsqueda.
//
//    habilitado: true   -> el filtro se muestra en la pantalla
//    habilitado: false  -> el filtro NO se muestra (queda oculto)
//
//  Podés además:
//    - cambiar "label" para que se vea más lindo en pantalla
//    - "tipo" define qué control se muestra (texto / número / sí-no / fecha)
//      y qué comparadores se ofrecen. No lo cambies salvo que sepas el tipo real.
//    - "columna: true" significa que ese atributo también puede mostrarse como
//      dato en los resultados (casi todos pueden; NovedadFecha es solo filtro).
//
//  Tras editar este archivo: commit + push y Vercel redepliega solo.
// ============================================================================

export const CATALOGO_FILTROS = [
  { atributo: "ArticuloID",                                        label: "ID",                              tipo: "int",      columna: true,  habilitado: true },
  { atributo: "Nombre",                                            label: "Nombre",                          tipo: "string",   columna: true,  habilitado: true },
  { atributo: "ArticuloEmpresa",                                   label: "Código empresa",                  tipo: "string",   columna: true,  habilitado: true },
  { atributo: "ArticuloParaImpresion",                             label: "Cód. impresión",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "TipoDeArticulo",                                    label: "Tipo de artículo",                tipo: "string",   columna: true,  habilitado: true },
  { atributo: "Descripcion",                                       label: "Descripción",                     tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion1Articulos",                           label: "Clasificación 1",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion2Articulos",                           label: "Clasificación 2",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion3Articulos",                           label: "Clasificación 3",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion4Articulos",                           label: "Clasificación 4",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion5Articulos",                           label: "Clasificación 5",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion6Articulos",                           label: "Clasificación 6",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion7Articulos",                           label: "Clasificación 7",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion8Articulos",                           label: "Clasificación 8",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion9Articulos",                           label: "Clasificación 9",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion10Articulos",                          label: "Clasificación 10",                tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion11Articulos",                          label: "Clasificación 11",                tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion12Articulos",                          label: "Clasificación 12",                tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion13Articulos",                          label: "Clasificación 13",                tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion14Articulos",                          label: "Clasificación 14",                tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion15Articulos",                          label: "Clasificación 15",                tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Clasificacion16Articulos",                          label: "Clasificación 16",                tipo: "string",   columna: true,  habilitado: false },
  { atributo: "UnidadDeMedidaDeStock",                             label: "UM de stock",                     tipo: "string",   columna: true,  habilitado: false },
  { atributo: "CodigoDeBarraPorUnidadDeMedidaDeStock",             label: "Código de barra",                 tipo: "string",   columna: true,  habilitado: false },
  { atributo: "SeControlaStock",                                   label: "Controla stock",                  tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "SeAdministraConPartidas",                           label: "Con partidas",                    tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "SeAdministraConNumerosDeSerie",                     label: "Con números de serie",            tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "SeAdministraPorTalles",                             label: "Por talles",                      tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "SeVende",                                           label: "Se vende",                        tipo: "boolean",  columna: true,  habilitado: true },
  { atributo: "SeCompra",                                          label: "Se compra",                       tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "FechaDeAlta",                                       label: "Fecha de alta",                   tipo: "date",     columna: true,  habilitado: false },
  { atributo: "FechaDeBaja",                                       label: "Fecha de baja",                   tipo: "date",     columna: true,  habilitado: false },
  { atributo: "BloqueadoParaMovimientosDeStock",                   label: "Bloqueado p/ mov. stock",         tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "PesoEmbaladoPorUnidadDeMedidaDeStock",              label: "Peso embalado",                   tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "CantidadPorUnidadDeMedidaDeStockPorBulto",          label: "Cant. por bulto",                 tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "UnidadDeMedidaHomogeneaDeStock",                    label: "UM homogénea",                    tipo: "string",   columna: true,  habilitado: false },
  { atributo: "FactorDeConversionUnidadDeMedidaHomogeneaDeStock",  label: "Factor UM homogénea",             tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "CuentaDeActivo",                                    label: "Cuenta de activo",                tipo: "string",   columna: true,  habilitado: false },
  { atributo: "SeProduce",                                         label: "Se produce",                      tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "ModoDeConsumoDeComponentes",                        label: "Modo consumo comp.",              tipo: "int",      columna: true,  habilitado: false },
  { atributo: "ModalidadDeStockMinimo",                            label: "Modalidad stock mínimo",          tipo: "int",      columna: true,  habilitado: false },
  { atributo: "StockMinimoParaModalidadPorCantidadFija",           label: "Stock mínimo (cant. fija)",       tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "GeneraMovimientosDeStock",                          label: "Genera mov. stock",               tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "ClasificadorVariablePorUnidadDeMedidaDeArticulo",   label: "Clasif. variable por UM",         tipo: "string",   columna: true,  habilitado: false },
  { atributo: "PorcentajeDeDesvioMaximoParaAjusteManualDeConsAutoDeOF", label: "% desvío máx. ajuste OF",     tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "AdministraPrecioPromedioPonderado",                 label: "Precio prom. ponderado",          tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "AjustaCantidadesEnUMDeStockCalculadasPorElSistema", label: "Ajusta cant. UM stock",           tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "PorcentajeMaximoDeAjusteDeCantidadEnUMDeStock",     label: "% máx. ajuste cant.",             tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "SeCosteaPorCierreMensual",                          label: "Costea por cierre mensual",       tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "Talle",                                             label: "Talle",                           tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Color",                                             label: "Color",                           tipo: "string",   columna: true,  habilitado: false },
  { atributo: "DivisionParaAsientoDeCosteoPorCierre",              label: "División asiento costeo",         tipo: "int",      columna: true,  habilitado: false },
  { atributo: "EspecieDeGranoONCCA",                               label: "Especie grano ONCCA",             tipo: "int",      columna: true,  habilitado: false },
  { atributo: "TipoDeGranoONCCA",                                  label: "Tipo grano ONCCA",                tipo: "int",      columna: true,  habilitado: false },
  { atributo: "VariedadDeGrano",                                   label: "Variedad de grano",               tipo: "int",      columna: true,  habilitado: false },
  { atributo: "CuentaDeAnticipoLiquidacionCompraCereal",           label: "Cta. anticipo cereal",            tipo: "string",   columna: true,  habilitado: false },
  { atributo: "CodigoDeProductoCOT",                               label: "Código producto COT",             tipo: "string",   columna: true,  habilitado: false },
  { atributo: "UnidadDeMedidaCOT",                                 label: "UM COT",                          tipo: "string",   columna: true,  habilitado: false },
  { atributo: "FactorDeConversionCOT",                             label: "Factor conversión COT",           tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "VolumenEmbaladoPorUnidadDeMedidaDeStock",           label: "Volumen embalado",                tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "UnidadDeMedidaParaDimensionesDelArticulo",          label: "UM dimensiones",                  tipo: "string",   columna: true,  habilitado: false },
  { atributo: "Largo",                                             label: "Largo",                           tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "Ancho",                                             label: "Ancho",                           tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "Alto",                                              label: "Alto",                            tipo: "decimal",  columna: true,  habilitado: false },
  { atributo: "BloqueadoParaVenta",                                label: "Bloqueado para venta",            tipo: "boolean",  columna: true,  habilitado: false },
  { atributo: "FechaDeBajaParaVentas",                             label: "Fecha baja ventas",               tipo: "date",     columna: true,  habilitado: false },
  { atributo: "NovedadFecha",                                      label: "Modificado desde",                tipo: "date",     columna: false, habilitado: true },
];

// Comparadores válidos (enum del WSDL) ofrecidos según el tipo de dato.
export const COMPARADORES_POR_TIPO = {
  string:  ["LikeFull", "LikeLeft", "LikeRight", "Equals", "Distinct"],
  int:     ["Equals", "Distinct", "GreaterThan", "GreaterOrEqualsThan", "LowerThan", "LowerOrEqualsThan"],
  decimal: ["Equals", "Distinct", "GreaterThan", "GreaterOrEqualsThan", "LowerThan", "LowerOrEqualsThan"],
  boolean: ["Equals", "Distinct"],
  date:    ["GreaterOrEqualsThan", "GreaterThan", "LowerOrEqualsThan", "LowerThan", "Equals"],
};

// Etiquetas legibles para los comparadores.
export const LABEL_COMPARADOR = {
  LikeFull: "contiene",
  LikeLeft: "empieza con",
  LikeRight: "termina con",
  Equals: "igual a",
  Distinct: "distinto de",
  GreaterThan: "mayor que",
  GreaterOrEqualsThan: "mayor o igual",
  LowerThan: "menor que",
  LowerOrEqualsThan: "menor o igual",
  Null: "es nulo",
  In: "en lista",
  NotIn: "no en lista",
};

// ---- Helpers ---------------------------------------------------------------
const porAtributo = new Map(CATALOGO_FILTROS.map((f) => [f.atributo, f]));

/** Filtros marcados como habilitados (los que se muestran en pantalla). */
export function filtrosHabilitados() {
  return CATALOGO_FILTROS.filter((f) => f.habilitado);
}

/** ¿El atributo es una columna visible válida del ERP? */
export function esColumnaValida(atributo) {
  const f = porAtributo.get(atributo);
  return !!(f && f.columna);
}

/** Comparador por defecto sugerido para un tipo. */
export function comparadorPorDefecto(tipo) {
  return (COMPARADORES_POR_TIPO[tipo] || COMPARADORES_POR_TIPO.string)[0];
}

/** Devuelve la definición de un filtro por su atributo (o undefined). */
export function definicionFiltro(atributo) {
  return porAtributo.get(atributo);
}

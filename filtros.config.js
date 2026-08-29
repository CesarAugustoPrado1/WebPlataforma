// ============================================================================
//  CONFIGURACIÓN DE FILTROS DE BÚSQUEDA DE ARTÍCULOS
// ----------------------------------------------------------------------------
//  Único archivo a tocar para elegir qué filtros aparecen en el panel "Filtros".
//
//    habilitado: true   -> el filtro se muestra en el panel de filtros
//    habilitado: false  -> el filtro NO se muestra
//
//  Campos de cada filtro:
//    - label      : texto que se ve en pantalla (editable a gusto)
//    - tipo       : string | int | decimal | boolean | date
//                   define el control y los comparadores disponibles.
//    - opciones   : "lista" -> valores elegibles en un desplegable
//                             (se cargan del ERP vía /api/valores)
//                   "texto" -> se escribe el valor a mano
//    - nombreAttr : (solo opciones "lista") atributo que aporta la etiqueta
//                   legible del valor. "__tipos__" = usa ObtenerTiposArticulos.
//                   null = el valor no tiene nombre asociado (se muestra el código).
//    - columna    : si el atributo puede mostrarse como dato en los resultados.
//
//  Tras editar: commit + push y Vercel redepliega solo.
// ============================================================================

export const CATALOGO_FILTROS = [
  { atributo: "ArticuloID", label: "ID", tipo: "int", opciones: "texto", columna: true, habilitado: true },
  { atributo: "Nombre", label: "Nombre", tipo: "string", opciones: "texto", columna: true, habilitado: true },
  { atributo: "ArticuloEmpresa", label: "Código empresa", tipo: "string", opciones: "texto", columna: true, habilitado: true },
  { atributo: "ArticuloParaImpresion", label: "Cód. impresión", tipo: "string", opciones: "texto", columna: true, habilitado: false },
  { atributo: "TipoDeArticulo", label: "Tipo de artículo", tipo: "string", opciones: "lista", nombreAttr: "__tipos__", columna: true, habilitado: true },
  { atributo: "Descripcion", label: "Descripción", tipo: "string", opciones: "texto", columna: true, habilitado: false },
  { atributo: "Clasificacion1Articulos", label: "Clasificación 1", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion1ArticulosNombre", columna: true, habilitado: true },
  { atributo: "Clasificacion2Articulos", label: "Clasificación 2", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion2ArticulosNombre", columna: true, habilitado: true },
  { atributo: "Clasificacion3Articulos", label: "Clasificación 3", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion3ArticulosNombre", columna: true, habilitado: true },
  { atributo: "Clasificacion4Articulos", label: "Clasificación 4", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion4ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion5Articulos", label: "Clasificación 5", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion5ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion6Articulos", label: "Clasificación 6", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion6ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion7Articulos", label: "Clasificación 7", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion7ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion8Articulos", label: "Clasificación 8", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion8ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion9Articulos", label: "Clasificación 9", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion9ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion10Articulos", label: "Clasificación 10", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion10ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion11Articulos", label: "Clasificación 11", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion11ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion12Articulos", label: "Clasificación 12", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion12ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion13Articulos", label: "Clasificación 13", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion13ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion14Articulos", label: "Clasificación 14", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion14ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion15Articulos", label: "Clasificación 15", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion15ArticulosNombre", columna: true, habilitado: false },
  { atributo: "Clasificacion16Articulos", label: "Clasificación 16", tipo: "string", opciones: "lista", nombreAttr: "Clasificacion16ArticulosNombre", columna: true, habilitado: false },
  { atributo: "UnidadDeMedidaDeStock", label: "UM de stock", tipo: "string", opciones: "lista", nombreAttr: "UnidadDeMedidaDeStockNombre", columna: true, habilitado: true },
  { atributo: "CodigoDeBarraPorUnidadDeMedidaDeStock", label: "Código de barra", tipo: "string", opciones: "texto", columna: true, habilitado: false },
  { atributo: "SeControlaStock", label: "Controla stock", tipo: "boolean", opciones: "texto", columna: true, habilitado: true },
  { atributo: "SeAdministraConPartidas", label: "Con partidas", tipo: "boolean", opciones: "texto", columna: true, habilitado: false },
  { atributo: "SeAdministraConNumerosDeSerie", label: "Se administra con numeros de serie", tipo: "boolean", opciones: "texto", columna: true, habilitado: false },
  { atributo: "SeAdministraPorTalles", label: "Por talles", tipo: "boolean", opciones: "texto", columna: true, habilitado: false },
  { atributo: "SeVende", label: "Se vende", tipo: "boolean", opciones: "texto", columna: true, habilitado: true },
  { atributo: "SeCompra", label: "Se compra", tipo: "boolean", opciones: "texto", columna: true, habilitado: true },
  { atributo: "FechaDeAlta", label: "Fecha de alta", tipo: "date", opciones: "texto", columna: true, habilitado: false },
  { atributo: "FechaDeBaja", label: "Fecha de baja", tipo: "date", opciones: "texto", columna: true, habilitado: false },
  { atributo: "BloqueadoParaMovimientosDeStock", label: "Bloqueado mov. stock", tipo: "boolean", opciones: "texto", columna: true, habilitado: false },
  { atributo: "PesoEmbaladoPorUnidadDeMedidaDeStock", label: "Peso embalado por unidad de medida de stock", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "CantidadPorUnidadDeMedidaDeStockPorBulto", label: "Cantidad por unidad de medida de stock por bulto", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "UnidadDeMedidaHomogeneaDeStock", label: "UM homogénea", tipo: "string", opciones: "lista", nombreAttr: "UnidadDeMedidaHomogeneaDeStockNombre", columna: true, habilitado: false },
  { atributo: "FactorDeConversionUnidadDeMedidaHomogeneaDeStock", label: "Factor de conversion unidad de medida homogenea de stock", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "CuentaDeActivo", label: "Cuenta de activo", tipo: "string", opciones: "texto", columna: true, habilitado: false },
  { atributo: "SeProduce", label: "Se produce", tipo: "boolean", opciones: "texto", columna: true, habilitado: false },
  { atributo: "ModoDeConsumoDeComponentes", label: "Modo de consumo de componentes", tipo: "int", opciones: "texto", columna: true, habilitado: false },
  { atributo: "ModalidadDeStockMinimo", label: "Modalidad de stock minimo", tipo: "int", opciones: "texto", columna: true, habilitado: false },
  { atributo: "StockMinimoParaModalidadPorCantidadFija", label: "Stock minimo para modalidad por cantidad fija", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "GeneraMovimientosDeStock", label: "Genera mov. stock", tipo: "boolean", opciones: "texto", columna: true, habilitado: false },
  { atributo: "ClasificadorVariablePorUnidadDeMedidaDeArticulo", label: "Clasif. variable UM", tipo: "string", opciones: "lista", nombreAttr: "ClasificadorVariablePorUnidadDeMedidaDeArticuloNombre", columna: true, habilitado: false },
  { atributo: "PorcentajeDeDesvioMaximoParaAjusteManualDeConsAutoDeOF", label: "Porcentaje de desvio maximo para ajuste manual de cons auto de of", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "AdministraPrecioPromedioPonderado", label: "Administra precio promedio ponderado", tipo: "boolean", opciones: "texto", columna: true, habilitado: false },
  { atributo: "AjustaCantidadesEnUMDeStockCalculadasPorElSistema", label: "Ajusta cantidades en umde stock calculadas por el sistema", tipo: "boolean", opciones: "texto", columna: true, habilitado: false },
  { atributo: "PorcentajeMaximoDeAjusteDeCantidadEnUMDeStock", label: "Porcentaje maximo de ajuste de cantidad en umde stock", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "SeCosteaPorCierreMensual", label: "Se costea por cierre mensual", tipo: "boolean", opciones: "texto", columna: true, habilitado: false },
  { atributo: "Talle", label: "Talle", tipo: "string", opciones: "lista", nombreAttr: "TalleNombre", columna: true, habilitado: false },
  { atributo: "Color", label: "Color", tipo: "string", opciones: "lista", nombreAttr: "ColorNombre", columna: true, habilitado: false },
  { atributo: "DivisionParaAsientoDeCosteoPorCierre", label: "Division para asiento de costeo por cierre", tipo: "int", opciones: "texto", columna: true, habilitado: false },
  { atributo: "EspecieDeGranoONCCA", label: "Especie de grano oncca", tipo: "int", opciones: "texto", columna: true, habilitado: false },
  { atributo: "TipoDeGranoONCCA", label: "Tipo de grano oncca", tipo: "int", opciones: "texto", columna: true, habilitado: false },
  { atributo: "VariedadDeGrano", label: "Variedad de grano", tipo: "int", opciones: "texto", columna: true, habilitado: false },
  { atributo: "CuentaDeAnticipoLiquidacionCompraCereal", label: "Cuenta de anticipo liquidacion compra cereal", tipo: "string", opciones: "texto", columna: true, habilitado: false },
  { atributo: "CodigoDeProductoCOT", label: "Cód. producto COT", tipo: "string", opciones: "lista", nombreAttr: "CodigoDeProductoCOTNombre", columna: true, habilitado: false },
  { atributo: "UnidadDeMedidaCOT", label: "UM COT", tipo: "string", opciones: "lista", nombreAttr: null, columna: true, habilitado: false },
  { atributo: "FactorDeConversionCOT", label: "Factor de conversion cot", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "VolumenEmbaladoPorUnidadDeMedidaDeStock", label: "Volumen embalado por unidad de medida de stock", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "UnidadDeMedidaParaDimensionesDelArticulo", label: "UM dimensiones", tipo: "string", opciones: "lista", nombreAttr: "UnidadDeMedidaParaDimensionesDelArticuloNombre", columna: true, habilitado: false },
  { atributo: "Largo", label: "Largo", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "Ancho", label: "Ancho", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "Alto", label: "Alto", tipo: "decimal", opciones: "texto", columna: true, habilitado: false },
  { atributo: "BloqueadoParaVenta", label: "Bloqueado para venta", tipo: "boolean", opciones: "texto", columna: true, habilitado: false },
  { atributo: "FechaDeBajaParaVentas", label: "Fecha baja ventas", tipo: "date", opciones: "texto", columna: true, habilitado: false },
  { atributo: "NovedadFecha", label: "Modificado desde", tipo: "date", opciones: "texto", columna: false, habilitado: true },];

// Comparadores válidos (enum del WSDL) ofrecidos según el tipo de dato.
export const COMPARADORES_POR_TIPO = {
  string:  ["LikeFull", "LikeLeft", "LikeRight", "Equals", "Distinct"],
  int:     ["Equals", "Distinct", "GreaterThan", "GreaterOrEqualsThan", "LowerThan", "LowerOrEqualsThan"],
  decimal: ["Equals", "Distinct", "GreaterThan", "GreaterOrEqualsThan", "LowerThan", "LowerOrEqualsThan"],
  boolean: ["Equals", "Distinct"],
  date:    ["GreaterOrEqualsThan", "GreaterThan", "LowerOrEqualsThan", "LowerThan", "Equals"],
};

export const LABEL_COMPARADOR = {
  LikeFull: "contiene", LikeLeft: "empieza con", LikeRight: "termina con",
  Equals: "igual a", Distinct: "distinto de",
  GreaterThan: "mayor que", GreaterOrEqualsThan: "mayor o igual",
  LowerThan: "menor que", LowerOrEqualsThan: "menor o igual",
  Null: "es nulo", In: "en lista", NotIn: "no en lista",
};

// ---- Helpers ---------------------------------------------------------------
const porAtributo = new Map(CATALOGO_FILTROS.map((f) => [f.atributo, f]));

/** Filtros habilitados (los que se muestran en el panel de filtros). */
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

/** Definición de un filtro por su atributo (o undefined). */
export function definicionFiltro(atributo) {
  return porAtributo.get(atributo);
}

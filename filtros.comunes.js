// Constantes comunes a los filtros de todas las entidades (artículos, clientes, pedidos).

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

/** Comparador por defecto sugerido para un tipo. */
export function comparadorPorDefecto(tipo) {
  return (COMPARADORES_POR_TIPO[tipo] || COMPARADORES_POR_TIPO.string)[0];
}

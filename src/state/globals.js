// Icono pixel-art elegido por el usuario para el tipo de entrada activo (piel del
// mundo actual). App lo actualiza en cada render; EntryIcon lo lee sin necesitar
// que `skin` se perfore como prop por todos los componentes que dibujan iconos.
export let activeIconOverrides = {};

// Elementos (Fuego/Hielo/etc.) configurables por el usuario para habilidades.
// Mismo truco que activeIconOverrides: variable de módulo para leer/escribir
// sin perforar la prop por todo el árbol de bloques del lienzo.
export let activeElements = [];

export let setActiveElements = () => {};

// Mismo truco para roles de clase y tipos de arma/armadura.
export let activeRoles = [];

export let setActiveRoles = () => {};

export let activeWeaponTypes = [];

export let setActiveWeaponTypes = () => {};

export let activeArmorTypes = [];

export let setActiveArmorTypes = () => {};

export let activeStatusEffects = [];

export let setActiveStatusEffects = () => {};

export function syncActiveGlobals({ iconOverrides, elements, updateElements, roles, updateRoles, weaponTypes, updateWeaponTypes, armorTypes, updateArmorTypes, statusEffects, updateStatusEffects }) {
  activeIconOverrides = iconOverrides;
  activeElements = elements;
  setActiveElements = updateElements;
  activeRoles = roles;
  setActiveRoles = updateRoles;
  activeWeaponTypes = weaponTypes;
  setActiveWeaponTypes = updateWeaponTypes;
  activeArmorTypes = armorTypes;
  setActiveArmorTypes = updateArmorTypes;
  activeStatusEffects = statusEffects;
  setActiveStatusEffects = updateStatusEffects;
}

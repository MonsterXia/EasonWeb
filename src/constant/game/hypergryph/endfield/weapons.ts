// Compatibility entry: all factual data lives in catalog.json.
import type { WeaponData, WeaponBaseMaterialRegion } from './index'
export { endfieldWeapons, endfieldWeaponBaseMaterialRegion } from './index'
export type { WeaponData, WeaponBaseMaterialRegion } from './index'

// 武器与淤积点使用同一套基质词条；三星武器没有附加属性限制。
export const weaponMatchesRegion = (
  weapon: WeaponData,
  region: WeaponBaseMaterialRegion,
): boolean =>
  region.attribute1Array.includes(weapon.attribute1) &&
  (weapon.attribute2 === null || region.attribute2Array.includes(weapon.attribute2)) &&
  region.skillTypeArray.includes(weapon.skill.type)

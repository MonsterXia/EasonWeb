import rawData from './catalog.json'

export type GrowthKind = 'characters' | 'weapons'
export type LocalName = { 'zh-CN': string; en: string }
export type Materials = [string, number][]
export interface GrowthEntity {
  id: string
  name: LocalName
  rarity: number
  weaponType: string
  element?: string
  profession?: string
  avatar?: string
  levels: [number, number][]
  promotions: { stage: number; level: number; materials: Materials }[]
  equipment: { stage: number; materials: Materials }[]
  skills: { id: string; name: LocalName; type: string; icon?: string; costs: Materials[] }[]
  nodes: {
    id: string
    group: string
    chain: string
    name: LocalName
    stage: number
    icon?: string
    rank?: string
    materials: Materials
  }[]
}

export interface EssenceAttributes {
  attribute1: string
  attribute2: string | null
  skill: { type: string; name: string }
}
export interface EndfieldWeapon extends GrowthEntity {
  essence: EssenceAttributes
  essenceOrder: number
}
export interface WeaponData extends EssenceAttributes {
  id: string
  name: string
  type: string
  rarity: number
}
export interface WeaponBaseMaterialRegion {
  region: string
  attribute1Array: string[]
  attribute2Array: string[]
  skillTypeArray: string[]
}
export interface EndfieldCatalog {
  version: string
  updatedAt: string
  characters: GrowthEntity[]
  weapons: EndfieldWeapon[]
  materials: Record<string, { name: LocalName; iconId?: string; rarity?: number }>
  filters: Record<'elements' | 'professions' | 'weaponTypes', Record<string, LocalName>>
  regions: WeaponBaseMaterialRegion[]
  experienceGroups: { high: string; exp: number; low: { id: string; exp: number }[] }[]
}
// Both calculators read the same entities. Names are display data, IDs are join keys.
export const endfieldData = rawData as unknown as EndfieldCatalog
export const weaponById = new Map(endfieldData.weapons.map((weapon) => [weapon.id, weapon]))
export const endfieldWeaponBaseMaterialRegion = endfieldData.regions
// Preserve the essence selector's established order and canonical Chinese matching terms.
export const endfieldWeapons: WeaponData[] = [...endfieldData.weapons]
  .sort((a, b) => a.essenceOrder - b.essenceOrder)
  .map((weapon) => ({
    id: weapon.id,
    name: weapon.name['zh-CN'],
    type: endfieldData.filters.weaponTypes[weapon.weaponType]!['zh-CN'],
    rarity: weapon.rarity,
    ...weapon.essence,
  }))

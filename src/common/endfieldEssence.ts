import {
  endfieldWeaponBaseMaterialRegion,
  weaponMatchesRegion,
  type WeaponBaseMaterialRegion,
  type WeaponData,
} from '../constant/game/hypergryph/endfield/weapons'

export interface EssencePlan {
  region: WeaponBaseMaterialRegion
  primaryAttributes: string[]
  skillType: string
  coveredWeapons: WeaponData[]
}

export function weaponMatchesEssencePlan(
  weapon: WeaponData,
  plan: Omit<EssencePlan, 'coveredWeapons'>,
) {
  return (
    weaponMatchesRegion(weapon, plan.region) &&
    plan.primaryAttributes.includes(weapon.attribute1) &&
    weapon.skill.type === plan.skillType
  )
}

export function recommendEssencePlan(
  weapons: WeaponData[],
  regions = endfieldWeaponBaseMaterialRegion,
): EssencePlan | null {
  let best: EssencePlan | null = null
  for (const region of regions) {
    const eligible = weapons.filter((weapon) => weaponMatchesRegion(weapon, region))
    for (const skillType of new Set(eligible.map((weapon) => weapon.skill.type))) {
      const counts = new Map<string, number>()
      for (const weapon of eligible.filter((weapon) => weapon.skill.type === skillType)) {
        counts.set(weapon.attribute1, (counts.get(weapon.attribute1) ?? 0) + 1)
      }
      // For a fixed region and skill, the three most frequent primary attributes
      // maximize actual coverage. Stable order resolves ties without random changes.
      const primaryAttributes = [...counts]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([attribute]) => attribute)
      const plan = { region, primaryAttributes, skillType }
      const coveredWeapons = weapons.filter((weapon) => weaponMatchesEssencePlan(weapon, plan))
      if (!best || coveredWeapons.length > best.coveredWeapons.length) {
        best = { ...plan, coveredWeapons }
      }
    }
  }
  return best
}

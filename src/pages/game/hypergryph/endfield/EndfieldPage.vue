<script lang="ts" setup>
import { endfieldWeaponBaseMaterialRegion, endfieldWeapons, type WeaponBaseMaterialRegion, type WeaponData } from '@/constant/game/hypergryph/endfield/weapons';
import { ref, watch } from 'vue';
const currentSelectWeapon = ref<string>('')
const options = endfieldWeapons.map(item => ({
    label: item.name,
    value: item
}))

const selectedWeapons = ref<WeaponData[]>([])

const addWeapon = (): void => {
    if (!currentSelectWeapon.value) {
        return
    }
    const weapon = endfieldWeapons.find(w => w.name === currentSelectWeapon.value)
    if (weapon && !selectedWeapons.value.find(w => w.name === weapon.name)) {
        selectedWeapons.value.push(weapon)
    }
}

const deleteWeapon = (weapon: WeaponData): void => {
    selectedWeapons.value = selectedWeapons.value.filter(w => w.name !== weapon.name)
}

const attributeOptions = ref<any>({
    attribute1Array: new Map<string, number>(),
    attribute2Array: new Map<string, number>(),
    skillTypeArray: new Map<string, number>(),
})

const mainSelectedAttribute1 = ref<([string, number] | null)[]>([])
const mainSelectedSkillType = ref<[string, number] | null>(null)
const selectedMap = ref<WeaponBaseMaterialRegion | null>(null)


watch(selectedWeapons, (newVal) => {
    let attribute1HashMap = new Map<string, number>()
    let attribute2HashMap = new Map<string, number>()
    let skillTypeHashMap = new Map<string, number>()

    newVal.forEach(weapon => {
        attribute1HashMap.set(weapon.attribute1, (attribute1HashMap.get(weapon.attribute1) || 0) + 1)
        if (weapon.attribute2) {
            attribute2HashMap.set(weapon.attribute2, (attribute2HashMap.get(weapon.attribute2) || 0) + 1)
        }
        skillTypeHashMap.set(weapon.skill.type, (skillTypeHashMap.get(weapon.skill.type) || 0) + 1)
    })

    attributeOptions.value = {
        attribute1Array: attribute1HashMap,
        attribute2Array: attribute2HashMap,
        skillTypeArray: skillTypeHashMap,
    }

    const sortedAttribute1Array = new Map([...attribute1HashMap.entries()].sort((a, b) => b[1] - a[1]))
    const sortedAttribute2Array = new Map([...attribute2HashMap.entries()].sort((a, b) => b[1] - a[1]))
    const sortedSkillTypeArray = new Map([...skillTypeHashMap.entries()].sort((a, b) => b[1] - a[1]))

    mainSelectedAttribute1.value = Array.from(sortedAttribute1Array.entries()).filter((_, index) => index < 3) || []
    mainSelectedSkillType.value = Array.from(sortedSkillTypeArray)[0] || null

    let fieltedRegion: WeaponBaseMaterialRegion[] | null = endfieldWeaponBaseMaterialRegion.filter(region => {
        return region.skillTypeArray.includes(mainSelectedSkillType.value?.[0] || '')
    })

    let findRegion = false
    for (let i = 0; i < sortedAttribute2Array.size; i++) {
        const attribute2 = Array.from(sortedAttribute2Array)[i]![0]
        let tempfieltedRegion = fieltedRegion!.find(region => region.attribute2Array.includes(attribute2))
        if (tempfieltedRegion) {
            selectedMap.value = tempfieltedRegion
            findRegion = true
            break
        }
    }

    if (!findRegion) {
        selectedMap.value = fieltedRegion && fieltedRegion.length > 0 ? fieltedRegion[0]! : null
    }
}, { deep: true });
</script>

<template>
    <el-card>
        <template #header>
            基质计算器
        </template>

        <el-select v-model="currentSelectWeapon" filterable placeholder="Select" style="width: 240px">
            <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.label" />
        </el-select>
        <el-button type="primary" @click="addWeapon"> 添加 </el-button>

        <div class="flex gap-2">
            <el-tag v-if="selectedWeapons.length !== 0" v-for="weapon in selectedWeapons" :key="weapon.name" closable
                type="info" plain round @close="deleteWeapon(weapon)">
                <span :class="[`rarity-${weapon.rarity}`]"> {{ weapon.name }} </span>
            </el-tag>
            <p v-else>
                None
            </p>
        </div>

        <div>
            <hr />
            <p>主属性</p>
            <div v-for="item in attributeOptions.attribute1Array" :key="item[0]">
                {{ item[0] }}: {{ item[1] }}
            </div>
            <hr />
        </div>

        <div>
            <p>副属性</p>
            <div v-for="item in attributeOptions.attribute2Array" :key="item[0]">
                {{ item[0] }}: {{ item[1] }}
            </div>
            <hr />
        </div>

        <div>
            <p>技能</p>
            <div v-for="item in attributeOptions.skillTypeArray" :key="item[0]">
                {{ item[0] }}: {{ item[1] }}
            </div>
            <hr />
        </div>


        <div>
            主属性类型:
            {{ mainSelectedAttribute1 }}
        </div>
        <div>
            选择技能类型:
            {{ mainSelectedSkillType }}
        </div>
        <div>
            选择地图:
            {{ selectedMap?.region }}
        </div>
    </el-card>
</template>

<style scoped>
.rarity-3 {
    color: #26bafb;
}

.rarity-4 {
    color: #9451f8;
}

.rarity-5 {
    color: #ff9a03;
}

.rarity-6 {
    color: #ff7000;
}
</style>
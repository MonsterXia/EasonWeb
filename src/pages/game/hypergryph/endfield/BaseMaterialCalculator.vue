<script lang="ts" setup>
import {
    endfieldWeaponBaseMaterialRegion,
    endfieldWeapons,
    type WeaponBaseMaterialRegion,
    type WeaponData,
} from "@/constant/game/hypergryph/endfield/weapons";
import { computed, ref, watch } from "vue";
const currentSelectWeapon = ref<string>("");
const options = endfieldWeapons.map((item) => ({
    label: item.name,
    value: item,
}));

const selectedWeapons = ref<WeaponData[]>([]);

const addWeapon = (): void => {
    if (!currentSelectWeapon.value) {
        return;
    }
    const weapon = endfieldWeapons.find(
        (w) => w.name === currentSelectWeapon.value
    );
    if (weapon && !selectedWeapons.value.find((w) => w.name === weapon.name)) {
        selectedWeapons.value.push(weapon);
    }
};

const deleteWeapon = (weapon: WeaponData): void => {
    selectedWeapons.value = selectedWeapons.value.filter(
        (w) => w.name !== weapon.name
    );
};

const attributeOptions = ref<any>({
    attribute1Array: new Map<string, number>(),
    attribute2Array: new Map<string, number>(),
    skillTypeArray: new Map<string, number>(),
});

const mainSelectedAttribute1 = ref<([string, number] | null)[]>([]);
const mainSelectedSkillType = ref<[string, number] | null>(null);
const selectedMap = ref<WeaponBaseMaterialRegion | null>(null);
const currentMapContainsWeapons = ref<WeaponData[]>([]);

const mainAttributesRecommands = computed((): string => {
    return mainSelectedAttribute1.value
        .map((item) => (item ? item[0] : ""))
        .join(" ");
});

const currentMapContainsWeaponsNames = (weapon: WeaponData): string => {
    if (currentMapContainsWeapons.value.find((w) => w.name === weapon.name)) {
        return "primary";
    } else {
        return "info";
    }
};

const skill2TypeMatch = (weapon: WeaponData, region: WeaponBaseMaterialRegion): boolean => {
    let skill2Name = weapon.attribute2;
    if (!skill2Name) {
        return true;
    }

    if (skill2Name === '源石技艺强度提升') {
        skill2Name = '源石技艺提升';
    } else if (skill2Name === '终结技充能效率提升') {
        skill2Name = '终结技效率提升';
    }

    return region.attribute2Array.includes(skill2Name);
};

watch(
    selectedWeapons,
    (newVal) => {
        let attribute1HashMap = new Map<string, number>();
        let attribute2HashMap = new Map<string, number>();
        let skillTypeHashMap = new Map<string, number>();

        newVal.forEach((weapon) => {
            attribute1HashMap.set(
                weapon.attribute1,
                (attribute1HashMap.get(weapon.attribute1) || 0) + 1
            );
            if (weapon.attribute2) {
                attribute2HashMap.set(
                    weapon.attribute2,
                    (attribute2HashMap.get(weapon.attribute2) || 0) + 1
                );
            }
            skillTypeHashMap.set(
                weapon.skill.type,
                (skillTypeHashMap.get(weapon.skill.type) || 0) + 1
            );
        });

        attributeOptions.value = {
            attribute1Array: attribute1HashMap,
            attribute2Array: attribute2HashMap,
            skillTypeArray: skillTypeHashMap,
        };

        const regionMap = new Map<WeaponBaseMaterialRegion, WeaponData[]>();
        endfieldWeaponBaseMaterialRegion.forEach((region) => {
            let weaponList: WeaponData[] = [];
            newVal.forEach((weapon) => {
                if (
                    region.attribute1Array.includes(weapon.attribute1) &&
                    skill2TypeMatch(weapon, region) &&
                    region.skillTypeArray.includes(weapon.skill.type)
                ) {
                    weaponList.push(weapon);
                }
            });
            regionMap.set(region, weaponList);
        });

        const sortedRegionArray = new Map(
            [...regionMap.entries()].sort((a, b) => b[1].length - a[1].length)
        );
        selectedMap.value = Array.from(sortedRegionArray.entries())[0]![0] || null;
        currentMapContainsWeapons.value =
            Array.from(sortedRegionArray.entries())[0]![1] || [];
        if (selectedMap.value) {
            const activatedAttribute1HashMap = new Map<string, number>();
            const activatedAttribute2HashMap = new Map<string, number>();
            const activatedSkillTypeHashMap = new Map<string, number>();
            currentMapContainsWeapons.value.forEach((weapon) => {
                activatedAttribute1HashMap.set(
                    weapon.attribute1,
                    (activatedAttribute1HashMap.get(weapon.attribute1) || 0) + 1
                );
                if (weapon.attribute2) {
                    activatedAttribute2HashMap.set(
                        weapon.attribute2,
                        (activatedAttribute2HashMap.get(weapon.attribute2) || 0) + 1
                    );
                }
                activatedSkillTypeHashMap.set(
                    weapon.skill.type,
                    (activatedSkillTypeHashMap.get(weapon.skill.type) || 0) + 1
                );
            });

            const sortedAttribute1Array = new Map(
                [...activatedAttribute1HashMap.entries()].sort((a, b) => b[1] - a[1])
            );
            const sortedAttribute2Array = new Map(
                [...activatedAttribute2HashMap.entries()].sort((a, b) => b[1] - a[1])
            );
            const sortedSkillTypeArray = new Map(
                [...activatedSkillTypeHashMap.entries()].sort((a, b) => b[1] - a[1])
            );

            mainSelectedAttribute1.value =
                Array.from(sortedAttribute1Array.entries()).filter(
                    (_, index) => index < 3
                ) || [];
            mainSelectedSkillType.value = Array.from(sortedSkillTypeArray)[0] || null;
        }
    },
    { deep: true }
);
</script>

<template>
    <el-card>
        <template #header> 基质计算器 </template>

        <el-form label-width="auto">
            <el-form-item label="选择武器">
                <div class="weapon-select-add-div">
                    <el-select v-model="currentSelectWeapon" filterable placeholder="Select" style="width: auto">
                        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.label" />
                    </el-select>
                    <el-button type="primary" @click="addWeapon" round> 添加 </el-button>
                </div>
            </el-form-item>
            <el-form-item label="已选择的武器">
                <div class="selected-weapons-tags-div">
                    <div v-if="selectedWeapons.length !== 0">
                        <el-tag v-for="weapon in selectedWeapons" :key="weapon.name" closable
                            :type="currentMapContainsWeaponsNames(weapon)" plain round @close="deleteWeapon(weapon)">
                            <span :class="[`rarity-${weapon.rarity}`]">
                                {{ weapon.name }}
                            </span>
                        </el-tag>
                    </div>
                    <p v-else>
                        未选择任何武器，请添加任意把需要刷取基质的武器
                    </p>
                </div>
            </el-form-item>
            <el-form-item label="武器属性统计">
                <div class="weapon-attribute-summary-div">
                    <div>
                        <p>主属性</p>
                        <div v-for="item in attributeOptions.attribute1Array" :key="item[0]">
                            {{ item[0] }}: {{ item[1] }}
                        </div>
                    </div>
                    <div>
                        <p>副属性</p>
                        <div v-for="item in attributeOptions.attribute2Array" :key="item[0]">
                            {{ item[0] }}: {{ item[1] }}
                        </div>
                    </div>
                    <div>
                        <p>技能</p>
                        <div v-for="item in attributeOptions.skillTypeArray" :key="item[0]">
                            {{ item[0] }}: {{ item[1] }}
                        </div>
                    </div>
                </div>
            </el-form-item>
            <el-form-item label="地图推荐">
                <div>
                    {{ selectedMap?.region }}
                </div>
            </el-form-item>
            <el-form-item label="定向券选择">
                <el-form label-width="auto">
                    <el-form-item label="主属性类型">
                        {{ mainAttributesRecommands }}
                    </el-form-item>
                    <el-form-item label="选择技能类型">
                        {{ mainSelectedSkillType?.[0] }}
                    </el-form-item>
                </el-form>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<style scoped>
.weapon-select-add-div {
    display: flex;
    gap: 1rem;
}

.selected-weapons-tags-div {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.weapon-attribute-summary-div {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    align-items: flex-start;
}

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
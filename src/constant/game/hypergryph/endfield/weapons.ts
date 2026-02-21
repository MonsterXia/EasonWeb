interface WeaponSkill {
    type: string;
    name: string;
}

export interface WeaponData {
    name: string;
    type: string;
    rarity: number;
    attribute1: string;
    attribute2: string | null;
    skill: WeaponSkill;
}

const endfieldWeaponsSword: WeaponData[] = [
    {
        name: '塔尔11',
        type: '单手剑',
        rarity: 3,
        attribute1: '主能力提升',
        attribute2: null,
        skill: {
            type: '强攻',
            name: '武装整备'
        }
    },
    {
        name: '应急手段',
        type: '单手剑',
        rarity: 4,
        attribute1: '敏捷提升',
        attribute2: '物理伤害提升',
        skill: {
            type: '压制',
            name: '应急强化'
        }
    },
    {
        name: '浪潮',
        type: '单手剑',
        rarity: 4,
        attribute1: '智识提升',
        attribute2: '攻击提升',
        skill: {
            type: '追袭',
            name: '生生不息'
        }
    },
    {
        name: '钢铁余音',
        type: '单手剑',
        rarity: 5,
        attribute1: '敏捷提升',
        attribute2: '物理伤害提升',
        skill: {
            type: '巧技',
            name: '旧火余音'
        }
    },
    {
        name: '坚城铸造者',
        type: '单手剑',
        rarity: 5,
        attribute1: '智识提升',
        attribute2: '终结技充能效率提升',
        skill: {
            type: '昂扬',
            name: '残城归途'
        }
    },
    {
        name: '逐鳞3.0',
        type: '单手剑',
        rarity: 5,
        attribute1: '力量提升',
        attribute2: '寒冷伤害提升',
        skill: {
            type: '压制',
            name: '逐鱼意'
        }
    },
    {
        name: '十二问',
        type: '单手剑',
        rarity: 5,
        attribute1: '敏捷提升',
        attribute2: '攻击力提升',
        skill: {
            type: '附术',
            name: '竭心诘问'
        }
    },
    {
        name: 'O.B.J.轻芒',
        type: '单手剑',
        rarity: 5,
        attribute1: '敏捷提升',
        attribute2: '攻击力提升',
        skill: {
            type: '流转',
            name: '不羁锋芒'
        }
    },
    {
        name: '仰止',
        type: '单手剑',
        rarity: 5,
        attribute1: '敏捷提升',
        attribute2: '物理伤害提升',
        skill: {
            type: '夜幕',
            name: '高山仰止'
        }
    },
    {
        name: '宏愿',
        type: '单手剑',
        rarity: 6,
        attribute1: '敏捷提升',
        attribute2: '攻击提升',
        skill: {
            type: '附术',
            name: '长愿'
        }
    },
    {
        name: '不知规',
        type: '单手剑',
        rarity: 6,
        attribute1: '意志提升',
        attribute2: '攻击提升',
        skill: {
            type: '流转',
            name: '轮回'
        }
    },
    {
        name: '熔铸火焰',
        type: '单手剑',
        rarity: 6,
        attribute1: '智识提升',
        attribute2: '攻击提升',
        skill: {
            type: '夜幕',
            name: '嘶鸣烈火'
        }
    },
    {
        name: '黯色火炬',
        type: '单手剑',
        rarity: 6,
        attribute1: '智识提升',
        attribute2: '灼热伤害提升',
        skill: {
            type: '附术',
            name: '觊觎堆叠'
        }
    },
    {
        name: '扶摇',
        type: '单手剑',
        rarity: 6,
        attribute1: '主能力提升',
        attribute2: '暴击率提升',
        skill: {
            type: '夜幕',
            name: '青云'
        }
    },
    {
        name: '热熔切割器',
        type: '单手剑',
        rarity: 6,
        attribute1: '意志提升',
        attribute2: '攻击力提升',
        skill: {
            type: '流转',
            name: '高热解放'
        }
    },
    {
        name: '显赫声名',
        type: '单手剑',
        rarity: 6,
        attribute1: '主能力提升',
        attribute2: '物理伤害提升',
        skill: {
            type: '残暴',
            name: '规行钜止'
        }
    },
    {
        name: '白夜新星',
        type: '单手剑',
        rarity: 6,
        attribute1: '主能力提升',
        attribute2: '原始技艺强度提升',
        skill: {
            type: '附术',
            name: '白夜新星'
        }
    },
]

const endfieldWeaponsGreatSword: WeaponData[] = [
    {
        name: '达尔霍夫7',
        type: '双手剑',
        rarity: 3,
        attribute1: '主能力提升',
        attribute2: null,
        skill: {
            type: '强攻',
            name: '武装整备'
        }
    },
    {
        name: '工业零点一',
        type: '双手剑',
        rarity: 4,
        attribute1: '力量提升',
        attribute2: '攻击提升',
        skill: {
            type: '压制',
            name: '应急强化'
        }
    },
    {
        name: '淬火者',
        type: '双手剑',
        rarity: 4,
        attribute1: '意志提升',
        attribute2: '生命提升',
        skill: {
            type: '粉碎',
            name: '淬砺成兵'
        }
    },
    {
        name: '探骊',
        type: '双手剑',
        rarity: 5,
        attribute1: '力量提升',
        attribute2: '终结技充能效率提升',
        skill: {
            type: '迸发',
            name: '钩玄猎秘'
        }
    },
    {
        name: '古渠',
        type: '双手剑',
        rarity: 5,
        attribute1: '力量提升',
        attribute2: '源石技艺强度提升',
        skill: {
            type: '残暴',
            name: '千秋旧土'
        }
    },
    {
        name: '终点之声',
        type: '双手剑',
        rarity: 5,
        attribute1: '力量提升',
        attribute2: '生命提升',
        skill: {
            type: '医疗',
            name: '骑士荣光'
        }
    },
    {
        name: 'O.B.J.重荷',
        type: '双手剑',
        rarity: 5,
        attribute1: '力量提升',
        attribute2: '生命提升',
        skill: {
            type: '效益',
            name: '坚韧心性'
        }
    },
    {
        name: '大雷斑',
        type: '双手剑',
        rarity: 6,
        attribute1: '力量提升',
        attribute2: '生命提升',
        skill: {
            type: '医疗',
            name: '塔罗斯之眼'
        }
    },
    {
        name: '赫拉芬格',
        type: '双手剑',
        rarity: 6,
        attribute1: '力量提升',
        attribute2: '攻击提升',
        skill: {
            type: '迸发',
            name: '切骨之寒'
        }
    },
    {
        name: '典范',
        type: '双手剑',
        rarity: 6,
        attribute1: '主能力提升',
        attribute2: '攻击提升',
        skill: {
            type: '压制',
            name: '多层斩断'
        }
    },
    {
        name: '昔日精品',
        type: '双手剑',
        rarity: 6,
        attribute1: '意志提升',
        attribute2: '生命提升',
        skill: {
            type: '效益',
            name: '切碎疗法'
        }
    },
    {
        name: '破碎君王',
        type: '双手剑',
        rarity: 6,
        attribute1: '力量提升',
        attribute2: '暴击率提升',
        skill: {
            type: '粉碎',
            name: '君王威慑'
        }
    }
]

const endfieldWeaponsPolearm: WeaponData[] = [
    {
        name: '奥佩罗77',
        type: '长柄武器',
        rarity: 3,
        attribute1: '主能力提升',
        attribute2: null,
        skill: {
            type: '强攻',
            name: '武装整备'
        }
    },
    {
        name: '寻路者道标',
        type: '长柄武器',
        rarity: 4,
        attribute1: '敏捷提升',
        attribute2: '攻击力提升',
        skill: {
            type: '昂扬',
            name: '远途起始'
        }
    },
    {
        name: '天使杀手',
        type: '长柄武器',
        rarity: 4,
        attribute1: '意志提升',
        attribute2: '法术提升',
        skill: {
            type: '压制',
            name: '应急强化'
        }
    },
    {
        name: '嵌合正义',
        type: '长柄武器',
        rarity: 5,
        attribute1: '力量提升',
        attribute2: '终结技充能效率提升',
        skill: {
            type: '残暴',
            name: '愤怒接合'
        }
    },
    {
        name: 'O.B.J.尖峰',
        type: '长柄武器',
        rarity: 5,
        attribute1: '意志提升',
        attribute2: '物理伤害提升',
        skill: {
            type: '附术',
            name: '攀越冰峰'
        }
    },
    {
        name: '向心之引',
        type: '长柄武器',
        rarity: 5,
        attribute1: '意志提升',
        attribute2: '电磁伤害提升',
        skill: {
            type: '压制',
            name: '同心圆'
        }
    },
    {
        name: '负山',
        type: '长柄武器',
        rarity: 6,
        attribute1: '敏捷提升',
        attribute2: '物理伤害提升',
        skill: {
            type: '效益',
            name: '山川在我'
        }
    },
    {
        name: '骁勇',
        type: '长柄武器',
        rarity: 6,
        attribute1: '敏捷提升',
        attribute2: '物理伤害提升',
        skill: {
            type: '巧技',
            name: '美德盈利'
        }
    },
    {
        name: 'J.E.T.',
        type: '长柄武器',
        rarity: 6,
        attribute1: '主能力提升',
        attribute2: '攻击提升',
        skill: {
            type: '压制',
            name: '太空物理学'
        }
    }
]

const endfieldWeaponsHandCannon: WeaponData[] = [
    {
        name: '配科5',
        type: '手铳',
        rarity: 3,
        attribute1: '主能力提升',
        attribute2: null,
        skill: {
            type: '强攻',
            name: '武装整备'
        }
    },
    {
        name: '呼啸守卫',
        type: '手铳',
        rarity: 4,
        attribute1: '智识提升',
        attribute2: '攻击提升',
        skill: {
            type: '压制',
            name: '应急强化'
        }
    },
    {
        name: '长路',
        type: '手铳',
        rarity: 4,
        attribute1: '力量提升',
        attribute2: '法术提升',
        skill: {
            type: '追袭',
            name: '生生不息'
        }
    },
    {
        name: '作品:众生',
        type: '手铳',
        rarity: 5,
        attribute1: '敏捷提升',
        attribute2: '法术提升',
        skill: {
            type: '附术',
            name: '众生的归途'
        }
    },
    {
        name: 'O.B.J.讯极',
        type: '手铳',
        rarity: 5,
        attribute1: '敏捷提升',
        attribute2: '终结技充能效率提升',
        skill: {
            type: '迸发',
            name: '讯击'
        }
    },
    {
        name: '理性告别',
        type: '手铳',
        rarity: 5,
        attribute1: '力量提升',
        attribute2: '灼热伤害提升',
        skill: {
            type: '追袭',
            name: '旧时之援'
        }
    },
    {
        name: '艺术暴君',
        type: '手铳',
        rarity: 6,
        attribute1: '智识提升',
        attribute2: '暴击率提升',
        skill: {
            type: '切骨',
            name: '艺术暴论'
        }
    },
    {
        name: '领航者',
        type: '手铳',
        rarity: 6,
        attribute1: '智识提升',
        attribute2: '寒冷伤害提升',
        skill: {
            type: '附术',
            name: '远影孤帆'
        }
    },
    {
        name: '楔子',
        type: '手铳',
        rarity: 6,
        attribute1: '主能力提升',
        attribute2: '暴击率提升',
        skill: {
            type: '附术',
            name: '文明楔子'
        }
    },
    {
        name: '同类相食',
        type: '手铳',
        rarity: 6,
        attribute1: '主能力提升',
        attribute2: '法术提升',
        skill: {
            type: '附术',
            name: '残酷清洗'
        }
    },
]

const endfieldWeaponsCastingUnit: WeaponData[] = [
    {
        name: '吉米尼12',
        type: '施术单元',
        rarity: 3,
        attribute1: '主能力提升',
        attribute2: null,
        skill: {
            type: '强攻',
            name: '武装整备'
        }
    },
    {
        name: '全自动骇新星',
        type: '施术单元',
        rarity: 4,
        attribute1: '智识提升',
        attribute2: '法术提升',
        skill: {
            type: '昂扬',
            name: '远途起始'
        }
    },
    {
        name: '荧光雷羽',
        type: '施术单元',
        rarity: 4,
        attribute1: '意志提升',
        attribute2: '攻击提升',
        skill: {
            type: '压制',
            name: '应急强化'
        }
    },
    {
        name: '悼亡诗',
        type: '施术单元',
        rarity: 5,
        attribute1: '智识提升',
        attribute2: '攻击提升',
        skill: {
            type: '夜幕',
            name: '冢火成莹'
        }
    },
    {
        name: '莫奈何',
        type: '施术单元',
        rarity: 5,
        attribute1: '意志提升',
        attribute2: '终结技充能效率提升',
        skill: {
            type: '昂扬',
            name: '榫卯分析法'
        }
    },
    {
        name: '迷失荒野',
        type: '施术单元',
        rarity: 5,
        attribute1: '智识提升',
        attribute2: '电磁伤害提升',
        skill: {
            type: '附术',
            name: '荒芜集簇'
        }
    },
    {
        name: '布道自由',
        type: '施术单元',
        rarity: 5,
        attribute1: '意志提升',
        attribute2: '治疗效率提升',
        skill: {
            type: '医疗',
            name: '信仰救赎'
        }
    },
    {
        name: 'O.B.J.术识',
        type: '施术单元',
        rarity: 5,
        attribute1: '智识提升',
        attribute2: '源石技艺强度提升',
        skill: {
            type: '追袭',
            name: '术法升华'
        }
    },
    {
        name: '使命必达',
        type: '施术单元',
        rarity: 6,
        attribute1: '意志提升',
        attribute2: '终结技充能效率提升',
        skill: {
            type: '追袭',
            name: '不辱使命'
        }
    },
    {
        name: '沧溟星梦',
        type: '施术单元',
        rarity: 6,
        attribute1: '智识提升',
        attribute2: '治疗效率提升',
        skill: {
            type: '附术',
            name: '潮汐低语'
        }
    },
    {
        name: '作品:蚀迹',
        type: '施术单元',
        rarity: 6,
        attribute1: '意志提升',
        attribute2: '自然伤害提升',
        skill: {
            type: '压制',
            name: '碛岩蚀痕'
        }
    },
    {
        name: '爆破单元',
        type: '施术单元',
        rarity: 6,
        attribute1: '主能力提升',
        attribute2: '源石技艺强度提升',
        skill: {
            type: '迸发',
            name: '冠军威赫'
        }
    },
    {
        name: '遗忘',
        type: '施术单元',
        rarity: 6,
        attribute1: '智识提升',
        attribute2: '法术提升',
        skill: {
            type: '夜幕',
            name: '耻辱'
        }
    },
    {
        name: '骑士精神',
        type: '施术单元',
        rarity: 6,
        attribute1: '意志提升',
        attribute2: '生命提升',
        skill: {
            type: '医疗',
            name: '侵蚀性狂热'
        }
    },
]

export const endfieldWeapons: WeaponData[] = [
    ...endfieldWeaponsSword,
    ...endfieldWeaponsGreatSword,
    ...endfieldWeaponsPolearm,
    ...endfieldWeaponsHandCannon,
    ...endfieldWeaponsCastingUnit,
]

export interface WeaponBaseMaterialRegion {
    region: string;
    attribute1Array: string[];
    attribute2Array: string[];
    skillTypeArray: string[];
}

export const endfieldWeaponBaseMaterialRegion: WeaponBaseMaterialRegion[] = [
    {
        region: '枢纽区',
        attribute1Array: [
            '敏捷提升', '力量提升', '意志提升',
            '智识提升', '主能力提升'
        ],
        attribute2Array: [
            '攻击提升', '灼热伤害提升', '电磁伤害提升',
            '寒冷伤害提升', '自然伤害提升', '源石技艺提升',
            '终结技效率提升', '法术提升'
        ],
        skillTypeArray: [
            '强攻', '压制', '追袭',
            '粉碎', '巧技', '迸发',
            '流转', '效益'
        ]
    },
    {
        region: '源石研究园',
        attribute1Array: [
            '敏捷提升', '力量提升', '意志提升',
            '智识提升', '主能力提升'
        ],
        attribute2Array: [
            '攻击提升', '物理伤害提升', '电磁伤害提升',
            '寒冷伤害提升', '自然伤害提升', '暴击率提升',
            '终结技效率提升', '法术提升'
        ],
        skillTypeArray: [
            '压制', '追袭', '昂扬',
            '巧技', '附术', '医疗',
            '切骨', '效益'
        ]
    },
    {
        region: '源石研究园',
        attribute1Array: [
            '敏捷提升', '力量提升', '意志提升',
            '智识提升', '主能力提升'
        ],
        attribute2Array: [
            '攻击提升', '物理伤害提升', '电磁伤害提升',
            '寒冷伤害提升', '自然伤害提升', '暴击率提升',
            '终结技效率提升', '法术提升'
        ],
        skillTypeArray: [
            '压制', '追袭', '昂扬',
            '巧技', '附术', '医疗',
            '切骨', '效益'
        ]
    },
    {
        region: '矿脉源区',
        attribute1Array: [
            '敏捷提升', '力量提升', '意志提升',
            '智识提升', '主能力提升'
        ],
        attribute2Array: [
            '生命提升', '物理伤害提升', '灼热伤害提升',
            '寒冷伤害提升', '自然伤害提升', '暴击率提升',
            '源石技艺提升', '治疗效率提升'
        ],
        skillTypeArray: [
            '强攻', '压制', '巧技',
            '残暴', '附术', '迸发',
            '夜幕', '效益'
        ]
    },
    {
        region: '供能高地',
        attribute1Array: [
            '敏捷提升', '力量提升', '意志提升',
            '智识提升', '主能力提升'
        ],
        attribute2Array: [
            '攻击提升', '生命提升', '物理伤害提升',
            '灼热伤害提升', '自然伤害提升', '暴击率提升',
            '源石技艺提升', '治疗效率提升'
        ],
        skillTypeArray: [
            '追袭', '粉碎', '昂扬',
            '残暴', '附术', '医疗',
            '切骨', '流转'
        ]
    },
    {
        region: '武陵城',
        attribute1Array: [
            '敏捷提升', '力量提升', '意志提升',
            '智识提升', '主能力提升'
        ],
        attribute2Array: [
            '攻击提升', '生命提升', '电磁伤害提升',
            '寒冷伤害提升', '暴击率提升', '终结技效率提升',
            '法术伤害提升', '治疗效率提升'
        ],
        skillTypeArray: [
            '强攻', '粉碎', '残暴',
            '医疗', '切骨', '迸发',
            '夜幕', '流转'
        ]
    },
]
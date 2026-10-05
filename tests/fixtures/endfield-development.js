// Entirely synthetic; does not contain a player snapshot or player media.
export function developmentFixture() {
  const base = {
    name: 'Synthetic outpost',
    level: 3,
    unlocked: true,
    experience: 1800000,
    experienceMax: 1800000,
    isMaxLevel: false,
    money: 1600000,
    moneyMax: 2000000,
    officer: {
      id: 'archive',
      name: 'Assigned Archive',
      avatarUrl: 'https://web.hycdn.cn/synthetic-missing.png',
    },
  }
  return {
    regions: [
      {
        id: 'domain_1',
        name: 'Synthetic Valley',
        level: 12,
        money: 30000000,
        moneyMax: 30000000,
        settlements: [
          { ...base, id: 'a', name: 'Full level', level: 4, isMaxLevel: true },
          { ...base, id: 'b', name: 'Full experience, not MAX' },
        ],
      },
      {
        id: 'domain_2',
        name: 'Synthetic Wuling / 长地区名称完整换行',
        level: 18,
        money: 0,
        moneyMax: 26000000,
        settlements: [
          {
            ...base,
            id: 'c',
            name: 'Locked outpost',
            level: 0,
            unlocked: false,
            experience: 0,
            experienceMax: 0,
            money: 0,
            officer: null,
          },
          {
            id: 'd',
            name: 'Unknown outpost',
            level: null,
            unlocked: null,
            experience: null,
            experienceMax: null,
            isMaxLevel: null,
            money: null,
            moneyMax: null,
            officer: null,
          },
        ],
      },
    ],
  }
}
export function monolithFixture() {
  const challenge = {
    id: 'n',
    difficulty: 'normal',
    name: 'Synthetic clear',
    isPassed: true,
    firstPassAt: null,
    plusTask: null,
    description: 'A complete description that wraps on the narrow screen.',
    feature: '<@ba.info>Mechanism details and conditions.</>',
    target: null,
    recommendLevel: 60,
    enemies: [
      {
        id: 'enemy',
        name: 'Synthetic enemy',
        level: 55,
        description: 'Enemy description',
        ability: 'Enemy ability',
        artworkUrl: null,
      },
    ],
    record: {
      durationSeconds: 124,
      recordedAt: 1700000000,
      team: [
        {
          id: 'history',
          name: 'Historical Operator',
          level: 30,
          phase: 1,
          potential: 0,
          rarity: '6',
          element: 'Heat',
          avatarUrl: 'https://web.hycdn.cn/synthetic-missing.png',
        },
      ],
    },
  }
  const theme = {
    id: 'current',
    name: 'Current synthetic theme',
    artworkUrl: 'https://web.hycdn.cn/synthetic-cover.png',
    activityName: null,
    isInActivity: false,
    startAt: null,
    endAt: null,
    medal: {
      name: 'Synthetic medal',
      acquired: false,
      plated: false,
      level: 1,
      artworkUrl: null,
      acquiredAt: null,
    },
    stages: [
      {
        id: 'first',
        name: 'First stage',
        normal: { ...challenge, isPassed: false, record: null },
        hard: { ...challenge, id: 'h', difficulty: 'hard', isPassed: null, record: null },
      },
    ],
  }
  return {
    detailAvailable: true,
    currentThemeId: 'current',
    themes: [
      theme,
      {
        ...theme,
        id: 'history',
        name: 'Historical complete theme',
        medal: {
          ...theme.medal,
          acquired: true,
          plated: true,
          level: 3,
          acquiredAt: 1700000000,
          artworkUrl: 'https://web.hycdn.cn/synthetic-missing.png',
        },
        stages: [
          {
            id: 'clear',
            name: 'Historical clear',
            normal: challenge,
            hard: { ...challenge, id: 'h', name: 'Synthetic agony', difficulty: 'hard' },
          },
        ],
      },
      { ...theme, id: 'unknown', name: 'Unknown data theme', medal: null, stages: null },
      { ...theme, id: 'empty', name: 'Empty theme', stages: [] },
    ],
  }
}

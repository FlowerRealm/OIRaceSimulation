import type { ChallengeKind, ChallengeTier } from '../components/ChallengeItem';

export interface ChallengeDef {
  /** The engine's own key, e.g. "I", "I_exp", "fun_I". */
  key: string;
  name: string;
  desc: string;
  kind: ChallengeKind;
  tier?: ChallengeTier;
  expTip?: string;
  tip?: boolean;
}

export interface ChallengeGroupDef {
  /** Element id the engine toggles the tier-active classes on. */
  groupId: string;
  listId: string;
  title: string;
  desc: string;
  /** Class added to the group while any of its challenges is on. */
  activeClass: string;
  /** Class added instead while the group's EXP challenge is on. */
  expActiveClass?: string;
  items: ChallengeDef[];
}

const EXP_TIP = '💡 EXP 挑战需要开启所有同级挑战后解锁';

/**
 * The engine derives element ids from the challenge key, so the markup does too
 * rather than repeating them: `ch` + PascalCased key for the row, `badge` + the
 * same for the status badge. Keep this in step with getBadge() in engine.js.
 */
export const elementIdFor = (key: string) => 'ch' + pascal(key);
export const badgeIdFor = (key: string) => 'badge' + pascal(key);

function pascal(key: string) {
  return key[0].toUpperCase() + key.slice(1).replace(/_/g, '');
}

export const CHALLENGE_GROUPS: ChallengeGroupDef[] = [
  {
    groupId: 'tier1Group',
    listId: 'challengeListTier1',
    title: '📋入门级',
    desc: '简单的挑战，熟悉游戏之后可以尝试',
    activeClass: 'tier1-active',
    expActiveClass: 'tier1-exp-active',
    items: [
      {
        key: 'I',
        kind: 'normal',
        tier: 1,
        name: 'I级：时间不足',
        desc: '每在一道题获得100分 -k 时间（CSP-S/NOIP:k=1，省选/NOI:k=2，CTT及以后:k=3）',
      },
      { key: 'II', kind: 'normal', tier: 1, name: 'II级：无精打采', desc: '精力=时间×1' },
      { key: 'III', kind: 'normal', tier: 1, name: 'III级：痴呆症', desc: '每过正式赛思维-1' },
      { key: 'I_exp', kind: 'exp', name: '⚡I EXP：落后资源', desc: '时间结构仅+1.5时间', expTip: EXP_TIP },
    ],
  },
  {
    groupId: 'tier2Group',
    listId: 'challengeListTier2',
    title: '📋提高级',
    desc: '难一点的挑战，需要练习一下再尝试',
    activeClass: 'tier2-active',
    expActiveClass: 'tier2-exp-active',
    items: [
      { key: 'IV', kind: 'normal', tier: 2, name: 'IV级：近视两万度', desc: '数值乱码' },
      { key: 'V', kind: 'normal', tier: 2, name: 'V级：名额紧张', desc: '每场比赛分数线 +30' },
      { key: 'VI', kind: 'normal', tier: 2, name: 'VI级：技能涨价', desc: 'NOIP后全部技能升级涨价1技能点' },
      { key: 'VII', kind: 'normal', tier: 2, name: 'VII级：注意力涣散', desc: '每8秒-1时间-1精力' },
      { key: 'II_exp', kind: 'exp', name: '⚡II EXP：骗分困难', desc: 'k改为15', tip: true },
    ],
  },
  {
    groupId: 'tier3Group',
    listId: 'challengeListTier3',
    title: '📋地狱难度',
    desc: '真的很难的挑战',
    activeClass: 'tier3-active',
    expActiveClass: 'tier3-exp-active',
    items: [
      { key: 'VIII', kind: 'normal', tier: 3, name: 'VIII级：多虑', desc: '检查消耗2时间2精力' },
      { key: 'IX', kind: 'normal', tier: 3, name: 'IX级：低悟性', desc: '技能点×0.75' },
      { key: 'X', kind: 'normal', tier: 3, name: 'X级：OI进步', desc: '生成深度+1' },
      { key: 'III_exp', kind: 'exp', name: '⚡III EXP：深度递增', desc: '思维需求计算范围扩大', tip: true },
    ],
  },
  {
    groupId: 'assistGroup',
    listId: 'challengeListAssist',
    title: '🛠️辅助挑战',
    desc: '帮助你通过困难的挑战',
    activeClass: 'assist-active',
    items: [
      {
        key: 'assist_I',
        kind: 'assist',
        name: '辅助挑战 I',
        desc: '推理和聚焦不再需要技能点购买，可直接在NOIP后使用',
      },
    ],
  },
  {
    groupId: 'funGroup',
    listId: 'challengeListFun',
    title: '🎮趣味挑战',
    desc: '一些新奇的点子，因会破坏原有的正常流程被归类于此',
    activeClass: 'fun-active',
    items: [
      { key: 'fun_I', kind: 'fun', name: 'Fun I：AC的骄傲', desc: '无法正常获得技能点，AC得6sp' },
      { key: 'fun_II', kind: 'fun', name: 'Fun II：忘建文件夹', desc: '无法正常获得技能点，检查特殊节点得3sp' },
    ],
  },
];

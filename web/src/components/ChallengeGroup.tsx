import { ChallengeItem } from './ChallengeItem';
import {
  badgeIdFor,
  elementIdFor,
  type ChallengeGroupDef,
  type ChallengeDef,
} from '../data/challenges';

export type ChallengeState = Record<string, boolean>;

export interface ChallengeGroupProps {
  group: ChallengeGroupDef;
  /** Which challenge keys are switched on. */
  state?: ChallengeState;
  onToggle?: (key: string) => void;
}

/** An EXP challenge unlocks only once every plain challenge in its tier is on. */
export function canActivateExp(group: ChallengeGroupDef, state: ChallengeState) {
  const plain = group.items.filter((item) => item.kind === 'normal');
  return plain.length > 0 && plain.every((item) => state[item.key]);
}

const expItemOf = (group: ChallengeGroupDef) => group.items.find((item) => item.kind === 'exp');

export function ChallengeGroup({ group, state = {}, onToggle }: ChallengeGroupProps) {
  const expItem = expItemOf(group);
  const expOn = expItem ? !!state[expItem.key] : false;
  const anyPlainOn = group.items.some((item) => item.kind !== 'exp' && state[item.key]);
  const canExp = canActivateExp(group, state);

  // The EXP class wins over the plain one: while EXP is on it subsumes the whole tier.
  const groupClass = [
    'challenge-tier-group',
    expOn && group.expActiveClass ? group.expActiveClass : anyPlainOn ? group.activeClass : '',
  ]
    .filter(Boolean)
    .join(' ');

  const renderItem = (item: ChallengeDef) => (
    <ChallengeItem
      key={item.key}
      id={elementIdFor(item.key)}
      badgeId={badgeIdFor(item.key)}
      dataCh={item.key}
      name={item.name}
      desc={item.desc}
      kind={item.kind}
      tier={item.tier}
      on={!!state[item.key]}
      expOverride={item.kind === 'normal' && expOn}
      canActivate={canExp}
      expTip={item.expTip}
      tipId={item.tip ? 'tip' + badgeIdFor(item.key).slice('badge'.length) : undefined}
      onClick={onToggle && (() => onToggle(item.key))}
    />
  );

  return (
    <div className={groupClass} id={group.groupId}>
      <div className="challenge-tier-title">{group.title}</div>
      <div className="challenge-tier-desc">{group.desc}</div>
      <div className="challenge-list" id={group.listId}>
        {group.items.map(renderItem)}
      </div>
    </div>
  );
}

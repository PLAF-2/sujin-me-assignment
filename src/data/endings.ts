import type { FragmentId } from './fragments';

// Closing words. They describe what happened on the screen, never what the viewer "is".

export const openings = {
  none: '아무것도 지우지 않았습니다. 그것도 하나의 선택이었습니다.',
  few: '당신은 몇 개의 조각을 지웠습니다. 그러나 빈자리의 모양은 아직 남아 있습니다.',
  many: '남은 것보다 지운 것이 많아졌습니다. 이제 이곳의 모양은 남은 것과 빈자리가 함께 만듭니다.',
  all: '모든 조각을 지웠습니다. 빈자리들만이 서로가 있던 위치를 기억합니다.',
};

/** At most this many deletions still counts as "few". */
export const FEW_LIMIT = 3;

/**
 * Used when exactly two fragments remain.
 * Placeholders like {a} become a title in 「」; a following {을}/{은}/{과} picks the right particle.
 */
export const twoRemaining = {
  opening: '마지막에 남은 것은 {a}{과} {b}입니다.',
  bound: '둘을 잇던 선은 아직 끊기지 않았습니다.',
  unbound: '둘은 처음부터 직접 이어져 있지 않았습니다. 이제는 서로가 가장 가까이에 있습니다.',
};

/** Used when exactly one fragment remains (reachable if MAX_DELETIONS is raised to 7). */
export const lastRemaining: Record<FragmentId, string> = {
  recognition: '누군가의 끄덕임을 기다리던 문장이 남았습니다. 이제 그 문장을 끝맺을 사람은 정해져 있지 않습니다.',
  solitude: '문을 닫은 방이 남았습니다. 그 안에서 들리던 소리가 무엇이었는지는 여전히 알 수 없습니다.',
  avoidFailure: '출발선 앞의 망설임이 남았습니다. 그 앞에 함께 서 있던 것들은 이제 없습니다.',
  expectations: '보이지 않는 눈금이 남았습니다. 그 눈금을 그은 손은 이미 지워졌는지도 모릅니다.',
  persistence: '끝까지 쥐고 있는 손이 남았습니다. 무엇을 쥐고 있는지는 손만이 압니다.',
  gaze: '켜져 있는 조명 하나가 남았습니다. 비출 것이 줄어든 빛은 더 넓게 퍼집니다.',
  understandAll: '모든 문을 열려는 손이 남았습니다. 열 문은 줄었지만, 문틀은 그대로입니다.',
  explainNothing: '번역되지 않은 문장 하나가 남았습니다. 그것을 설명해 달라고 할 것은 이제 없습니다.',
};

/**
 * Added when the viewer cancelled a deletion. {t} is the title in 「」; particles are chosen automatically.
 * `kept`: the fragment still remains. `deletedAfter`: it was deleted later anyway.
 */
export const hesitation = {
  kept: '{t}{을} 지우려다 그만두었습니다. 그 망설임도 이 기록의 일부입니다.',
  deletedAfter: '{t}{은} 한 번 망설인 끝에 지웠습니다. 망설인 시간만큼의 자국이 남아 있습니다.',
};

/**
 * "처음의 나 / 지금의 나": the eight sentences before, and the same places now.
 * {d} deleted, {r} remaining, {c} remaining sentences that were rewritten by a deletion.
 */
export const portrait = {
  changed: '{d}개의 문장이 지워졌고, 남은 {r}개 가운데 {c}개는 지워진 것 때문에 다른 문장이 되었습니다.',
  changedNote: '지운 것은 목록에서 사라졌지만, 남은 문장 안에 흔적으로 남아 있습니다.',
  unchanged: '{d}개의 문장이 지워졌습니다. 남은 문장은 그대로지만, 그 사이사이에 빈칸이 생겼습니다.',
  none: '아무 문장도 지워지지 않았고, 어떤 문장도 바뀌지 않았습니다.',
};

/** The one-time return. Per-fragment returned sentences live in returns.ts. */
export const returnChoice = {
  prompt: '지운 것 가운데 하나를 되돌릴 수 있습니다. 단 한 번입니다.',
  returnedNote: '돌아왔지만, 처음과 같은 문장은 아닙니다.',
  returned: '되돌린 것은 돌아왔습니다. 그러나 지워지기 전의 모습으로 돌아오지는 않았습니다.',
  declined: '되돌리지 않기로 했습니다. 빈자리는 빈자리인 채로 남겨 두었습니다.',
};

export const closing = '삭제한 것이 정말 사라졌는지는, 여전히 알 수 없습니다.';
export const closingNone = '지울 수 있다는 사실만이 조용히 남았습니다.';

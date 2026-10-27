import type { FragmentId } from './fragments';

// What deleting one fragment does to a fragment it is bound to.
export type Effect =
  | { kind: 'dim'; amount: number } // loses what it leaned on: fades
  | { kind: 'swell'; amount: number } // something that held it down is gone: grows and brightens
  | { kind: 'rewrite'; summary: string } // its short description changes
  | { kind: 'tremble' }; // becomes slightly unstable

// What happens to the line between them.
//   sever   — the line breaks, only stubs remain
//   fray    — the line stays, but dashed
//   persist — the line outlives the deleted fragment
export type LineFate = 'sever' | 'fray' | 'persist';

export type Consequence = { effects: Effect[]; line: LineFate };

export type Bond = {
  id: string;
  between: [FragmentId, FragmentId];
  label: string;
  /** Keyed by the fragment that gets deleted; effects apply to the other one. */
  onDelete: Partial<Record<FragmentId, Consequence>>;
};

export const bonds: Bond[] = [
  {
    id: 'recognition-expectations',
    between: ['recognition', 'expectations'],
    label: '서로를 먹여 살림',
    onDelete: {
      recognition: {
        effects: [{ kind: 'dim', amount: 0.25 }, { kind: 'rewrite', summary: '누구의 기대였는지 흐릿해졌다.' }],
        line: 'sever',
      },
      expectations: {
        effects: [{ kind: 'rewrite', summary: '끄덕여 줄 사람이 정해지지 않은 문장.' }],
        line: 'fray',
      },
    },
  },
  {
    id: 'recognition-gaze',
    between: ['recognition', 'gaze'],
    label: '같은 빛을 바라봄',
    onDelete: {
      recognition: {
        effects: [{ kind: 'dim', amount: 0.2 }],
        line: 'fray',
      },
      gaze: {
        effects: [{ kind: 'tremble' }, { kind: 'rewrite', summary: '아무도 보지 않는 곳에서도 완성되려는 문장.' }],
        line: 'persist',
      },
    },
  },
  {
    id: 'gaze-solitude',
    between: ['gaze', 'solitude'],
    label: '닫힌 문의 이유',
    onDelete: {
      gaze: {
        effects: [{ kind: 'swell', amount: 0.12 }, { kind: 'rewrite', summary: '숨기 위해서가 아니라, 그냥 닫힌 문.' }],
        line: 'sever',
      },
      solitude: {
        effects: [{ kind: 'swell', amount: 0.1 }, { kind: 'rewrite', summary: '숨을 곳이 없어 더 밝아진 조명.' }],
        line: 'fray',
      },
    },
  },
  {
    id: 'avoidFailure-persistence',
    between: ['avoidFailure', 'persistence'],
    label: '출발선과 결승선',
    onDelete: {
      avoidFailure: {
        effects: [
          { kind: 'swell', amount: 0.08 },
          { kind: 'rewrite', summary: '무엇이든 시작할 수 있게 된 손. 그만큼 쥘 것도 많아졌다.' },
        ],
        line: 'persist',
      },
      persistence: {
        effects: [{ kind: 'swell', amount: 0.1 }, { kind: 'rewrite', summary: '끝까지 가지 않아도 된다면, 시작은 더 쉬울까.' }],
        line: 'sever',
      },
    },
  },
  {
    id: 'avoidFailure-expectations',
    between: ['avoidFailure', 'expectations'],
    label: '넘지 말아야 할 선',
    onDelete: {
      expectations: {
        effects: [{ kind: 'dim', amount: 0.2 }, { kind: 'rewrite', summary: '실패를 정해 줄 눈금이 사라졌다.' }],
        line: 'sever',
      },
      avoidFailure: {
        effects: [{ kind: 'tremble' }],
        line: 'fray',
      },
    },
  },
  {
    id: 'understandAll-explainNothing',
    between: ['understandAll', 'explainNothing'],
    label: '같은 침묵의 양면',
    onDelete: {
      understandAll: {
        effects: [{ kind: 'dim', amount: 0.2 }, { kind: 'rewrite', summary: '설명을 요구하던 손이 사라지자, 침묵은 이유를 잃었다.' }],
        line: 'fray',
      },
      explainNothing: {
        effects: [{ kind: 'tremble' }, { kind: 'swell', amount: 0.1 }, { kind: 'rewrite', summary: '열어야 할 문이 갑자기 너무 많아졌다.' }],
        line: 'persist',
      },
    },
  },
  {
    id: 'understandAll-avoidFailure',
    between: ['understandAll', 'avoidFailure'],
    label: '실수하지 않기 위한 지도',
    onDelete: {
      understandAll: {
        effects: [{ kind: 'tremble' }],
        line: 'sever',
      },
      avoidFailure: {
        effects: [{ kind: 'rewrite', summary: '지도 없이 걸어 보는 것도 이해의 한 방식일까.' }],
        line: 'fray',
      },
    },
  },
  {
    id: 'explainNothing-solitude',
    between: ['explainNothing', 'solitude'],
    label: '말이 필요 없는 방',
    onDelete: {
      explainNothing: {
        effects: [{ kind: 'rewrite', summary: '문을 닫은 이유를 이제는 말할 수 있을 것 같다.' }],
        line: 'fray',
      },
      solitude: {
        effects: [{ kind: 'dim', amount: 0.15 }, { kind: 'tremble' }],
        line: 'sever',
      },
    },
  },
  {
    id: 'persistence-expectations',
    between: ['persistence', 'expectations'],
    label: '끝까지 버티는 이유',
    onDelete: {
      persistence: {
        effects: [{ kind: 'dim', amount: 0.15 }],
        line: 'sever',
      },
      expectations: {
        effects: [{ kind: 'rewrite', summary: '누구를 위해 쥐고 있었는지 묻기 시작한 손.' }],
        line: 'persist',
      },
    },
  },
];

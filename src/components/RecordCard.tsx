import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { fragments, type FragmentId } from '../data/fragments';
import { returnedSummary } from '../data/returns';
import { CARD_HEIGHT, CARD_WIDTH, drawRecordCard, loadCardFonts, type CardData } from '../card/drawRecordCard';
import type { FieldView } from '../state/derive';
import { possibleOrders, recordCode } from '../state/record';
import type { Deletion } from '../state/reducer';
import { formatCount } from '../utils/format';
import '../styles/record-card.css';

type Props = {
  deletions: Deletion[];
  view: FieldView;
  returned: FragmentId | null;
  finalLine: string;
};

type CardState = { status: 'drawing' } | { status: 'ready'; url: string } | { status: 'error' };

const formatDate = (epochMs: number) => {
  const d = new Date(epochMs);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

/** A single image of this ending, drawn in the browser. Nothing is uploaded anywhere. */
export default function RecordCard({ deletions, view, returned, finalLine }: Props) {
  const [card, setCard] = useState<CardState>({ status: 'drawing' });
  const code = recordCode(deletions);

  const data = useMemo<CardData>(() => {
    const deleted = new Set(deletions.map((d) => d.id));
    return {
      code,
      odds: deletions.length > 0 ? `1 OF ${formatCount(possibleOrders(deletions.length))}` : null,
      date: formatDate(deletions.at(-1)?.at ?? Date.now()),
      order: deletions.map((d) => d.id),
      returned,
      prose: fragments.map((f) =>
        f.id === returned
          ? { kind: 'sentence' as const, text: returnedSummary[f.id], returned: true }
          : deleted.has(f.id)
            ? { kind: 'gap' as const, length: [...f.summary].length }
            : { kind: 'sentence' as const, text: view.fragments.get(f.id)?.summary ?? f.summary },
      ),
      finalLine,
    };
  }, [code, deletions, returned, view, finalLine]);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    setCard({ status: 'drawing' });

    (async () => {
      try {
        // A font that fails to load only costs typography; the card is still drawn with fallbacks.
        await loadCardFonts(data).catch(() => {});
        const canvas = document.createElement('canvas');
        drawRecordCard(canvas, data);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('toBlob returned null');
        url = URL.createObjectURL(blob);
        if (!cancelled) setCard({ status: 'ready', url });
      } catch (error) {
        console.error('Record card could not be drawn', error);
        if (!cancelled) setCard({ status: 'error' });
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [data]);

  return (
    <section className="record-card" aria-labelledby="record-card-title">
      <p className="meta">RECORD CARD</p>
      <h2 id="record-card-title" className="record-card__title">
        이 기록을 한 장으로 가져갈 수 있습니다.
      </h2>
      <p className="note">이미지는 이 브라우저 안에서 만들어지며, 어디에도 전송되지 않습니다.</p>

      <div className="record-card__body">
        <div className="record-card__preview" style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }} aria-busy={card.status === 'drawing'}>
          {card.status === 'ready' && (
            <img
              src={card.url}
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              alt={`기록 카드 ${code}: 지운 순서대로 이은 빈자리의 모양, 지금의 나를 이루는 문장들, 그리고 마지막 문장.`}
            />
          )}
          {card.status === 'drawing' && <p className="record-card__status meta">DRAWING…</p>}
          {card.status === 'error' && (
            <p className="record-card__status note" role="alert">
              카드를 그리지 못했습니다. 위의 기록은 그대로 남아 있습니다.
            </p>
          )}
        </div>

        {card.status === 'ready' && (
          <a className="record-card__download" href={card.url} download={`${code}.png`}>
            <Download aria-hidden="true" size={16} strokeWidth={1.25} />
            이미지로 저장
            <span className="meta">{code}.png</span>
          </a>
        )}
      </div>
    </section>
  );
}

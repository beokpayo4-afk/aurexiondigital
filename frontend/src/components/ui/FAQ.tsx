import { useId, useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

type FAQProps = {
  items: readonly FaqItem[];
};

export function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;
        return (
          <div key={item.question} className="py-2">
            <h3 className="text-base">
              <button
                id={buttonId}
                type="button"
                className="flex w-full items-center justify-between gap-6 py-4 text-left font-medium text-ink"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
              >
                {item.question}
                <span aria-hidden="true" className="text-champagne-deep">
                  {open ? "–" : "+"}
                </span>
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open}>
              <p className="max-w-3xl pb-5 text-sm leading-6 text-ink/75">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

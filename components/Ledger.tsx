import { COMPONENTS } from "@/lib/formula";
import { CREDIT_INDEXES, DEBIT_INDEXES, componentValue, signed } from "@/lib/format";

type Props = { v: number[]; c: number[]; glue: number };

/**
 * A player's score written out as a two-ink ledger: seven credits, seven debits,
 * each row showing the raw count and what it moved the score by.
 */
export function Ledger({ v, c, glue }: Props) {
  const scale = Math.max(1, ...c.map(Math.abs));
  const sum = (indexes: number[]) => indexes.reduce((a, i) => a + c[i], 0);

  const group = (title: string, indexes: number[]) => (
    <div className="ledger-group" role="rowgroup">
      <div className="ledger-head" role="row">
        <span role="columnheader">{title}</span>
        <span role="columnheader" className="num">
          Count
        </span>
        <span role="columnheader" className="ledger-axis">
          Hurt · Helped
        </span>
        <span role="columnheader" className="num">
          {signed(sum(indexes))}
        </span>
      </div>
      {indexes.map((i) => {
        const value = c[i];
        const width = (Math.abs(value) / scale) * 50;
        return (
          <div className="ledger-row" role="row" key={COMPONENTS[i].key}>
            <span role="cell">{COMPONENTS[i].label}</span>
            <span role="cell" className="num ledger-count">
              {componentValue(i, v[i])}
            </span>
            <span role="cell" className="ledger-track">
              <i className={value < 0 ? "bar bar-down" : "bar bar-up"} style={{ width: `${width}%` }} />
            </span>
            <span role="cell" className={`num ${value < 0 ? "down" : "up"}`}>
              {signed(value)}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="ledger" role="table" aria-label="Score breakdown">
      {group("Credits", CREDIT_INDEXES)}
      {group("Debits", DEBIT_INDEXES)}
      <div className="ledger-total" role="row">
        <span role="cell">GLUE</span>
        <span role="cell" className="num">
          {signed(glue)}
        </span>
      </div>
    </div>
  );
}

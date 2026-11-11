import type { Metadata } from "next";
import Link from "next/link";
import { Ledger } from "@/components/Ledger";
import { Page } from "@/components/Page";
import { getIndex, getLatestCompleteSeason } from "@/lib/data";
import { BASELINE_MIN_GAMES, COMPONENTS, STAR_USAGE, USAGE_INDEX, VERSION } from "@/lib/formula";
import { count, signed } from "@/lib/format";

export const metadata: Metadata = { title: "Method" };

const Z_SCORE = `<math display="block"><mrow>
  <msub><mi>z</mi><mrow><mi>p</mi><mo>,</mo><mi>i</mi></mrow></msub><mo>=</mo>
  <mfrac>
    <mrow><msub><mi>x</mi><mrow><mi>p</mi><mo>,</mo><mi>i</mi></mrow></msub><mo>−</mo><msub><mover><mi>x</mi><mo>¯</mo></mover><mi>i</mi></msub></mrow>
    <msub><mi>s</mi><mi>i</mi></msub>
  </mfrac>
</mrow></math>`;

const DEVIATION = `<math display="block"><mrow>
  <msub><mi>s</mi><mi>i</mi></msub><mo>=</mo>
  <msqrt><mrow>
    <mfrac><mn>1</mn><mrow><mi>n</mi><mo>−</mo><mn>1</mn></mrow></mfrac>
    <munderover><mo>∑</mo><mrow><mi>p</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover>
    <msup><mrow><mo>(</mo><msub><mi>x</mi><mrow><mi>p</mi><mo>,</mo><mi>i</mi></mrow></msub><mo>−</mo><msub><mover><mi>x</mi><mo>¯</mo></mover><mi>i</mi></msub><mo>)</mo></mrow><mn>2</mn></msup>
  </mrow></msqrt>
</mrow></math>`;

const GLUE = `<math display="block"><mrow>
  <msub><mi>GLUE</mi><mi>p</mi></msub><mo>=</mo>
  <munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mn>14</mn></munderover>
  <msub><mi>w</mi><mi>i</mi></msub><mo>&#x2062;</mo><msub><mi>z</mi><mrow><mi>p</mi><mo>,</mo><mi>i</mi></mrow></msub>
</mrow></math>`;

const Equation = ({ mathml }: { mathml: string }) => (
  <div className="card equation" dangerouslySetInnerHTML={{ __html: mathml }} />
);

export default async function MethodPage() {
  const [board, index] = await Promise.all([getLatestCompleteSeason(), getIndex()]);
  const leader = board.players[0];
  const sd = (key: string) => board.sd[COMPONENTS.findIndex((c) => c.key === key)];
  const weight = (key: string) => Math.abs(COMPONENTS.find((c) => c.key === key)!.weight);

  // Free throws: one make earns w/s, one miss costs w/s. The break-even percentage
  // is where a trip to the line is worth exactly nothing.
  const make = weight("ftm") / sd("ftm");
  const miss = weight("mft") / sd("mft");
  const breakEven = (miss / (make + miss)) * 100;

  return (
    <Page id="method">
      <header className="page-head">
        <div>
          <p className="meta">Method, version {VERSION}</p>
          <h1 className="page-title">How GLUE is calculated</h1>
          <p className="page-sub">
            GLUE measures the player who wins possessions and avoids mistakes without needing the ball. Every
            number in it comes from play-by-play events
          </p>
        </div>
      </header>

      <div className="prose">
        <p className="acronym" aria-label="GLUE stands for Gritty, Low-Usage, Errorless">
          <span>
            <b>G</b>ritty
          </span>
          <span>
            <b>L</b>ow-<b>U</b>sage
          </span>
          <span>
            <b>E</b>rrorless
          </span>
        </p>

        <h2>The name is the formula</h2>
        <p>
          The three words are the three parts of the calculation. <strong>Gritty</strong> is seven kinds of event that
          win a possession or points without a play being called for you. <strong>Low-usage</strong> is a penalty on
          the share of possessions a player finishes while on the floor. <strong>Errorless</strong> is six kinds of
          event that hand possessions or points back, each one a deduction. A high GLUE score means a player was all
          three at once.
        </p>
        <p>
          Zero is the average qualified player. A positive score means a player gave his team more than he cost it in
          these fourteen columns. It does not mean he is a better player than someone with a negative score. Most
          franchise players score below zero, because carrying an offense costs usage and turnovers by definition.
        </p>

        <h2>The mathematics</h2>
        <h3>1. Standardize each component</h3>
        <p>
          For every component <em>i</em>, take each player&rsquo;s raw value <em>x</em> and express it as a z-score:
          how many standard deviations it sits above or below the mean of the comparison pool.
        </p>
        <Equation mathml={Z_SCORE} />
        <p>
          The deviation is the sample standard deviation over the <em>n</em> players, or player-games, in the pool.
        </p>
        <Equation mathml={DEVIATION} />
        <p>
          Standardizing puts counts with very different sizes on one scale. A season leader might have 150 steals and
          12 offensive fouls drawn. As z-scores both are simply &ldquo;far above average&rdquo;.
        </p>

        <h3>2. Weight and sum</h3>
        <p>Multiply each z-score by its weight and add the fourteen results. Credits carry positive weights, debits negative.</p>
        <Equation mathml={GLUE} />
        <p>
          Every count is a raw total, not a per-minute rate. A player earns GLUE by being on the floor and doing these
          things, so availability counts. Usage is the one rate, and it is what stops high-minute stars from winning
          on volume.
        </p>
      </div>

      <div className="prose">
        <h2>Components and weights</h2>
        <p>
          Weights descend by possession impact. Events that flip a possession sit at 1.0 to 1.1, events that gift
          points at 0.8 to 0.9, and skill signals and carelessness taxes at 0.3 to 0.7. The last column is what one
          event was worth in {board.season}: the weight divided by that season&rsquo;s standard deviation.
        </p>
      </div>
      <div className="method-table table-scroll">
        <table className="board">
          <thead>
            <tr>
              <th scope="col" className="col-name">
                Component
              </th>
              <th scope="col" className="num nowrap">
                Weight
              </th>
              <th scope="col">Why it counts</th>
              <th scope="col">pbpstats field</th>
              <th scope="col" className="num nowrap">
                GLUE per event
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPONENTS.map((c, i) => (
              <tr key={c.key}>
                <th scope="row" className="col-name nowrap">
                  {c.label}
                </th>
                <td className={`num nowrap ${c.side === "credit" ? "up" : "down"}`}>{signed(c.weight, 1)}</td>
                <td className="col-team">{c.why}</td>
                <td>
                  <code>{c.source}</code>
                </td>
                <td className="num nowrap">
                  {signed(c.weight / board.sd[i], 3)}
                  {i === USAGE_INDEX ? " per point" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prose">
        <h2>A worked example</h2>
        <p>
          <Link href={`/player/${leader.id}`}>{leader.name}</Link> led {board.season} at {signed(leader.glue)}. Each
          row is one component: his raw count, then the weighted z-score it produced. The fourteen rows add up to his
          score.
        </p>
      </div>
      <div className="card lead-card method-example">
        <Ledger v={leader.v} c={leader.c} glue={leader.glue} />
      </div>

      <div className="prose">
        <h2>Who is compared with whom</h2>
        <h3>Seasons</h3>
        <p>
          The pool is every player with at least 1,000 minutes in that regular season. During a season, and in
          shortened seasons, the bar scales with games played: 1,000 × team games ÷ 82. {board.season} had{" "}
          {board.players.length} qualified players.
        </p>
        <h3>Single games</h3>
        <p>
          A player needs 15 minutes in the game. He is not compared with the other players on that night&rsquo;s
          slate, because a two-game night would make an ordinary line look historic. He is compared with every
          qualified player-game of the season to date, that night included. In the first weeks of a season that pool
          is thin, so it is topped up with the nearest games outside it until it holds{" "}
          {count(BASELINE_MIN_GAMES)} player-games. The pool used is printed under the date on every night.
        </p>
        <p>
          Because a night is scored against the season as it stood, an old night&rsquo;s scores do not change when you
          look back at it.
        </p>
        <h3>Careers</h3>
        <p>
          Career GLUE is the sum of a player&rsquo;s completed, qualified season scores. Since zero is an average
          season, the total works like a running balance: years above average add to it and years below draw it down.
          Play-by-play did not record who drew offensive and loose ball fouls before {index.careerSeasons.first}, so
          careers start there. Seasons before that are missing two of the fourteen columns and are not scored.
        </p>

        <h2>Stars and value</h2>
        <p>Every season board has two extra views. Neither changes a score. They only change who is on the list.</p>
        <h3>Gluiest stars</h3>
        <p>
          The players at {STAR_USAGE}% usage or more, ranked by GLUE. Usage is the heaviest debit in the formula, so
          these players start a long way behind. A star who still scores above zero is doing the small things on top
          of carrying an offense, and there are only a handful each year.
        </p>
        <h3>Value</h3>
        <p>
          GLUE divided by this season&rsquo;s salary in millions, for players with a positive score. Players below
          zero are left out, because a ratio of a negative score to a salary does not rank anything sensibly. Salary
          and average annual value come from Basketball Reference&rsquo;s contracts table. It lists current deals
          only, so the value view exists for the current season and not for past ones. Two-way players have no
          listed salary and are left out.
        </p>

        <h2>Calibration</h2>
        <p>The weights were audited against a correlation matrix, per-event values and a ±20% perturbation test.</p>
        <ul>
          <li>
            <strong>Free throws break even at {breakEven.toFixed(1)}%.</strong> One make was worth {signed(make, 3)} in{" "}
            {board.season} and one miss {signed(-miss, 3)}. A trip to the line pays off for anyone shooting above{" "}
            {breakEven.toFixed(1)}%, a little under the league average. An earlier weighting put the line at 83.9%,
            which punished average shooters for drawing contact.
          </li>
          <li>
            <strong>Loose ball fouls drawn is trimmed to 0.4.</strong> It correlates with offensive rebounds at r =
            0.78, since both come from the same scrums. At full weight it paid rim-running bigs twice.
          </li>
          <li>
            <strong>The rankings are stable.</strong> Randomly moving every weight by up to 20% keeps about 18 of the
            same top 20 players.
          </li>
        </ul>

        <h2>Left out on purpose</h2>
        <ul>
          <li className="cut">
            <strong>Raw blocks.</strong> Only recovered blocks count. A block sent into the stands returns the ball to
            the offense.
          </li>
          <li className="cut">
            <strong>Dead-ball turnovers.</strong> Only live-ball turnovers are penalized. Offensive fouls, the costliest
            dead-ball kind, have their own column.
          </li>
          <li className="cut">
            <strong>Second chance points.</strong> They correlate with offensive rebounds at r = 0.72 and reward
            finishing, which let stars back in.
          </li>
          <li className="cut">
            <strong>Minutes as a penalty.</strong> It punishes the players coaches trust most. Usage does that job.
          </li>
          <li className="cut">
            <strong>Scoring and playmaking volume.</strong> Other metrics cover them well.
          </li>
          <li className="cut">
            <strong>Defensive goaltends and travels.</strong> Too rare to carry signal.
          </li>
          <li className="cut">
            <strong>Screen assists and deflections.</strong> Not yet. They live only in the NBA&rsquo;s hustle
            tracking, which cannot be pulled automatically.
          </li>
        </ul>

        <h2>Data</h2>
        <p>
          Every number comes from <a href="https://www.pbpstats.com">pbpstats.com</a>, which derives it from NBA
          play-by-play. Regular season only. A job runs each morning after the West Coast games end, pulls the
          night, re-pulls the two nights before it to catch stat corrections, and rebuilds this site.
        </p>
        <p>
          Each board is also published as JSON, for example <a href="/data/latest.json">/data/latest.json</a>,{" "}
          <code>/data/glue-{index.latest}.json</code> and <code>/data/season-{board.season}.json</code>.
        </p>
        <p>
          Older seasons log offensive fouls and charges less consistently than recent ones. Scores are standardized
          within each season, so comparisons inside a season hold, but treat small gaps between eras with care.
        </p>
      </div>
    </Page>
  );
}

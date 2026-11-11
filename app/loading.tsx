/** Shown while a page that was not already loaded is on its way: the shape of a board, no content. */
export default function Loading() {
  return (
    <div className="page skeleton" role="status" aria-label="Loading">
      <div className="page-head">
        <div>
          <div className="bone bone-meta" />
          <div className="bone bone-title" />
          <div className="bone bone-sub" />
        </div>
      </div>
      <div className="lead">
        <div className="bone bone-card" />
        <div className="bone-list">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="bone bone-row" />
          ))}
        </div>
      </div>
    </div>
  );
}

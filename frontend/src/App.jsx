import { startTransition, useMemo, useState } from "react";
import "./App.css";

const API_URL = `${import.meta.env.VITE_API_BASE_URL || "https://hierarchy-studio-api.onrender.com"}/`;
const SAMPLE_INPUT = JSON.stringify(
  ["A->B", "A->C", "B->D", "M->N", "N->O", "Q->R", "R->Q", "hello"],
  null,
  2,
);

function countVisibleNodes(tree) {
  return Object.entries(tree).reduce((total, [, children]) => {
    return total + 1 + countVisibleNodes(children);
  }, 0);
}

function renderJson(value) {
  return JSON.stringify(value, null, 2);
}

function TreeBranch({ label, childrenMap }) {
  const childEntries = Object.entries(childrenMap);

  return (
    <li className="tree-branch">
      <div className="tree-pill">
        <span className="tree-pill__dot" />
        <span>{label}</span>
      </div>
      {childEntries.length > 0 && (
        <ul className="tree-children">
          {childEntries.map(([child, nested]) => (
            <TreeBranch key={child} label={child} childrenMap={nested} />
          ))}
        </ul>
      )}
    </li>
  );
}

function HierarchyTree({ hierarchy }) {
  const rootEntries = Object.entries(hierarchy.tree || {});

  if (hierarchy.has_cycle) {
    return (
      <div className="empty-state empty-state--warning">
        <p>This component contains a cycle, so a clean tree cannot be rendered.</p>
      </div>
    );
  }

  if (rootEntries.length === 0) {
    return (
      <div className="empty-state">
        <p>No renderable tree nodes were returned for this hierarchy.</p>
      </div>
    );
  }

  return (
    <div className="tree-panel">
      <ul className="tree-root-list">
        {rootEntries.map(([root, nested]) => (
          <TreeBranch key={root} label={root} childrenMap={nested} />
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  const [inputValue, setInputValue] = useState(SAMPLE_INPUT);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState("trees");

  const summaryCards = useMemo(() => {
    if (!result) {
      return [];
    }

    const totalNodes = result.hierarchies.reduce((sum, hierarchy) => {
      return sum + (hierarchy.node_count || 0);
    }, 0);

    return [
      { label: "Trees", value: result.summary.total_trees },
      { label: "Cycles", value: result.summary.total_cycles },
      { label: "Largest Root", value: result.summary.largest_tree_root || "-" },
      { label: "Nodes Mapped", value: totalNodes },
    ];
  }, [result]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    let parsedInput;

    try {
      parsedInput = JSON.parse(inputValue);
    } catch {
      setIsLoading(false);
      setResult(null);
      setErrorMessage('Enter valid JSON, for example ["A->B", "B->C"].');
      return;
    }

    if (!Array.isArray(parsedInput)) {
      setIsLoading(false);
      setResult(null);
      setErrorMessage("The request body must be a JSON array of edges.");
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: parsedInput }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || `API request failed with status ${response.status}.`);
      }

      startTransition(() => {
        setResult(payload);
        setView("trees");
      });
    } catch (error) {
      startTransition(() => {
        setResult(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Something went wrong while calling /bfhl.",
        );
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">SRM Full Stack Assignment</p>
          <h1>Hierarchy Studio</h1>
          <p className="hero__text">
            Paste your node list, send it to <code>/bfhl</code>, and inspect the result as
            readable tree cards, health metrics, and raw JSON.
          </p>
          <div className="hero__meta">
            <span>Single-page frontend</span>
            <span>Readable API output</span>
            <span>Clear failure states</span>
          </div>
        </div>

        <aside className="hero__panel">
          <div className="mini-card">
            <p className="mini-card__label">API target</p>
            <p className="mini-card__value">{API_URL}</p>
          </div>
          <div className="mini-card">
            <p className="mini-card__label">Evaluator-ready notes</p>
            <ul className="mini-card__list">
              <li>POSTs JSON to `/bfhl`</li>
              <li>Surfaces API and parsing errors clearly</li>
              <li>Shows both tree view and raw response</li>
            </ul>
          </div>
        </aside>
      </section>

      <section className="workspace">
        <form className="composer card" onSubmit={handleSubmit}>
          <div className="section-head">
            <div>
              <p className="section-kicker">Input</p>
              <h2>Node list payload</h2>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setInputValue(SAMPLE_INPUT)}
            >
              Load sample
            </button>
          </div>

          <p className="section-copy">
            Enter a JSON array of edges. Each valid edge should look like <code>A-&gt;B</code>.
          </p>

          <textarea
            className="composer__textarea"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            spellCheck="false"
            rows={14}
            placeholder='["A->B", "A->C", "B->D"]'
          />

          <div className="composer__footer">
            <p className="hint">
              Tip: change <code>VITE_API_BASE_URL</code> before deployment so the frontend calls
              your hosted API.
            </p>
            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Submit to /bfhl"}
            </button>
          </div>
        </form>

        <div className="results">
          {errorMessage && (
            <div className="alert alert--error">
              <p className="alert__title">Request failed</p>
              <p>{errorMessage}</p>
            </div>
          )}

          {!result && !errorMessage && (
            <div className="empty-state card empty-state--large">
              <p className="section-kicker">Output</p>
              <h2>Run the analyzer to see your hierarchies</h2>
              <p>
                The response will appear here as a polished tree explorer plus a raw JSON tab for
                easy evaluator review.
              </p>
            </div>
          )}

          {result && (
            <>
              <div className="summary-grid">
                {summaryCards.map((card) => (
                  <article key={card.label} className="stat card">
                    <p className="stat__label">{card.label}</p>
                    <p className="stat__value">{card.value}</p>
                  </article>
                ))}
              </div>

              <div className="identity-grid">
                <article className="identity card">
                  <p className="stat__label">User ID</p>
                  <p className="identity__value">{result.user_id}</p>
                </article>
                <article className="identity card">
                  <p className="stat__label">Email</p>
                  <p className="identity__value">{result.email_id}</p>
                </article>
                <article className="identity card">
                  <p className="stat__label">College Roll Number</p>
                  <p className="identity__value">{result.college_roll_number}</p>
                </article>
              </div>

              <div className="view-switcher">
                <button
                  type="button"
                  className={view === "trees" ? "switch is-active" : "switch"}
                  onClick={() => setView("trees")}
                >
                  Trees
                </button>
                <button
                  type="button"
                  className={view === "issues" ? "switch is-active" : "switch"}
                  onClick={() => setView("issues")}
                >
                  Issues
                </button>
                <button
                  type="button"
                  className={view === "json" ? "switch is-active" : "switch"}
                  onClick={() => setView("json")}
                >
                  Raw JSON
                </button>
              </div>

              {view === "trees" && (
                <div className="hierarchy-grid">
                  {result.hierarchies.map((hierarchy, index) => (
                    <article key={`${hierarchy.root}-${index}`} className="hierarchy card">
                      <div className="hierarchy__header">
                        <div>
                          <p className="section-kicker">Hierarchy {index + 1}</p>
                          <h3>{hierarchy.root}</h3>
                        </div>
                        <span
                          className={hierarchy.has_cycle ? "status status--danger" : "status"}
                        >
                          {hierarchy.has_cycle ? "Cycle detected" : `Depth ${hierarchy.depth || 0}`}
                        </span>
                      </div>

                      <div className="hierarchy__meta">
                        <span>{hierarchy.node_count || countVisibleNodes(hierarchy.tree || {})} nodes</span>
                        <span>{(hierarchy.roots || []).join(", ") || hierarchy.root} root set</span>
                      </div>

                      <HierarchyTree hierarchy={hierarchy} />
                    </article>
                  ))}
                </div>
              )}

              {view === "issues" && (
                <div className="issues-grid">
                  <article className="card">
                    <div className="section-head">
                      <div>
                        <p className="section-kicker">Invalid</p>
                        <h3>Rejected entries</h3>
                      </div>
                      <span className="status">{result.invalid_entries.length}</span>
                    </div>
                    <div className="chip-wrap">
                      {result.invalid_entries.length > 0 ? (
                        result.invalid_entries.map((entry, index) => (
                          <span key={`${entry}-${index}`} className="chip chip--danger">
                            {entry || "(empty)"}
                          </span>
                        ))
                      ) : (
                        <p className="muted">No invalid entries found.</p>
                      )}
                    </div>
                  </article>

                  <article className="card">
                    <div className="section-head">
                      <div>
                        <p className="section-kicker">Duplicate</p>
                        <h3>Repeated edges</h3>
                      </div>
                      <span className="status">{result.duplicate_edges.length}</span>
                    </div>
                    <div className="chip-wrap">
                      {result.duplicate_edges.length > 0 ? (
                        result.duplicate_edges.map((entry, index) => (
                          <span key={`${entry}-${index}`} className="chip">
                            {entry}
                          </span>
                        ))
                      ) : (
                        <p className="muted">No duplicate edges found.</p>
                      )}
                    </div>
                  </article>
                </div>
              )}

              {view === "json" && (
                <article className="card json-card">
                  <div className="section-head">
                    <div>
                      <p className="section-kicker">Response</p>
                      <h3>Raw API output</h3>
                    </div>
                  </div>
                  <pre>{renderJson(result)}</pre>
                </article>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

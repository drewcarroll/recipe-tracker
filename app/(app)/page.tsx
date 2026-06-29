/**
 * Cook tab — the default landing route (`/`). The guided cook flow (idea.md §3)
 * arrives in a later task; for now this is the prominent "COOK" entry point.
 */
export default function CookPage(): JSX.Element {
  return (
    <section className="tab-page">
      <h1 className="tab-title">Let&rsquo;s Cook</h1>
      <p className="tab-subtitle">Pick a recipe and cook it step by step.</p>
      <button className="cook-button" type="button">
        COOK
      </button>
    </section>
  );
}

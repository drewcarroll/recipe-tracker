export default function HomePage() {
  return (
    <main>
      <h1>🍳 Recipe Tracker</h1>
      <p>
        A production-ready starter built with <strong>Next.js</strong>, <strong>React</strong>,{' '}
        <strong>Supabase</strong> and <strong>TypeScript</strong>, organised with{' '}
        <strong>Clean Architecture</strong>.
      </p>
      <h2>API</h2>
      <ul>
        <li>
          <code>GET /api/recipes</code> — list all recipes
        </li>
        <li>
          <code>POST /api/recipes</code> — create a recipe
        </li>
        <li>
          <code>GET /api/recipes/:id</code> — fetch a single recipe
        </li>
      </ul>
      <p>See the README for setup instructions and the architecture overview.</p>
    </main>
  );
}

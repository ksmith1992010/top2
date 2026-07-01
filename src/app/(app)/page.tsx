export default function HomePage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p>Auth foundation is active. CRM features arrive in later PRs.</p>
      <p>Session check: fetch `/api/auth/me` while signed in.</p>
    </main>
  );
}

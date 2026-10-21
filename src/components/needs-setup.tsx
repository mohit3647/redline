export function NeedsSetup() {
  return (
    <section className="auth-sheet on-light" aria-labelledby="setup-title">
      <p className="auth-kicker">Not available yet</p>
      <h1 id="setup-title" className="auth-title">Sign-in is not set up on this deployment yet.</h1>
      <p className="auth-body">
        Redline keeps your session with an account service, and this deployment has none connected. There is
        nothing to sign in to until the person running it adds one.
      </p>
      <p className="auth-body"><a href="/">Back to the home page</a></p>
    </section>
  );
}

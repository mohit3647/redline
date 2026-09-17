import type { CSSProperties } from 'react';
import LandingBehaviour from './landing-behaviour';

export default function Home() {
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>

      <header className="top">
        <a className="mark-word" href="/" aria-label="Redline home">
          <span className="tag-hang"><span className="tag tag--critical"><b>Redline</b></span></span>
        </a>
        <a className="top-link" href="/sign-in">Sign in</a>
      </header>

      <main id="main">
        <div className="hero">
          <div className="hero-copy">
            <h1>Every risk, tied to <em>the sentence</em> it came from.</h1>
            <div className="peek" aria-hidden="true">
              <p className="peek-sent"><span className="m m-critical" data-quote="">The Contractor shall indemnify and hold harmless the Client against any and all claims, losses, damages and legal fees arising from or relating to the Services.</span></p>
              <svg className="peek-string" viewBox="0 0 60 36" width="60" height="36"><path d="M44 0 C44 18, 17 14, 17 36" className="under"/><path d="M44 0 C44 18, 17 14, 17 36" className="over"/><circle cx="44" cy="3" r="4.5" className="grommet"/></svg>
              <span className="tag-hang"><span className="tag tag--critical"><span className="tag-top"><span className="tag-no">No. 1</span><span className="stamp">Critical</span></span><span className="tag-claim">You cover all of the client's losses and legal fees from the work, and the clause sets no limit.</span></span></span>
            </div>
            <p className="lede">Upload a client agreement before you sign it. Redline ranks the clauses that could cost you, quotes the exact sentence behind each one, and drafts the change to ask your client for.</p>
            <div className="cta-row">
              <a className="cta" href="/sign-in">
                <span className="tag-hang"><span className="tag tag--blank"><b>Try it on your agreement</b></span></span>
              </a>
            </div>
            <ul className="scope">
              <li>For freelance client agreements you haven't signed yet</li>
              <li>Documents with selectable text, not scans or photos</li>
              <li>Not legal advice, and no verdict on whether to sign</li>
            </ul>
          </div>

          <div className="stage" data-stage>
            <svg className="strings" aria-hidden="true" focusable="false"></svg>
            <div className="stage-grid">

            <article className="sheet" aria-labelledby="sample-title" id="sample">
              <div className="sheet-head">
                <span className="stamp">Sample</span>
                <p>Written for this page to show how Redline reads an agreement. It is not a real client's contract, and the analysis beside it is a demonstration.</p>
              </div>
              <h2 id="sample-title">Design Services Agreement</h2>
              <p className="parties">Between the Client and the Contractor</p>
              <ol data-source>
                <li><strong>Services.</strong> The Contractor will design a brand identity and a twelve-page website for the Client.</li>
                <li><strong>Fees.</strong> The Client will pay the Contractor a fixed fee of $6,000, invoiced in two equal parts. Invoices are payable within 30 days of receipt.</li>
                <li><strong>Revisions.</strong> The fee includes up to two rounds of revisions on each deliverable.</li>
                <li><strong>Ownership.</strong> <mark className="m m-critical" id="s-ip" data-tag="2">The Contractor assigns to the Client all right, title and interest in any work, materials, tools or know-how created or used by the Contractor during the term of this Agreement, whether or not related to the Services.</mark><a className="chip chip--critical" href="#flag-2" data-tag="2" aria-label="Flag 2: see what it could cost and what to ask for">2</a></li>
                <li><strong>Indemnity.</strong> <mark className="m m-critical" id="s-indemnity" data-tag="1">The Contractor shall indemnify and hold harmless the Client against any and all claims, losses, damages and legal fees arising from or relating to the Services.</mark><a className="chip chip--critical" href="#flag-1" data-tag="1" aria-label="Flag 1: see what it could cost and what to ask for">1</a></li>
                <li><strong>Termination.</strong> <mark className="m m-serious" id="s-termination" data-tag="3">The Client may terminate this Agreement at any time, for any reason, on written notice, and will owe only for work delivered before the notice date.</mark><a className="chip chip--serious" href="#flag-3" data-tag="3" aria-label="Flag 3: see what it could cost and what to ask for">3</a></li>
                <li><strong>Confidentiality.</strong> <mark className="m m-notice" id="s-confidential" data-tag="4">The Contractor will not disclose the terms of this Agreement or any Client information to any third party.</mark><a className="chip chip--notice" href="#before-upload" data-tag="4" aria-label="Flag 4: read before uploading">4</a></li>
                <li><strong>Disputes.</strong> Any dispute will be resolved by binding arbitration in the Client's home state.</li>
              </ol>
            </article>

            <ol className="rail" aria-label="Flags on the sample, ranked by what they could cost">
              <li style={{ '--i': 0 } as CSSProperties}><a className="tag-hang" href="#flag-1" data-tag="1" data-for="s-indemnity" data-tier="critical"><span className="tag tag--critical"><span className="eye"></span>
                <span className="tag-top"><span className="tag-no">No. 1</span><span className="stamp">Critical</span></span>
                <span className="tag-claim">You cover all of the client's losses and legal fees from the work, and the clause sets no limit.</span>
                <span className="tag-range">If used: from a demand letter to costs many times your $6,000 fee.</span></span></a></li>
              <li style={{ '--i': 1 } as CSSProperties}><a className="tag-hang" href="#flag-2" data-tag="2" data-for="s-ip" data-tier="critical"><span className="tag tag--critical"><span className="eye"></span>
                <span className="tag-top"><span className="tag-no">No. 2</span><span className="stamp">Critical</span></span>
                <span className="tag-claim">You hand over everything you make or use during the project, including your own tools.</span>
                <span className="tag-range">If used: from one template you can no longer reuse to every future job built on your own tools.</span></span></a></li>
              <li style={{ '--i': 2 } as CSSProperties}><a className="tag-hang" href="#flag-3" data-tag="3" data-for="s-termination" data-tier="serious"><span className="tag tag--serious"><span className="eye"></span>
                <span className="tag-top"><span className="tag-no">No. 3</span><span className="stamp">Serious</span></span>
                <span className="tag-claim">The client can end the agreement at any time and pays only for work already delivered.</span>
                <span className="tag-range">If used: anywhere from nothing to the second $3,000 payment.</span></span></a></li>
              <li style={{ '--i': 3 } as CSSProperties}><a className="tag-hang" href="#before-upload" data-tag="4" data-for="s-confidential" data-tier="notice"><span className="tag tag--notice"><span className="eye"></span>
                <span className="tag-top"><span className="tag-no">No. 4</span><span className="stamp" style={{ color: 'var(--field)' }}>Before upload</span></span>
                <span className="tag-claim">This clause bars sharing the agreement's terms. Uploading sends its text to an AI model provider.</span></span></a></li>
            </ol>
            </div>
          </div>
        </div>

        <section className="on-light" id="ranked" aria-labelledby="ranked-title">
          <div className="sec-head">
            <h2 id="ranked-title">Ranked by what each could cost you</h2>
            <p>Severity is expected cost: how likely a clause is to be used against you, times what it costs when it is. Critical tags carry two punched holes and Serious tags one, so the rank reads without colour.</p>
          </div>
          <div className="flags-wrap" data-ties>
          <svg className="strings ties" aria-hidden="true" focusable="false"></svg>
          <ol className="flags">
            <li className="flag" id="flag-1" data-tier="critical">
              <div><span className="tag-hang"><span className="tag tag--critical tag--flip"><span className="eye"></span>
                <span className="tag-top"><span className="tag-no">No. 1</span><span className="stamp">Critical</span></span>
                <span className="tag-claim">You cover all of the client's losses and legal fees from the work, and the clause sets no limit.</span>
                <span className="tag-range">If used: from a demand letter to costs many times your $6,000 fee.</span></span></span></div>
              <div>
                <p className="label">From the agreement, clause 5</p>
                <blockquote className="quote" data-quote="">The Contractor shall indemnify and hold harmless the Client against any and all claims, losses, damages and legal fees arising from or relating to the Services.</blockquote>
                <p className="label">Ask for instead</p>
                <div className="counter-row">
                  <p className="counter" id="counter-1">The Contractor will indemnify the Client only for third-party claims caused by the Contractor's breach of this Agreement, and the Contractor's total liability under this clause will not exceed the fees paid under this Agreement.</p>
                  <button className="copy" type="button" data-copy="counter-1">Copy counter-offer</button>
                </div>
              </div>
            </li>
            <li className="flag" id="flag-2" data-tier="critical">
              <div><span className="tag-hang"><span className="tag tag--critical tag--flip"><span className="eye"></span>
                <span className="tag-top"><span className="tag-no">No. 2</span><span className="stamp">Critical</span></span>
                <span className="tag-claim">You hand over everything you make or use during the project, including your own tools.</span>
                <span className="tag-range">If used: from one template you can no longer reuse to every future job built on your own tools.</span></span></span></div>
              <div>
                <p className="label">From the agreement, clause 4</p>
                <blockquote className="quote" data-quote="">The Contractor assigns to the Client all right, title and interest in any work, materials, tools or know-how created or used by the Contractor during the term of this Agreement, whether or not related to the Services.</blockquote>
                <p className="label">Ask for instead</p>
                <div className="counter-row">
                  <p className="counter" id="counter-2">On full payment, the Contractor assigns to the Client all rights in the final deliverables. The Contractor keeps its pre-existing work, tools and know-how, and grants the Client a licence to use any of them that are included in the deliverables.</p>
                  <button className="copy" type="button" data-copy="counter-2">Copy counter-offer</button>
                </div>
              </div>
            </li>
            <li className="flag" id="flag-3" data-tier="serious">
              <div><span className="tag-hang"><span className="tag tag--serious tag--flip"><span className="eye"></span>
                <span className="tag-top"><span className="tag-no">No. 3</span><span className="stamp">Serious</span></span>
                <span className="tag-claim">The client can end the agreement at any time and pays only for work already delivered.</span>
                <span className="tag-range">If used: anywhere from nothing to the second $3,000 payment.</span></span></span></div>
              <div>
                <p className="label">From the agreement, clause 6</p>
                <blockquote className="quote" data-quote="">The Client may terminate this Agreement at any time, for any reason, on written notice, and will owe only for work delivered before the notice date.</blockquote>
                <p className="label">Ask for instead</p>
                <div className="counter-row">
                  <p className="counter" id="counter-3">If the Client terminates this Agreement for convenience, the Client will pay for all work completed to the notice date plus a kill fee of 25% of the remaining fee.</p>
                  <button className="copy" type="button" data-copy="counter-3">Copy counter-offer</button>
                </div>
              </div>
            </li>
          </ol>
          </div>
        </section>

        <section className="on-field-sec" aria-labelledby="cleared-title">
          <div className="sec-head">
            <h2 id="cleared-title">It shows what it checked and cleared</h2>
            <p>A clean result is a list of what was read, each with the sentence behind it. You never get a blank screen you can't tell apart from a failed upload.</p>
          </div>
          <div className="wire">
            <ul className="cleared">
              <li><span className="tag-hang"><span className="tag tag--cleared">
                <span className="tag-top"><span className="tag-no">Clause 2</span><span className="stamp">Cleared</span></span>
                <p className="src" data-quote="">Invoices are payable within 30 days of receipt.</p>
                <p className="note">Payment is due within a fixed 30-day period, so there is nothing here to ask your client to change.</p></span></span></li>
              <li><span className="tag-hang"><span className="tag tag--cleared">
                <span className="tag-top"><span className="tag-no">Clause 3</span><span className="stamp">Cleared</span></span>
                <p className="src" data-quote="">The fee includes up to two rounds of revisions on each deliverable.</p>
                <p className="note">Revisions are capped at two rounds per deliverable.</p></span></span></li>
              <li><span className="tag-hang"><span className="tag tag--cleared">
                <span className="tag-top"><span className="tag-no">Clause 8</span><span className="stamp">Noted</span></span>
                <p className="src" data-quote="">Any dispute will be resolved by binding arbitration in the Client's home state.</p>
                <p className="note">Disputes go to binding arbitration in the client's home state. Ranked Minor, so it is listed here rather than flagged.</p></span></span></li>
              <li><span className="tag-hang"><span className="tag tag--cleared">
                <span className="tag-top"><span className="tag-no">Not found</span><span className="stamp">Absent</span></span>
                <p className="absent">No non-compete or non-solicit clause.</p>
                <p className="note">Checked for, and the agreement doesn't contain one.</p></span></span></li>
            </ul>
          </div>
        </section>

        <section className="on-ink" id="before-upload" aria-labelledby="upload-title">
          <div className="disclose">
            <div className="sec-head">
              <h2 id="upload-title">Before you upload, know where the text goes</h2>
              <p>Many client agreements forbid sharing their terms. Redline tells you what uploading involves before you choose a file, and flags that clause when your agreement has one, like clause 7 in the sample.</p>
            </div>
            <div className="notice tag-hang">
              <div className="tag tag--notice">
                <span className="tag-top"><span className="stamp">Before upload</span></span>
                <ul>
                  <li>Your file is read in your browser. Redline keeps the text, never the file.</li>
                  <li>The text is sent to an AI model provider to be analysed.</li>
                  <li>If the agreement bars sharing its terms, that clause is flagged first.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="on-light" aria-labelledby="scope-title">
          <div className="sec-head">
            <h2 id="scope-title">What Redline reads, and what it doesn't</h2>
          </div>
          <div className="scope-grid">
            <div className="yes">
              <h3>Reads</h3>
              <ul>
                <li>Freelance client agreements, before you sign</li>
                <li>Agreements your client can still change</li>
                <li>Documents with selectable text</li>
              </ul>
            </div>
            <div className="no">
              <h3>Doesn't read</h3>
              <ul>
                <li>Scanned or photographed pages</li>
                <li>Terms of service and other take-it-or-leave-it agreements</li>
                <li>Agreements you've already signed</li>
              </ul>
            </div>
          </div>
          <div className="limits">
            <p className="limits-line">It won't tell you whether to sign, and it isn't legal advice.</p>
            <p className="limits-body">It shows what the agreement says, what each risky clause could cost, and what to ask your client for, and leaves the decision with you.</p>
          </div>
        </section>

        <section className="close" aria-labelledby="close-title">
          <h2 id="close-title">Read it before you sign it.</h2>
          <div className="cta-row">
            <a className="cta" href="/sign-in">
              <span className="tag-hang"><span className="tag tag--blank"><b>Try it on your agreement</b></span></span>
            </a>
          </div>
          <p className="small">For freelance client agreements with selectable text, and never a substitute for legal advice.</p>
        </section>
      </main>

      <footer>
        <span>Redline</span>
        <span>The sample agreement on this page was written to demonstrate Redline. It is not a real client's contract.</span>
      </footer>
      <LandingBehaviour />
    </>
  );
}

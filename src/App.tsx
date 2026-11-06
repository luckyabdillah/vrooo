import { useCallback, useEffect, useState } from 'react';
import { Logo } from './components/Brand';
import { CityScene } from './scene/CityScene';
import type { TimeOfDay } from './scene/time';

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={diagonal ? 'M5 19 19 5M8 5h11v11' : 'M4 12h16m-6-6 6 6-6 6'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const steps = [
  { number: '01', title: 'Observe', description: 'Cameras capture a live view of each approach.', glyph: '◉' },
  { number: '02', title: 'Understand', description: 'Computer vision counts vehicles and estimates queues.', glyph: '▦' },
  { number: '03', title: 'Decide', description: 'Traffic demand informs the next safe signal phase.', glyph: '⌁' },
  { number: '04', title: 'Adapt', description: 'Lights respond as road conditions change.', glyph: '↗' },
];

const benefits = [
  { index: '01', title: 'Signals that respond', copy: 'Green time follows traffic demand instead of a rigid cycle.', icon: 'signal' },
  { index: '02', title: 'Less idle waiting', copy: 'Busy approaches get attention when queues begin to build.', icon: 'clock' },
  { index: '03', title: 'A clearer picture', copy: 'See lane conditions, active phases, and system decisions together.', icon: 'eye' },
];

function BenefitIcon({ name }: { name: string }) {
  if (name === 'signal')
    return (
      <span className="benefit-signal">
        <i />
        <i />
        <i />
      </span>
    );
  if (name === 'clock')
    return (
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="2" />
        <path d="M24 13v12l8 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M5 24s7-10 19-10 19 10 19 10-7 10-19 10S5 24 5 24Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [localTime, setLocalTime] = useState<{ time: TimeOfDay; clock: string }>({ time: 'day', clock: '' });
  const updateTime = useCallback((time: TimeOfDay, clock: string) => setLocalTime({ time, clock }), []);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 36);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const timeLabel =
    localTime.time === 'dawn' ? 'Morning light' : localTime.time === 'day' ? 'Daylight' : localTime.time === 'evening' ? 'Golden hour' : 'Night view';

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}>
        <div className="header-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="Main navigation">
            <a className="nav-active" href="#home">
              Home
            </a>
            <a href="#about">About</a>
            <a className="nav-highlight" href="/playground">
              Playground
            </a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="header-right">
            <div className="time-pill" aria-label={`Local time ${localTime.clock}, ${timeLabel}`}>
              <span className="sun-icon" aria-hidden="true">
                ✳
              </span>
              <span>{localTime.clock || '—'}</span>
              <span className="time-label">{timeLabel}</span>
            </div>
            <button
              className="menu-toggle"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {[
              ['Home', '#home'],
              ['About', '#about'],
              ['Playground', '/playground'],
              ['Contact', '#contact'],
            ].map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}>
                {label}
                <ArrowIcon diagonal />
              </a>
            ))}
          </nav>
        )}
      </header>

      <main>
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-scene">
            <CityScene onTimeChange={updateTime} />
          </div>
          <div className={`hero-shade hero-shade-${localTime.time}`} />
          <div className="hero-content container">
            <p className="eyebrow hero-eyebrow">
              <span className="eyebrow-line" />
              SMARTER ROADS. BETTER FLOW.
            </p>
            <h1 id="hero-title">
              Smarter traffic
              <br />
              for a smoother
              <br />
              <em>tomorrow.</em>
            </h1>
            <p className="hero-description">Adaptive traffic signals that understand what is happening on the road and respond in real time.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="/playground">
                Explore Playground <ArrowIcon />
              </a>
              <a className="text-link text-link-light" href="#how-it-works">
                How it works <ArrowIcon diagonal />
              </a>
            </div>
          </div>
          <div className="hero-bottom container">
            <div className="scene-caption">
              <span className="scene-caption-line" />
              <span>AN INTERSECTION THAT THINKS AHEAD</span>
            </div>
            <div className="live-chip">
              <span className="live-dot" /> LIVE 3D CITY SCENE
            </div>
          </div>
        </section>

        <section className="intro-section section-pad" id="about">
          <div className="intro-grid container">
            <div>
              <p className="section-kicker">
                <span>01</span> / THE IDEA
              </p>
              <h2>
                Better movement
                <br />
                begins with{' '}
                <em>
                  better
                  <br />
                  understanding.
                </em>
              </h2>
            </div>
            <div className="intro-copy">
              <p className="intro-lead">Traffic changes every minute. Signal timing should be able to keep up.</p>
              <p>
                Trafflow is an adaptive traffic signal concept that uses camera observations and computer vision to understand vehicle flow. It turns
                lane conditions into informed, safe signal decisions—and makes the system easier to monitor.
              </p>
              <a className="text-link" href="#how-it-works">
                Discover the process <ArrowIcon diagonal />
              </a>
            </div>
          </div>
        </section>

        <section className="process-section section-pad" id="how-it-works">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="section-kicker">
                  <span>02</span> / HOW IT WORKS
                </p>
                <h2>
                  From road activity
                  <br />
                  to a smarter signal.
                </h2>
              </div>
              <p>One connected loop helps an intersection respond to the traffic it actually sees.</p>
            </div>
            <div className="steps-grid">
              {steps.map((step) => (
                <article className="step-card" key={step.number}>
                  <div className="step-top">
                    <span>{step.number}</span>
                    <span className="step-glyph" aria-hidden="true">
                      {step.glyph}
                    </span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
            <div className="process-note">
              <span className="note-dot" /> OBSERVE <span>→</span> ANALYZE <span>→</span> ADAPT <span>→</span> REPEAT
            </div>
          </div>
        </section>

        <section className="benefits-section section-pad">
          <div className="container">
            <div className="section-heading benefit-heading">
              <div>
                <p className="section-kicker">
                  <span>03</span> / WHY IT MATTERS
                </p>
                <h2>
                  Built for the way
                  <br />
                  cities really move.
                </h2>
              </div>
              <p>By reading the current road, Trafflow aims to make every signal decision more useful.</p>
            </div>
            <div className="benefit-grid">
              {benefits.map((benefit) => (
                <article className="benefit-card" key={benefit.index}>
                  <div className="benefit-icon">
                    <BenefitIcon name={benefit.icon} />
                  </div>
                  <span className="benefit-index">{benefit.index} / 03</span>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-inner container">
            <div>
              <p className="section-kicker section-kicker-light">A PROJECT WITH PURPOSE</p>
              <h2>
                Let’s make the
                <br />
                next signal <em>smarter.</em>
              </h2>
              <p>Trafflow is a Semester 5 Project Based Learning exploration of computer vision and adaptive traffic control.</p>
            </div>
            <a className="button button-outline" href="#home">
              Back to the intersection <ArrowIcon diagonal />
            </a>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-inner container">
          <Logo dark />
          <span>Smarter roads. Better flow.</span>
          <span>© {new Date().getFullYear()} Trafflow · PBL Project</span>
        </div>
      </footer>
    </>
  );
}

export default App;

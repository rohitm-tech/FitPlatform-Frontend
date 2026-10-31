import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin);
import {
  ArrowUpRight,
  ArrowRight,
  Moon,
  ShieldCheck,
  Camera,
  Activity,
  Dumbbell,
  Check,
  ScanLine,
  Users,
  LockKeyhole,
} from 'lucide-react';
import '../landing.css';
function Workflow() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.story-progress',
          { scaleY: 0.08, transformOrigin: 'top' },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 60%',
              end: 'bottom 60%',
              scrub: true,
            },
          },
        );
        gsap.utils
          .toArray<HTMLElement>('.workflow-moment', ref.current!)
          .forEach((moment) => {
            gsap.fromTo(
              moment,
              { opacity: 0.55, y: 18 },
              {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: moment,
                  start: 'top 82%',
                  once: true,
                },
              },
            );
          });
      });
      return () => media.revert();
    },
    { scope: ref },
  );
  return (
    <section id="workflow" tabIndex={-1} ref={ref} className="landing-workflow">
      <div className="workflow-intro">
        <h2>
          One day.
          <br />
          Everything connected.
        </h2>
        <p>
          From the first recovery signal
          <br />
          to your coach’s next decision.
        </p>
        <Link to="/auth/sign-in">
          See it in the demo <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="workflow-story">
        <div className="story-track" />
        <div className="story-progress" />
        {[
          [
            Moon,
            'Know where you start.',
            'Sleep, recovery and activity. Your records, with a source and a date.',
            'Recovery',
          ],
          [
            Dumbbell,
            'Put the plan into practice.',
            'Follow your session. Log sets, reps and how it felt.',
            'Training',
          ],
          [
            ShieldCheck,
            'Let the review come to you.',
            'Rules check the evidence. AI explains. Your coach approves changes.',
            'Review',
          ],
        ].map(([Icon, title, copy, label]: any) => (
          <article key={title} className="workflow-moment">
            <span className="moment-icon">
              <Icon size={20} />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <span className="moment-label">{label}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export default function Landing() {
  const reduced = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP(
    () => {
      if (!reduced)
        gsap.fromTo(
          '.hero-copy',
          { opacity: 0.7, y: 14 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        );
    },
    { scope: container, dependencies: [reduced], revertOnUpdate: true },
  );
  const scrollToWorkflow = contextSafe(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (reduced || event.detail === 0) return;
      event.preventDefault();
      history.replaceState(null, '', '#workflow');
      gsap.to(window, {
        scrollTo: { y: '#workflow', offsetY: 24, autoKill: true },
        duration: 0.65,
        ease: 'power3.out',
      });
    },
  );
  return (
    <div className="marketing-page" ref={container}>
      <section className="landing-hero">
        <div className="hero-copy">
          <h1>
            Your effort.
            <br />
            <span>A clearer direction.</span>
          </h1>
          <p>
            Training, recovery and coaching.
            <br />
            Finally, in the same conversation.
          </p>
          <div className="landing-actions">
            <Link className="landing-primary" to="/auth/sign-up">
              Find your rhythm <ArrowUpRight size={20} />
            </Link>
            <Link className="landing-secondary" to="/auth/sign-in">
              Explore the demo <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div
          className="hero-day"
          aria-label="Illustrative connected training workflow"
        >
          <div className="hero-day-top">
            <span>A day in motion</span>
            <span className="illustration-label">Product preview</span>
          </div>
          <div className="hero-signal">
            <span className="signal-orbit">
              <Moon size={28} />
            </span>
            <div>
              <small>Start with your signals</small>
              <h2>
                A little more context.
                <br />A better next step.
              </h2>
            </div>
          </div>
          <div className="hero-path">
            <div>
              <Activity size={19} />
              <span>
                Recovery
                <br />
                <strong>Recorded</strong>
              </span>
              <Check size={16} />
            </div>
            <div>
              <Dumbbell size={19} />
              <span>
                Your session
                <br />
                <strong>Planned</strong>
              </span>
              <Check size={16} />
            </div>
            <div>
              <ShieldCheck size={19} />
              <span>
                Coach review
                <br />
                <strong>In the loop</strong>
              </span>
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="hero-note">
            <span className="note-avatar">AI</span>
            <p>
              More than a plan.
              <br />
              <strong>A conversation grounded in you.</strong>
            </p>
            <Camera size={20} />
          </div>
        </div>
      </section>
      <div className="landing-capabilities">
        <span>For athletes.</span>
        <span>For coaches.</span>
        <span>For the whole gym.</span>
        <a href="#workflow" onClick={scrollToWorkflow}>
          See how it works <ArrowRight size={16} />
        </a>
      </div>
      <Workflow />
      <section className="landing-ai">
        <div className="ai-conversation-preview">
          <span className="illustration-label">What you can ask</span>
          <div className="question-example">
            <Camera size={20} />
            <span>Help me understand this meal.</span>
          </div>
          <div className="question-example">
            <Moon size={20} />
            <span>How does my recovery look?</span>
          </div>
          <div className="question-example">
            <Dumbbell size={20} />
            <span>What should I focus on today?</span>
          </div>
          <div className="preview-context">
            <span>Training history</span>
            <span>Recovery records</span>
            <span>Your photos</span>
          </div>
        </div>
        <div>
          <h2>
            Ask more.
            <br />
            Train with context.
          </h2>
          <p>
            An AI companion that knows your recent training.
            <br />
            Add a question, a check-in or a photo.
          </p>
          <Link to="/auth/sign-in" className="landing-secondary">
            Meet your companion <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section id="features" className="landing-features">
        <div>
          <h2>
            Built for
            <br />
            the whole team.
          </h2>
          <p>
            One platform.
            <br />A workspace for everyone.
          </p>
        </div>
        <div className="feature-rows">
          {[
            [
              Activity,
              'Athletes',
              'Recovery check-ins · Watch-data imports · Training calendar · Progress insights · AI chat and photos',
            ],
            [
              Users,
              'Coaches',
              'Athlete overview · Session builder · Group assignment · Automatic reviews · Approval queue',
            ],
            [
              ScanLine,
              'Gyms',
              'Attendance · Member invitations · Branding · QR and PIN kiosks · 3D muscle explorer',
            ],
            [
              LockKeyhole,
              'Your account',
              'Approved staff access · Sharing controls · Private gallery · Data export and deletion',
            ],
          ].map(([Icon, title, copy]: any) => (
            <div key={title}>
              <Icon size={21} />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="landing-close">
        <div>
          <h2>
            Make your next
            <br />
            session count.
          </h2>
          <p>Start as an athlete. Bring your coach into the loop.</p>
        </div>
        <Link className="landing-primary" to="/auth/sign-up">
          Start your journey <ArrowUpRight size={20} />
        </Link>
      </section>
      <footer className="landing-footer">
        <Link className="product-brand" to="/">
          fitplatform<span>.</span>
        </Link>
        <p>Thoughtful training. Human judgment.</p>
        <div>
          <Link to="/auth/sign-in">Sign in</Link>
          <Link to="/auth/sign-up">Create account</Link>
        </div>
        <small>
          Wearable imports are available. Live device sync requires separate
          provider authorization.
          <br />
          AI guidance is not medical advice. Meal-photo estimates are
          approximate.
        </small>
      </footer>
    </div>
  );
}

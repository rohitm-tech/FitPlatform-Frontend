import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
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
} from "lucide-react";
import "../landing.css";
function Workflow() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".story-progress",
          { scaleY: 0.08, transformOrigin: "top" },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 60%",
              end: "bottom 60%",
              scrub: true,
            },
          },
        );
        gsap.utils
          .toArray<HTMLElement>(".workflow-moment", ref.current!)
          .forEach((moment) => {
            gsap.fromTo(
              moment,
              { opacity: 0.55, y: 18 },
              {
                opacity: 1,
                y: 0,
                duration: 0.5,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: moment,
                  start: "top 82%",
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
          Fully connected.
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
            "Know where you start.",
            "Sleep, recovery and activity. Your records, with a source and a date.",
            "Recovery",
          ],
          [
            Dumbbell,
            "Put the plan into practice.",
            "Follow your session. Log sets, reps and how it felt.",
            "Training",
          ],
          [
            ShieldCheck,
            "Let the review come to you.",
            "Rules check the evidence. AI explains. Your coach approves changes.",
            "Review",
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
function AudienceFeatures() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState("athletes");
  const groups = [
    ["athletes", "For athletes"],
    ["coaches", "For coaches"],
    ["gyms", "For gyms"],
    ["marketplace", "Marketplace"],
  ];
  const catalogue = useQuery({
    queryKey: ["landing-marketplace"],
    queryFn: async () => (await api.get("/marketplace")).data.data.listings,
  });
  const { contextSafe } = useGSAP(
    () => {
      gsap.utils
        .toArray<HTMLElement>(".audience-panel", ref.current!)
        .forEach((panel) => {
          ScrollTrigger.create({
            trigger: panel,
            start: "top 42%",
            end: "bottom 42%",
            onEnter: () => setActive(panel.dataset.audience!),
            onEnterBack: () => setActive(panel.dataset.audience!),
          });
        });
    },
    { scope: ref },
  );
  const jump = contextSafe(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      setActive(id);
      if (
        event.detail === 0 ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      event.preventDefault();
      gsap.to(window, {
        scrollTo: { y: `#for-${id}`, offsetY: 90, autoKill: true },
        duration: 0.5,
        ease: "power3.out",
      });
    },
  );
  return (
    <section id="features" className="audience-features" ref={ref}>
      <div className="audience-section-heading">
        <h2>
          Built around
          <br />
          your training.
        </h2>
        <p>One platform. A useful workspace for everyone.</p>
      </div>
      <nav className="audience-tabs" aria-label="Explore platform features">
        {groups.map(([id, label]) => (
          <a
            key={id}
            href={`#for-${id}`}
            aria-current={active === id ? "location" : undefined}
            onClick={(event) => jump(event, id)}
          >
            {label}
          </a>
        ))}
      </nav>
      <article
        className="audience-panel"
        id="for-athletes"
        data-audience="athletes"
      >
        <div className="audience-copy">
          <h3>A clearer training day.</h3>
          <p>Know where you start. Follow your session. See what’s changing.</p>
          <ul>
            <li>Recovery check-ins & watch-data imports</li>
            <li>Workouts, progress & the muscle explorer</li>
            <li>Private AI conversations, photos & notifications</li>
          </ul>
          <Link to="/auth/sign-up">
            Start as an athlete
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <figure className="audience-preview">
          <div className="preview-surface">
            <Activity size={24} />
            <h4>Your daily rhythm</h4>
            {[
              ["Recovery", "Sleep, fatigue and the source of each signal"],
              ["Training", "Your assigned session and recorded sets"],
              ["Review", "Automatic evidence, with coach-approved changes"],
            ].map(([title, copy]) => (
              <div className="preview-timeline-row" key={title}>
                <span />
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
              </div>
            ))}
          </div>
          <figcaption>Illustrative athlete workflow</figcaption>
        </figure>
      </article>
      <article
        className="audience-panel"
        id="for-coaches"
        data-audience="coaches"
      >
        <div className="audience-copy">
          <h3>
            More context.
            <br />
            Better coaching.
          </h3>
          <p>
            Spend less time chasing updates and more time on the decisions that
            matter.
          </p>
          <ul>
            <li>Athlete roster & automatic review queue</li>
            <li>Reusable templates, group assignments & notes</li>
            <li>Weekly AI drafts, with your final approval</li>
          </ul>
          <Link to="/auth/sign-in">
            Explore the coach workspace
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <figure className="audience-preview coach-preview">
          <div className="preview-surface">
            <Users size={24} />
            <h4>A decision, with evidence.</h4>
            <div className="preview-evidence">
              <div>
                <span>Recorded work</span>
                <strong>Completion evidence</strong>
              </div>
              <div>
                <span>Available signals</span>
                <strong>Recovery context</strong>
              </div>
              <div>
                <span>Your judgment</span>
                <strong>Approve or adapt</strong>
              </div>
            </div>
            <div className="preview-approval">
              <ShieldCheck size={18} />
              <p>Plan changes stay with the coach.</p>
            </div>
          </div>
          <figcaption>Illustrative coach review workflow</figcaption>
        </figure>
      </article>
      <article className="audience-panel" id="for-gyms" data-audience="gyms">
        <div className="audience-copy">
          <h3>A more connected gym floor.</h3>
          <p>
            Make check-in simple. Keep members and trainers in the same loop.
          </p>
          <ul>
            <li>Attendance, member directories & at-risk signals</li>
            <li>Paired QR/PIN kiosks & gym branding</li>
            <li>Today’s session and a real 3D muscle explorer</li>
          </ul>
          <Link to="/auth/sign-in">
            Explore gym operations
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <figure className="audience-preview">
          <div className="preview-surface">
            <ScanLine size={24} />
            <h4>From the door to the floor.</h4>
            {[
              ["Check in", "Phone-approved QR or a personal PIN"],
              ["Train", "Today’s plan on a paired kiosk"],
              ["Stay connected", "Attendance and trainer activity in one view"],
            ].map(([title, copy]) => (
              <div className="preview-gym-row" key={title}>
                <Check size={16} />
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
              </div>
            ))}
          </div>
          <figcaption>Illustrative gym-floor workflow</figcaption>
        </figure>
      </article>
      <article
        className="audience-panel"
        id="for-marketplace"
        data-audience="marketplace"
      >
        <div className="audience-copy">
          <h3>Find your next step.</h3>
          <p>
            Discover coach-made plans, coaching packages and training
            essentials.
          </p>
          <ul>
            <li>Save offerings and ask about availability</li>
            <li>Providers manage enquiries & listings</li>
            <li>Admin review before publication</li>
          </ul>
          <Link to="/marketplace">
            Explore the marketplace
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <figure className="audience-preview marketplace-preview">
          <div className="preview-surface">
            <h4>Support for what’s next.</h4>
            {catalogue.data?.slice(0, 3).map((listing: any) => (
              <Link
                className="preview-market-row"
                key={listing._id}
                to={`/marketplace/${listing.slug}`}
              >
                <div>
                  <strong>{listing.title}</strong>
                  <span>
                    {listing.duration}
                    {listing.isDemo ? " · Demo listing" : ""}
                  </span>
                </div>
                <ArrowUpRight size={17} />
              </Link>
            ))}
            {!catalogue.data?.length && (
              <p className="section-note">
                Training plans, coaching and essentials. Browse the current
                catalogue.
              </p>
            )}
            <Link className="preview-market-link" to="/marketplace">
              Browse offerings
              <ArrowUpRight size={15} />
            </Link>
          </div>
          <figcaption>
            Live catalogue · enquiries do not collect payment
          </figcaption>
        </figure>
      </article>
      <div className="audience-privacy">
        <LockKeyhole size={17} />
        <p>
          Approved staff access. Clear sharing controls. Private conversations,
          Excel/JSON exports and control of your account.
        </p>
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
          ".hero-copy",
          { opacity: 0.7, y: 14 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
        );
    },
    { scope: container, dependencies: [reduced], revertOnUpdate: true },
  );
  const scrollToWorkflow = contextSafe(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (reduced || event.detail === 0) return;
      event.preventDefault();
      history.replaceState(null, "", "#workflow");
      gsap.to(window, {
        scrollTo: { y: "#workflow", offsetY: 24, autoKill: true },
        duration: 0.65,
        ease: "power3.out",
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
            <span>Clear direction.</span>
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
      <AudienceFeatures />
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

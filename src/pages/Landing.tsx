import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
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
  Watch,
} from "lucide-react";
import { Logo } from "../components/common/Logo";
import { ScenePlayer, type SceneSlide } from "../components/landing/ScenePlayer";
import "../landing.css";

const heroSlides: SceneSlide[] = [
  {
    id: "fitbit",
    label: "Recovery",
    tell: "Sleep and heart rate arrive as a dated Fitbit export.",
    hold: 5.5,
    content: (
      <>
        <div className="beat scene-head">
          <span className="scene-mark">
            <Watch size={18} />
          </span>
          <div>
            <strong>Fitbit sleep export</strong>
            <span>Imported for 1 Nov. Not a live connection.</span>
          </div>
        </div>
        {[
          ["Sleep", "7h 12m"],
          ["Resting heart rate", "54 bpm"],
          ["Steps", "8,420"],
        ].map(([name, value]) => (
          <div className="beat reading-row" key={name}>
            <span>{name}</span>
            <b>{value}</b>
          </div>
        ))}
        <p className="beat demo-source">Source · Fitbit export · 1 Nov</p>
      </>
    ),
  },
  {
    id: "hero-ai",
    label: "Companion",
    tell: "The companion reads that export and says whether to keep the session.",
    hold: 6.5,
    content: (
      <>
        <div className="beat demo-msg from-you">
          <small>Aarav Sharma</small>
          <p>How does my recovery look?</p>
        </div>
        <div className="beat demo-msg from-them">
          <small>Companion</small>
          <p>
            Sleep was 7h 12m and resting heart rate was 54, from today’s Fitbit
            export. Keep the session. Ease the last set if your legs feel heavy.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "hero-coach",
    label: "Coach",
    tell: "Your coach sees the same day. The plan changes only after they approve it.",
    hold: 7,
    content: (
      <>
        <div className="beat demo-msg from-you">
          <small>Aarav Sharma</small>
          <p>Legs felt heavy on the last set.</p>
        </div>
        <div className="beat demo-msg from-them">
          <small>Manish Chauhan</small>
          <p>Drop the last working set today. We’ll put it back on Thursday.</p>
        </div>
        <div className="beat coach-suggestion">
          <small>Suggestion</small>
          <strong>Lower body · last working set removed</strong>
          <p>Not applied. The plan changes when you approve it.</p>
        </div>
      </>
    ),
  },
];

const askSlides: SceneSlide[] = [
  {
    id: "ask-meal",
    label: "Meal photo",
    hold: 3.2,
    content: (
      <>
        <div className="beat demo-msg from-you">
          <small>Aarav Sharma</small>
          <p className="with-icon">
            <Camera size={16} />
            Help me understand this meal.
          </p>
        </div>
        <div className="beat demo-msg from-them">
          <small>Companion</small>
          <p>
            Looks like a rice-and-dal plate, about 620 kcal. The estimate is
            approximate — log it if that matches what you ate.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "ask-recovery",
    label: "Recovery",
    hold: 3.2,
    content: (
      <>
        <div className="beat demo-msg from-you">
          <small>Aarav Sharma</small>
          <p className="with-icon">
            <Moon size={16} />
            How does my recovery look?
          </p>
        </div>
        <div className="beat demo-msg from-them">
          <small>Companion</small>
          <p>
            7h 12m of sleep and a resting heart rate of 54, from the Fitbit
            export on 1 Nov. You’re set for today’s session.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "ask-today",
    label: "Today",
    hold: 3.2,
    content: (
      <>
        <div className="beat demo-msg from-you">
          <small>Aarav Sharma</small>
          <p className="with-icon">
            <Dumbbell size={16} />
            What should I focus on today?
          </p>
        </div>
        <div className="beat demo-msg from-them">
          <small>Companion</small>
          <p>
            The main lift. Leave a rep in reserve on the last set if your legs
            still feel heavy.
          </p>
        </div>
      </>
    ),
  },
];
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
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".coach-beat",
          { opacity: 0.55, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: ".coach-preview",
              start: "top 78%",
              once: true,
            },
          },
        );
      });
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
      return () => media.revert();
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
            <div className="coach-thread">
              <div className="coach-beat demo-msg from-you">
                <small>Aarav Sharma</small>
                <p>Legs felt heavy on the last set.</p>
              </div>
              <div className="coach-beat demo-msg from-them">
                <small>Manish Chauhan</small>
                <p>
                  Drop the last working set today. We’ll put it back on Thursday.
                </p>
              </div>
              <div className="coach-beat coach-suggestion">
                <small>Suggestion</small>
                <strong>Lower body · last working set removed</strong>
                <p>Not applied. The plan changes when you approve it.</p>
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
            <li>
              <Link to="/coaches">
                Coaches, pools, turf and grounds near you
              </Link>
            </li>
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
type PricingFeature = {
  key: string;
  label: string;
  included: boolean;
  limit: number | null;
};

type PublicPricing = {
  plans: {
    id: string;
    name: string;
    priceMinor: number;
    interval: string;
    features: PricingFeature[];
  }[];
  coachInviteFeeMinor: number;
  coachEarningsFeePercent: number;
  gymMonthlyMinor: number;
  marketplaceFeePercent: number;
};

const rupees = (minor = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(minor / 100);

function featureStatus(feature: PricingFeature) {
  if (!feature.included) return "Not included";
  if (feature.limit != null) return `${feature.limit} included`;
  return "Included";
}

function Pricing() {
  const { isAuthenticated, hasRole } = useAuth();
  const prices = useQuery({
    queryKey: ["public-pricing"],
    queryFn: async () => (await api.get("/billing/pricing")).data.data as PublicPricing,
  });
  const athlete = isAuthenticated && hasRole("athlete");
  const data = prices.data;
  const plans = data?.plans.filter((plan) => plan.id === "free" || plan.id === "premium") ?? [];

  return (
    <section id="pricing" className="landing-pricing" tabIndex={-1}>
      <div className="audience-section-heading">
        <h2>
          Start free.
          <br />
          Subscribe when you want more.
        </h2>
        <p>Athletes and coaches join on Free. Amounts are in rupees.</p>
      </div>
      {prices.isError && (
        <p className="landing-pricing-note">
          Pricing could not be loaded.{" "}
          <button type="button" onClick={() => prices.refetch()}>
            Retry
          </button>
        </p>
      )}
      {data && (
        <div className="landing-price-grid">
          {plans.map((plan) => {
            const subscribe = plan.id === "premium";
            const to = athlete
              ? "/settings?section=plan"
              : subscribe
                ? "/auth/sign-up?role=athlete&intent=premium"
                : "/auth/sign-up?role=athlete";
            return (
              <article key={plan.id} className={subscribe ? "is-premium" : ""}>
                <p>{plan.id === "free" ? "For athletes" : "For athletes who want more"}</p>
                <h3>{plan.name}</h3>
                <strong>
                  {rupees(plan.priceMinor)}
                  <span>{plan.interval === "month" ? " / month" : ""}</span>
                </strong>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature.key} className={feature.included ? "" : "is-off"}>
                      {feature.included ? <Check size={15} /> : <span className="price-mark" aria-hidden="true" />}
                      <span>
                        {feature.label}
                        <em>{featureStatus(feature)}</em>
                      </span>
                    </li>
                  ))}
                </ul>
                <Link className={subscribe ? "landing-primary" : "landing-secondary"} to={to}>
                  {subscribe ? "Subscribe" : "Start free"}
                  {subscribe ? <ArrowUpRight size={16} /> : <ArrowRight size={16} />}
                </Link>
              </article>
            );
          })}
          <article>
            <p>For coaches</p>
            <h3>Free to join</h3>
            <strong>
              {rupees(0)}
              <span> to register</span>
            </strong>
            <ul>
              <li>
                <Check size={15} />
                <span>
                  Invite an athlete
                  <em>{rupees(data.coachInviteFeeMinor)} when you send it</em>
                </span>
              </li>
              <li>
                <Check size={15} />
                <span>
                  Message your athletes
                  <em>Free</em>
                </span>
              </li>
              <li>
                <Check size={15} />
                <span>
                  Company share
                  <em>{data.coachEarningsFeePercent}% of coach earnings</em>
                </span>
              </li>
            </ul>
            <Link className="landing-secondary" to="/auth/sign-up?role=coach">
              Join as a coach <ArrowRight size={16} />
            </Link>
          </article>
          <article>
            <p>For gyms and the marketplace</p>
            <h3>Installation</h3>
            <strong>
              {rupees(data.gymMonthlyMinor)}
              <span> / month</span>
            </strong>
            <ul>
              <li>
                <Check size={15} />
                <span>
                  Gym installation
                  <em>Billed every month</em>
                </span>
              </li>
              <li>
                <Check size={15} />
                <span>
                  Marketplace fee
                  <em>{data.marketplaceFeePercent}% of each sale</em>
                </span>
              </li>
            </ul>
            <Link className="landing-secondary" to="/auth/sign-up?role=gym_owner">
              Open a gym <ArrowRight size={16} />
            </Link>
          </article>
        </div>
      )}
    </section>
  );
}

const heroNouns = ["workout", "sleep", "calories", "food"];

export default function Landing() {
  const reduced = useReducedMotion();
  const container = useRef<HTMLDivElement>(null);
  const nounRef = useRef<HTMLSpanElement>(null);
  const nounIndex = useRef(0);
  const [heroBeat, setHeroBeat] = useState(-1);
  const [noun, setNoun] = useState(0);
  const { contextSafe } = useGSAP(
    () => {
      const el = nounRef.current;
      if (!el) return;
      const media = gsap.matchMedia();
      const swap = (index: number) => {
        nounIndex.current = index;
        flushSync(() => setNoun(index));
      };
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ repeat: -1 });
        heroNouns.forEach((_, index) => {
          const next = (index + 1) % heroNouns.length;
          tl.to({}, { duration: 2.1 });
          tl.to(el, { opacity: 0, duration: 0.18, ease: "power3.out" });
          tl.call(() => swap(next));
          tl.to(el, { opacity: 1, duration: 0.32, ease: "power3.out" });
        });
      });
      media.add("(prefers-reduced-motion: reduce)", () => {
        const id = window.setInterval(() => {
          swap((nounIndex.current + 1) % heroNouns.length);
        }, 2600);
        return () => window.clearInterval(id);
      });
      return () => media.revert();
    },
    { scope: container },
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
            Today’s <span className="hero-noun" ref={nounRef}>{heroNouns[noun]}</span>.
            <br />
            With your coach.
          </h1>
          <p>
            One place for training, recovery, and coaching.
          </p>
          <div className="landing-actions">
            <Link className="landing-primary" to="/auth/sign-up">
              Start as an athlete <ArrowUpRight size={20} />
            </Link>
            <Link className="landing-secondary" to="/auth/sign-in">
              Explore the demo <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div
          className="hero-day"
          aria-label="Illustrative day: a recovery export, the companion, then coach approval"
        >
          <div className="hero-day-top">
            <span>How one day works</span>
            <span className="illustration-label">Illustrative</span>
          </div>
          <ScenePlayer
            slides={heroSlides}
            label="Preview scenes"
            onScene={setHeroBeat}
            footnote="Illustrative preview. Wearable figures are a Fitbit export, not a live connection."
          />
        </div>
      </section>
      <div className="landing-capabilities">
        {["Recovery export", "The companion", "Coach approval"].map(
          (label, index) => (
            <span key={label} className={heroBeat === index ? "is-live" : undefined}>
              {label}
            </span>
          ),
        )}
        <a href="#workflow" onClick={scrollToWorkflow}>
          See how it works <ArrowRight size={16} />
        </a>
      </div>
      <Workflow />
      <section className="landing-ai">
        <div className="ai-conversation-preview">
          <ScenePlayer
            slides={askSlides}
            label="Sample questions"
            footnote="Illustrative conversation. Meal-photo estimates are approximate."
          />
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
      <Pricing />
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
          <Logo />
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

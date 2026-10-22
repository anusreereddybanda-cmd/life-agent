import {
  ArrowRight,
  BookOpen,
  Camera,
  Heart,
  Layers3,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const chapters = [
  {
    title: 'School Memories',
    years: 'The first chapters',
    description:
      'Keep the friendships, small victories, and everyday moments that shaped your early years.',
    icon: BookOpen,
    tone: 'chapter-card--lavender',
  },
  {
    title: 'Intermediate Memories',
    years: 'A time of becoming',
    description:
      'Gather the people, places, and turning points from a season full of new possibilities.',
    icon: Layers3,
    tone: 'chapter-card--blue',
  },
  {
    title: 'BTech Memories',
    years: 'The years that built you',
    description:
      'Bring projects, friendships, campus life, and milestones together in one chapter.',
    icon: Camera,
    tone: 'chapter-card--rose',
  },
  {
    title: 'Personal Milestones',
    years: 'All the moments in between',
    description:
      'Save the meaningful celebrations, discoveries, and personal moments worth revisiting.',
    icon: Heart,
    tone: 'chapter-card--sand',
  },
];

function MemoryCollage() {
  return (
    <div className="memory-collage" aria-label="Illustrated memory collage">
      <div className="memory-collage__halo" />
      <div className="memory-art memory-art--main">
        <div className="memory-art__sky">
          <span className="memory-art__sun" />
          <span className="memory-art__cloud memory-art__cloud--one" />
          <span className="memory-art__cloud memory-art__cloud--two" />
        </div>
        <div className="memory-art__hills">
          <span />
          <span />
          <span />
        </div>
        <div className="memory-art__caption">
          <span>little things, remembered</span>
          <Heart size={15} fill="currentColor" />
        </div>
      </div>
      <div className="memory-note memory-note--top">
        <span className="memory-note__icon"><Camera size={17} /></span>
        <span>
          <strong>Moments worth keeping</strong>
          <small>Your story, in your words</small>
        </span>
      </div>
      <div className="memory-note memory-note--bottom">
        <span className="memory-note__date">CHAPTER 01</span>
        <span className="memory-note__rule" />
        <span className="memory-note__label">A life in moments</span>
      </div>
      <span className="memory-collage__sparkle" aria-hidden="true">✳</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link to="/" className="landing-brand" aria-label="Life Agent home">
          <span className="landing-brand__mark"><Heart size={17} /></span>
          <span>Life Agent</span>
        </Link>

        <nav className="landing-nav" aria-label="Main navigation">
          <Link to="/memories">Memories</Link>
          <Link to="/timeline">Timeline</Link>
          <Link to="/gallery">Gallery</Link>
        </nav>

        <div className="landing-header__actions">
          <Link to="/auth" className="landing-signin">Sign In</Link>
          <Link to="/auth?mode=signup" className="landing-button landing-button--small">
            Get Started
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow">
              <span /> A home for the moments that make you
            </p>
            <h1>Your Life. Your Memories. <em>Your Story.</em></h1>
            <p className="landing-hero__description">
              Keep your milestones, photos, and personal memories in one private space.
            </p>
            <div className="landing-hero__actions">
              <Link to="/auth?mode=signup" className="landing-button">
                Get Started <ArrowRight size={17} />
              </Link>
              <Link to="/auth" className="landing-button landing-button--quiet">
                Sign In
              </Link>
            </div>
            <p className="landing-hero__footnote">
              A thoughtful place to collect your life as it happens.
            </p>
          </div>
          <MemoryCollage />
        </section>

        <section className="landing-intro">
          <span className="landing-intro__ornament" aria-hidden="true">✳</span>
          <p className="landing-eyebrow">Make room for remembering</p>
          <h2>Every life has its own chapters.</h2>
          <p>
            Life Agent gives your photos, milestones, and personal memories a place
            to live together, so the moments that matter are easier to revisit.
          </p>
        </section>

        <section className="landing-chapters" aria-label="Life chapters">
          <div className="landing-chapters__heading">
            <div>
              <p className="landing-eyebrow">Your story, organized</p>
              <h2>Keep every chapter close.</h2>
            </div>
            <p>Start with a chapter. Add to it whenever a moment feels worth keeping.</p>
          </div>

          <div className="chapter-grid">
            {chapters.map(({ title, years, description, icon: Icon, tone }, index) => (
              <article className={`chapter-card ${tone}`} key={title}>
                <div className="chapter-card__top">
                  <span className="chapter-card__number">0{index + 1}</span>
                  <span className="chapter-card__icon"><Icon size={19} /></span>
                </div>
                <div className="chapter-card__art" aria-hidden="true">
                  <span className="chapter-card__art-shape chapter-card__art-shape--one" />
                  <span className="chapter-card__art-shape chapter-card__art-shape--two" />
                  <span className="chapter-card__art-line" />
                </div>
                <p className="chapter-card__years">{years}</p>
                <h3>{title}</h3>
                <p className="chapter-card__description">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-closing">
          <div className="landing-closing__mark"><Sparkles size={20} /></div>
          <p className="landing-eyebrow">Begin wherever you are</p>
          <h2>The next chapter is yours to keep.</h2>
          <p>Make a little space for the things you never want to forget.</p>
          <Link to="/auth?mode=signup" className="landing-button">
            Get Started <ArrowRight size={17} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link to="/" className="landing-brand">
          <span className="landing-brand__mark"><Heart size={15} /></span>
          <span>Life Agent</span>
        </Link>
        <p>A personal home for your memories and milestones.</p>
        <Link to="/auth">Sign in to your space <ArrowRight size={14} /></Link>
      </footer>
    </div>
  );
}

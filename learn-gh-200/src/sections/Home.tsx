import { BookOpen, CircleHelp, FlaskConical, Timer } from 'lucide-react';
import { Badge, Pill } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardHead } from '../components/ui/Card';

interface Feature {
  path: string;
  icon: typeof BookOpen;
  title: string;
  body: string;
  pill: string;
}

const FEATURES: Feature[] = [
  {
    path: '/learn',
    icon: BookOpen,
    title: 'Learn',
    body: 'Lesson pages per exam domain, from Git basics to workflow hardening, each traced to the official docs.',
    pill: 'GH-900 + GH-200',
  },
  {
    path: '/lab',
    icon: FlaskConical,
    title: 'Lab',
    body: 'Hands-on exercises you do in this very repository — including dissecting the workflow that deploys this site.',
    pill: 'Guided steps',
  },
  {
    path: '/practice',
    icon: CircleHelp,
    title: 'Practice',
    body: 'Single-choice, multiple-choice, fill-in, bug-hunt, and ordering questions with explanations after every answer.',
    pill: '5 question kinds',
  },
  {
    path: '/exams',
    icon: Timer,
    title: 'Mock exams',
    body: 'Timed 35-question exams weighted like the real thing, with a scaled score out of 1000 and a 700 pass mark.',
    pill: '100 minutes',
  },
];

/** Landing page: hero plus one card per site section. */
export function Home() {
  return (
    <>
      <section className="home-hero enter">
        <div>
          <span className="caption">GitHub certifications</span>
          <h1>Learn GitHub Actions by shipping a real site</h1>
          <p className="lead">
            A self-paced course for the GH-900 Foundations and GH-200 GitHub
            Actions exams. Every lesson, lab, and mock exam lives in this
            repository — and the same repository deploys this page through
            GitHub Actions, so the pipeline you study is the one running here.
          </p>
          <div className="home-hero-cta">
            <Button href="#/learn">Start learning</Button>
            <Button variant="secondary" href="#/exams">
              Try a mock exam
            </Button>
          </div>
        </div>
        <div className="home-hero-mascot">
          <img
            src="mascot/captain-corgi-hub-avatar.png"
            alt="Captain Corgi mascot"
            width={280}
            height={280}
          />
        </div>
      </section>

      <section>
        <div className="section-head">
          <span className="caption">Four ways in</span>
          <h2>Pick your pace</h2>
        </div>
        <div className="card-grid">
          {FEATURES.map(({ path, icon: Icon, title, body, pill }) => (
            <Card key={path} href={`#${path}`}>
              <CardHead meta={<Pill>{pill}</Pill>}>
                <Icon size={24} strokeWidth={1.75} aria-hidden />
                <h3 className="card-title">{title}</h3>
              </CardHead>
              <p>{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 'var(--space-7)' }}>
        <Card>
          <CardHead meta={<Badge tone="neutral">No account needed</Badge>}>
            <h3 className="card-title">Your progress stays in this browser</h3>
          </CardHead>
          <p>
            Lessons read, labs done, practice tallies, and exam attempts are
            stored locally under one key — nothing is sent anywhere. Clear your
            browser storage and you start fresh.
          </p>
        </Card>
      </section>
    </>
  );
}

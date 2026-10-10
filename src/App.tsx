import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  ExternalLink,
  Eye,
  Flame,
  HeartPulse,
  HelpCircle,
  Home,
  Info,
  LockKeyhole,
  Menu,
  MessageCircle,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { procedures, resourceItems } from './data';
import {
  bestCorrect,
  correctCount,
  freshProgress,
  loadProgress,
  localDay,
  STORAGE_KEY,
  streakCount,
} from './storage';
import type { Progress } from './storage';

type Page =
  | 'Dashboard'
  | 'Procedures'
  | 'My Progress'
  | 'Leaderboards'
  | 'Achievements'
  | 'Resources'
  | 'About';
type Modal = 'settings' | 'help' | 'notifications' | null;
const assetUrl = (filename: string) => `${import.meta.env.BASE_URL}${filename}`;
const navigation: { title: Page; icon: LucideIcon }[] = [
  { title: 'Dashboard', icon: Home },
  { title: 'Procedures', icon: ClipboardList },
  { title: 'My Progress', icon: TrendingUp },
  { title: 'Leaderboards', icon: Trophy },
  { title: 'Achievements', icon: Award },
  { title: 'Resources', icon: BookOpen },
  { title: 'About', icon: Info },
];
const procedureIcons: Record<string, LucideIcon> = {
  ngt: Stethoscope,
  wound: ShieldCheck,
  vitals: HeartPulse,
};

function ModalDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const elements = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button, input, a[href], [tabindex="0"]',
        ) || [],
      ).filter((el) => !el.hasAttribute('disabled'));
    elements()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const items = elements();
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', handleKey);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={ref}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  return (
    <div className="progress-ring" aria-label={`${percent}% overall progress`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r="49" />
        <circle
          className="ring-fill"
          cx="60"
          cy="60"
          r="49"
          strokeDasharray="307.88"
          strokeDashoffset={307.88 * (1 - percent / 100)}
        />
      </svg>
      <strong>
        {percent}
        <span>%</span>
      </strong>
    </div>
  );
}

export default function App() {
  const [initial] = useState(loadProgress);
  const [progress, setProgress] = useState<Progress>(initial.progress);
  const [storageWarning, setStorageWarning] = useState(initial.warning);
  const [page, setPage] = useState<Page>('Dashboard');
  const [activeId, setActiveId] = useState('ngt');
  const [step, setStep] = useState(
    Math.min(initial.progress.sessions.ngt?.answers.length || 0, 5),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [profileName, setProfileName] = useState(progress.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const closeModal = useRef(() => {
    setModal(null);
    setConfirmReset(false);
  }).current;
  const procedure = procedures.find((item) => item.id === activeId)!;
  const session = progress.sessions[activeId] || { answers: [] };
  const question = procedure.questions[step];
  const submitted = session.answers[step] !== undefined;
  const currentAnswer = submitted ? session.answers[step] : selected;
  const isCorrect = submitted && currentAnswer === question.correct;
  const completedIds = new Set([
    ...progress.history.map((run) => run.id),
    ...Object.keys(progress.bestRuns),
  ]);
  const completedCount = completedIds.size;
  const totalScore = procedures.reduce(
    (total, item) => total + bestCorrect(progress, item.id) * 50,
    0,
  );
  const totalQuestions = procedures.reduce(
    (total, item) => total + item.questions.length,
    0,
  );
  const level = Math.floor(totalScore / 150) + 1;
  const streak = streakCount(progress.practiceDays);
  const percent = Math.round((completedCount / procedures.length) * 100);
  const allAnswers = [
    ...progress.history.map((run) => ({ id: run.id, answers: run.answers })),
    ...procedures
      .filter((item) => !progress.sessions[item.id]?.completedAt)
      .map((item) => ({
        id: item.id,
        answers: progress.sessions[item.id]?.answers || [],
      })),
  ];
  const answeredCount = allAnswers.reduce(
    (sum, item) => sum + item.answers.length,
    0,
  );
  const rightAnswers = allAnswers.reduce(
    (sum, item) => sum + correctCount(item.id, item.answers),
    0,
  );
  const accuracy = answeredCount
    ? Math.round((rightAnswers / answeredCount) * 100)
    : 0;
  const perfectRun = Object.values(progress.bestRuns).some(
    (score) => score === 6,
  );
  const badges = [
    {
      title: 'First Steps',
      description: 'Complete your first procedure.',
      icon: ClipboardCheck,
      unlocked: completedCount >= 1,
    },
    {
      title: 'Perfect Practice',
      description: 'Answer all 6 questions correctly in one run.',
      icon: Star,
      unlocked: perfectRun,
    },
    {
      title: 'Well Rounded',
      description: 'Complete all 3 available procedures.',
      icon: Award,
      unlocked: completedCount === 3,
    },
    {
      title: 'On a Roll',
      description: 'Practice on 3 consecutive days.',
      icon: Flame,
      unlocked: streak >= 3,
    },
    {
      title: 'Knowledge Builder',
      description: 'Earn at least 600 best-score points.',
      icon: BookOpen,
      unlocked: totalScore >= 600,
    },
    {
      title: 'Care Champion',
      description: 'Reach 900 best-score points.',
      icon: Trophy,
      unlocked: totalScore === 900,
    },
  ];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      setStorageWarning(
        'Browser storage is unavailable. Your current practice works, but progress may not survive a reload.',
      );
    }
  }, [progress]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    document.title = `${page === 'Dashboard' ? procedure.title : page} · RETDEMQUEST`;
  }, [page, procedure.title]);

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function openProcedure(id: string, replay = false) {
    if (replay)
      setProgress((previous) => ({
        ...previous,
        sessions: { ...previous.sessions, [id]: { answers: [] } },
      }));
    setActiveId(id);
    setStep(
      replay ? 0 : Math.min(progress.sessions[id]?.answers.length || 0, 5),
    );
    setSelected(null);
    setShowExplanation(false);
    navigate('Dashboard');
  }
  function changeStep(next: number) {
    setStep(next);
    setSelected(null);
    setShowExplanation(false);
  }
  function submitAnswer() {
    if (selected === null || submitted) return;
    const today = localDay();
    setProgress((previous) => ({
      ...previous,
      sessions: {
        ...previous.sessions,
        [activeId]: {
          answers: [...(previous.sessions[activeId]?.answers || []), selected],
        },
      },
      practiceDays: previous.practiceDays.includes(today)
        ? previous.practiceDays
        : [...previous.practiceDays, today],
    }));
    setShowExplanation(true);
  }
  function finishProcedure() {
    if (
      session.answers.length !== procedure.questions.length ||
      session.completedAt
    )
      return;
    const completedAt = new Date().toISOString();
    setProgress((previous) => ({
      ...previous,
      sessions: {
        ...previous.sessions,
        [activeId]: { ...previous.sessions[activeId], completedAt },
      },
      bestRuns: {
        ...previous.bestRuns,
        [activeId]: Math.max(
          previous.bestRuns[activeId] || 0,
          correctCount(activeId, previous.sessions[activeId].answers),
        ),
      },
      history: [
        ...previous.history,
        {
          id: activeId,
          answers: previous.sessions[activeId].answers,
          completedAt,
        },
      ].slice(-100),
    }));
  }
  function openSettings() {
    setProfileName(progress.name);
    setModal('settings');
  }
  function saveName(event: React.FormEvent) {
    event.preventDefault();
    const name = profileName.trim();
    if (!name) return;
    setProgress((previous) => ({ ...previous, name: name.slice(0, 30) }));
    closeModal();
    setToast('Your profile has been updated.');
  }
  function resetProgress() {
    setProgress({ ...freshProgress(), name: progress.name });
    setActiveId('ngt');
    setStep(0);
    setSelected(null);
    setShowExplanation(false);
    closeModal();
    navigate('Dashboard');
    setToast('Your practice progress has been reset.');
  }

  const pageSubtitles: Record<Page, string> = {
    Dashboard: 'Scenario Mode',
    Procedures: 'A little practice. A lot more confidence.',
    'My Progress': 'Every step is a step toward better care.',
    Leaderboards: 'Your personal bests, all in one place.',
    Achievements: 'Small milestones. Meaningful growth.',
    Resources: 'Keep learning beyond the scenario.',
    About: 'Practice. Decide. Provide safe care.',
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobileMenu && (
        <div className="sidebar-scrim" onClick={() => setMobileMenu(false)} />
      )}
      <aside
        className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}
        aria-label="Main navigation"
      >
        <button
          className="brand"
          onClick={() => navigate('Dashboard')}
          aria-label="RETDEMQUEST home"
        >
          <span className="brand-mark">
            <ShieldCheck size={37} strokeWidth={2.3} />
            <span>+</span>
          </span>
          <span>
            <strong>RETDEMQUEST</strong>
            <small>Practice. Decide. Provide Safe Care.</small>
          </span>
        </button>
        <div className="nav-caption">YOUR LEARNING SPACE</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ title, icon: Icon }) => (
            <button
              key={title}
              className={`nav-item ${page === title ? 'active' : ''}`}
              onClick={() => navigate(title)}
              aria-current={page === title ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={1.8} />
              <span>{title}</span>
              {page === title && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">
              <img src={assetUrl('nurse.svg')} alt="" />
            </div>
            <div>
              <strong>Hello, {progress.name}!</strong>
              <span>Nursing Student</span>
              <span className="level-pill">Level {level}</span>
            </div>
          </div>
          <div className="xp-label">
            <span>XP</span>
            <span>{totalScore % 150} / 150</span>
          </div>
          <div className="xp-track">
            <span style={{ width: `${((totalScore % 150) / 150) * 100}%` }} />
          </div>
          <p className="sidebar-note">
            <ShieldCheck size={13} /> Your progress is saved on this device
          </p>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="page-title">
            <button
              className="icon-button mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <Menu />
            </button>
            {page === 'Dashboard' && (
              <button
                className="back-button"
                onClick={() => navigate('Procedures')}
                aria-label="Back to procedures"
              >
                <ArrowLeft size={21} />
              </button>
            )}
            <div>
              <h1>{page === 'Dashboard' ? procedure.title : page}</h1>
              <p>{pageSubtitles[page]}</p>
            </div>
          </div>
          {page === 'Dashboard' && (
            <nav className="stepper" aria-label="Scenario steps">
              <div className="stepper-line" />
              <div className="stepper-numbers">
                {procedure.questions.map((_, index) => (
                  <button
                    key={index}
                    disabled={
                      index > session.answers.length || !!session.completedAt
                    }
                    className={`step-circle ${index === step && !session.completedAt ? 'current' : ''} ${index < session.answers.length ? 'done' : ''}`}
                    onClick={() => changeStep(index)}
                    aria-label={`Step ${index + 1}${index < session.answers.length ? ', answered' : ''}`}
                    aria-current={index === step ? 'step' : undefined}
                  >
                    {index < session.answers.length && index !== step ? (
                      <Check size={16} />
                    ) : (
                      index + 1
                    )}
                  </button>
                ))}
              </div>
              <small>
                {session.completedAt
                  ? 'Practice complete'
                  : `Step ${step + 1} of ${procedure.questions.length}`}
              </small>
            </nav>
          )}
          <div className="topbar-actions">
            <span
              className="streak-pill"
              title={`${streak} day practice streak`}
            >
              <Flame size={23} />
              <strong>{streak}</strong>
              <span>day streak</span>
            </span>
            <button
              className="icon-button notifications-button"
              aria-label="Notifications"
              onClick={() => {
                setModal('notifications');
                setProgress((previous) => ({
                  ...previous,
                  notificationsSeen: previous.history.length,
                }));
              }}
            >
              <Bell size={22} />
              {progress.history.length > progress.notificationsSeen && (
                <span className="notification-dot" />
              )}
            </button>
            <button
              className="icon-button settings-button"
              aria-label="Settings"
              onClick={openSettings}
            >
              <Settings size={22} />
            </button>
          </div>
        </header>

        <main id="main-content" tabIndex={-1}>
          {storageWarning && (
            <div className="storage-warning" role="status">
              <Info size={18} />
              {storageWarning}
              <button
                onClick={() => setStorageWarning('')}
                aria-label="Dismiss storage notice"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {page === 'Dashboard' ? (
            <>
              <div className="workspace-grid">
                <section className="scenario-card">
                  {session.completedAt ? (
                    <div className="completion-view">
                      <div className="completion-icon">
                        <Trophy size={42} />
                      </div>
                      <div className="eyebrow">ONE MORE STEP FORWARD</div>
                      <h2>Practice complete!</h2>
                      <p>
                        You’ve finished {procedure.title}. Take a moment to
                        reflect on what you learned.
                      </p>
                      <div className="completion-stats">
                        <div>
                          <strong>
                            {correctCount(activeId, session.answers)} / 6
                          </strong>
                          <span>Correct answers</span>
                        </div>
                        <div>
                          <strong>
                            {correctCount(activeId, session.answers) * 50}
                          </strong>
                          <span>Points this run</span>
                        </div>
                      </div>
                      <div className="review-list">
                        {procedure.questions.map((item, i) => (
                          <details key={i}>
                            <summary>
                              <span
                                className={`review-indicator ${session.answers[i] === item.correct ? 'correct' : 'incorrect'}`}
                              >
                                {session.answers[i] === item.correct ? (
                                  <Check size={15} />
                                ) : (
                                  <X size={15} />
                                )}
                              </span>
                              <span>
                                {i + 1}. {item.prompt}
                              </span>
                              <ChevronRight size={16} />
                            </summary>
                            <div>
                              <strong>
                                Best answer: {item.choices[item.correct]}
                              </strong>
                              <p>{item.explanation}</p>
                            </div>
                          </details>
                        ))}
                      </div>
                      <div className="completion-actions">
                        <button
                          className="primary-button"
                          onClick={() => navigate('Procedures')}
                        >
                          Explore procedures <ArrowRight size={17} />
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() => openProcedure(activeId, true)}
                        >
                          <RotateCcw size={16} /> Practice again
                        </button>
                      </div>
                      <p className="small-note">
                        Your best score is kept. Repeating a procedure helps
                        learning without multiplying your points.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="section-heading">
                        <span className="heading-icon">
                          <ClipboardList size={21} />
                        </span>
                        <h2>Scenario</h2>
                        <span className="demo-pill">Practice scenario</span>
                      </div>
                      <p className="scenario-intro">{procedure.situation}</p>
                      <div className="patient-card">
                        <div className="patient-image">
                          <img
                            src={assetUrl(
                              activeId === 'ngt'
                                ? 'patient.svg'
                                : 'patient-care.svg',
                            )}
                            alt="Illustration of a simulated adult patient resting in a hospital bed"
                          />
                          <span className="patient-image-tag">
                            <span /> Simulated patient
                          </span>
                        </div>
                        <div className="patient-details">
                          <h3>Patient Information</h3>
                          <ul>
                            <li>
                              <strong>Name:</strong> {procedure.patient.name}
                            </li>
                            <li>
                              <strong>Age:</strong> {procedure.patient.age}
                            </li>
                            <li>
                              <strong>Diagnosis:</strong>{' '}
                              {procedure.patient.diagnosis}
                            </li>
                            <li>
                              <strong>Status:</strong>{' '}
                              {procedure.patient.status}
                            </li>
                            <li>{procedure.patient.detail}</li>
                          </ul>
                        </div>
                      </div>
                      <div className="question-section">
                        <div className="question-heading">
                          <span className="question-icon">?</span>
                          <div>
                            <div className="eyebrow">
                              QUESTION {step + 1} OF 6
                            </div>
                            <h3>{question.prompt}</h3>
                          </div>
                        </div>
                        <div
                          className="choices"
                          role="group"
                          aria-label="Answer choices"
                        >
                          {question.choices.map((choice, index) => (
                            <button
                              key={choice}
                              className={`choice ${currentAnswer === index ? 'selected' : ''} ${submitted && index === question.correct ? 'choice-correct' : ''} ${submitted && index === currentAnswer && !isCorrect ? 'choice-incorrect' : ''}`}
                              disabled={submitted}
                              aria-pressed={currentAnswer === index}
                              onClick={() => setSelected(index)}
                            >
                              <span className="choice-letter">
                                {'ABC'[index]}
                              </span>
                              <span>{choice}</span>
                              {submitted && index === question.correct ? (
                                <CheckCircle2
                                  className="answer-result-icon"
                                  size={21}
                                />
                              ) : submitted && index === currentAnswer ? (
                                <X className="answer-result-icon" size={20} />
                              ) : (
                                <span className="choice-radio" />
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="answer-actions">
                          {submitted ? (
                            <>
                              <span
                                className={`answer-verdict ${isCorrect ? 'correct' : 'incorrect'}`}
                                role="status"
                              >
                                {isCorrect ? (
                                  <CheckCircle2 size={19} />
                                ) : (
                                  <Info size={19} />
                                )}
                                {isCorrect
                                  ? 'Well done! +50 pts'
                                  : 'A learning moment. Review the explanation.'}
                              </span>
                              <button
                                className="primary-button"
                                onClick={() =>
                                  step === 5
                                    ? finishProcedure()
                                    : changeStep(step + 1)
                                }
                              >
                                {step === 5
                                  ? 'Finish Practice'
                                  : 'Next Question'}
                                <ArrowRight size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="answer-hint">
                                {selected === null
                                  ? 'Choose the best action to continue.'
                                  : 'Ready? Make your decision.'}
                              </span>
                              <button
                                className="primary-button submit-button"
                                disabled={selected === null}
                                onClick={submitAnswer}
                              >
                                Submit Answer <ArrowRight size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </section>

                <aside className="insights" aria-label="Practice insights">
                  <section className="insight-card progress-card">
                    <div className="insight-heading">
                      <TrendingUp size={23} />
                      <h2>Your Progress</h2>
                    </div>
                    <div className="progress-card-content">
                      <ProgressRing percent={percent} />
                      <strong>Overall Progress</strong>
                      <p>
                        {completedCount} / {procedures.length} Procedures
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate('My Progress')}
                      >
                        See your journey <ChevronRight size={14} />
                      </button>
                    </div>
                  </section>
                  <section className="insight-card score-card">
                    <div className="insight-heading">
                      <Star size={23} fill="currentColor" />
                      <h2>Score</h2>
                    </div>
                    <div className="score-content">
                      <strong>
                        {totalScore}
                        <span> pts</span>
                      </strong>
                      <p>
                        {totalScore
                          ? 'Keep the momentum going!'
                          : 'Your learning journey starts here.'}
                      </p>
                    </div>
                  </section>
                  <section className="insight-card feedback-card">
                    <div className="insight-heading">
                      <MessageCircle size={23} fill="currentColor" />
                      <h2>Live Feedback</h2>
                      <span className="live-dot" />
                    </div>
                    <div className="feedback-content" aria-live="polite">
                      <p>
                        {session.completedAt ? (
                          'One more procedure practiced. One more reason to feel confident. Keep growing!'
                        ) : submitted ? (
                          isCorrect ? (
                            'Great choice! You’re building safe habits, one decision at a time.'
                          ) : (
                            'Every decision is a chance to learn. Read the explanation, then try the next step.'
                          )
                        ) : (
                          <>
                            Choose the <strong>best action</strong> to support
                            patient safety and quality care.
                          </>
                        )}
                      </p>
                      <div className="feedback-nurse">
                        <img src={assetUrl('nurse.svg')} alt="" />
                        <span>
                          <Sparkles size={13} /> You’ve got this!
                        </span>
                      </div>
                    </div>
                    <button
                      className="explanation-button"
                      disabled={!submitted || !!session.completedAt}
                      onClick={() => setShowExplanation(!showExplanation)}
                      aria-expanded={showExplanation}
                    >
                      <Eye size={19} />
                      {showExplanation && submitted
                        ? 'Hide Explanation'
                        : 'View Explanation'}
                    </button>
                    {!submitted && !session.completedAt && (
                      <small className="explanation-hint">
                        Available after you submit an answer
                      </small>
                    )}
                  </section>
                </aside>
              </div>
              {showExplanation && submitted && !session.completedAt && (
                <section
                  className="explanation-panel"
                  aria-label="Answer explanation"
                >
                  <div className="section-heading">
                    <span className="heading-icon">
                      <BookOpen size={20} />
                    </span>
                    <h2>Why this is the best action</h2>
                    <button
                      className="icon-button"
                      aria-label="Close explanation"
                      onClick={() => setShowExplanation(false)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <strong>{question.choices[question.correct]}</strong>
                  <p>{question.explanation}</p>
                  <small>
                    Demo learning content. Follow your instructor’s guidance and
                    institution’s approved protocols.
                  </small>
                </section>
              )}
              <div className="reminder-bar">
                <span>
                  <Star size={19} fill="currentColor" />
                  <span>
                    <strong>Remember:</strong> Think. Decide. Act. Provide Safe
                    and Quality Nursing Care.
                  </span>
                </span>
                <button onClick={() => setModal('help')}>
                  <HelpCircle size={18} /> Need Help?
                </button>
              </div>
            </>
          ) : (
            <div className="secondary-page">
              {page === 'Procedures' && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">LEARN BY DOING</span>
                      <h2>Your next confident decision starts here.</h2>
                      <p>
                        Choose a procedure and work through six real-world
                        practice decisions.
                      </p>
                    </div>
                    <div className="search-field">
                      <Search size={18} />
                      <input
                        aria-label="Search procedures"
                        placeholder="Find a procedure…"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                      {query && (
                        <button
                          onClick={() => setQuery('')}
                          aria-label="Clear search"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="procedure-grid">
                    {procedures
                      .filter((item) =>
                        `${item.title} ${item.category}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((item) => {
                        const Icon = procedureIcons[item.id];
                        const current = progress.sessions[item.id];
                        const complete = completedIds.has(item.id);
                        return (
                          <article className="procedure-tile" key={item.id}>
                            <div className={`procedure-art ${item.id}`}>
                              <Icon size={55} strokeWidth={1.3} />
                              <span className="procedure-art-ring" />
                              <span className="category-tag">
                                {item.category}
                              </span>
                            </div>
                            <div className="procedure-tile-body">
                              <div className="tile-heading">
                                <h3>{item.title}</h3>
                                {complete && (
                                  <CheckCircle2 size={20} className="green" />
                                )}
                              </div>
                              <p>{item.description}</p>
                              <div className="procedure-meta">
                                <span>
                                  <ClipboardList size={14} />6 questions
                                </span>
                                <span>
                                  <Clock3 size={14} />
                                  5–8 min
                                </span>
                              </div>
                              <div className="tile-progress">
                                <span
                                  style={{
                                    width: `${((current?.answers.length || 0) / 6) * 100}%`,
                                  }}
                                />
                              </div>
                              <div className="tile-footer">
                                <span>
                                  {current?.completedAt
                                    ? 'Completed'
                                    : current?.answers.length
                                      ? `${current.answers.length} of 6 answered`
                                      : 'Ready when you are'}
                                </span>
                                <button
                                  className="primary-button"
                                  onClick={() => openProcedure(item.id)}
                                >
                                  {current?.completedAt
                                    ? 'Review'
                                    : current?.answers.length
                                      ? 'Continue'
                                      : 'Start Practice'}
                                  <ArrowRight size={16} />
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                  </div>
                  {!procedures.some((item) =>
                    `${item.title} ${item.category}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  ) && (
                    <div className="empty-state">
                      <Search size={32} />
                      <h3>No procedures found</h3>
                      <p>
                        Try searching for “feeding”, “wound”, or “assessment”.
                      </p>
                      <button
                        className="secondary-button"
                        onClick={() => setQuery('')}
                      >
                        Show all procedures
                      </button>
                    </div>
                  )}
                  <div className="content-notice">
                    <Info size={18} />
                    <p>
                      These are demonstration scenarios for personal practice.
                      Content should be reviewed by a qualified nursing
                      instructor before formal teaching or assessment.
                    </p>
                  </div>
                </>
              )}

              {page === 'My Progress' && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">YOUR LEARNING JOURNEY</span>
                      <h2>Look how far you’re going.</h2>
                      <p>
                        Build confidence through consistency, reflection, and
                        practice.
                      </p>
                    </div>
                    <button
                      className="primary-button"
                      onClick={() => navigate('Procedures')}
                    >
                      Keep practicing <ArrowRight size={17} />
                    </button>
                  </div>
                  <div className="metric-grid">
                    <Metric
                      icon={ClipboardCheck}
                      value={`${completedCount} / 3`}
                      label="Procedures completed"
                    />
                    <Metric
                      icon={Target}
                      value={answeredCount ? `${accuracy}%` : '—'}
                      label="Answer accuracy"
                    />
                    <Metric
                      icon={Star}
                      value={String(totalScore)}
                      label="Best-score points"
                    />
                    <Metric
                      icon={Flame}
                      value={String(streak)}
                      label="Day practice streak"
                    />
                  </div>
                  <section className="white-card">
                    <div className="section-heading">
                      <TrendingUp size={22} />
                      <h2>Procedure progress</h2>
                    </div>
                    {procedures.map((item) => (
                      <div className="progress-row" key={item.id}>
                        <div>
                          <h3>{item.title}</h3>
                          <p>
                            {completedIds.has(item.id)
                              ? 'Completed at least once'
                              : progress.sessions[item.id]?.answers.length
                                ? 'Practice in progress'
                                : 'Not started yet'}
                          </p>
                        </div>
                        <div className="progress-row-track">
                          <span
                            style={{
                              width: `${completedIds.has(item.id) ? 100 : ((progress.sessions[item.id]?.answers.length || 0) / 6) * 100}%`,
                            }}
                          />
                        </div>
                        <strong>
                          {bestCorrect(progress, item.id) * 50}
                          <small> pts</small>
                        </strong>
                        <button
                          className="icon-button"
                          aria-label={`Open ${item.title}`}
                          onClick={() => openProcedure(item.id)}
                        >
                          <ArrowRight size={19} />
                        </button>
                      </div>
                    ))}
                  </section>
                  <section className="white-card">
                    <div className="section-heading">
                      <Clock3 size={22} />
                      <h2>Recent practice</h2>
                    </div>
                    {progress.history.length ? (
                      <div className="history-list">
                        {progress.history
                          .slice(-5)
                          .reverse()
                          .map((run, index) => (
                            <div
                              className="history-row"
                              key={`${run.completedAt}-${index}`}
                            >
                              <span className="history-icon">
                                <CheckCircle2 size={20} />
                              </span>
                              <div>
                                <strong>
                                  {
                                    procedures.find(
                                      (item) => item.id === run.id,
                                    )!.title
                                  }
                                </strong>
                                <p>
                                  {new Date(run.completedAt).toLocaleDateString(
                                    undefined,
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    },
                                  )}
                                </p>
                              </div>
                              <span>
                                {correctCount(run.id, run.answers)} / 6 correct
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={BookOpen}
                        title="Your story is just beginning"
                        text="Complete a procedure to see your practice history here."
                      />
                    )}
                  </section>
                </>
              )}

              {page === 'Leaderboards' && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">
                        A LITTLE FRIENDLY MOTIVATION
                      </span>
                      <h2>Your personal bests.</h2>
                      <p>
                        The most meaningful comparison? You, getting better.
                      </p>
                    </div>
                    <span className="soft-pill">
                      <LockKeyhole size={15} /> Personal practice mode
                    </span>
                  </div>
                  <div className="records-banner">
                    <div className="records-trophy">
                      <Trophy size={54} />
                    </div>
                    <div>
                      <span className="eyebrow">YOUR BEST-SCORE TOTAL</span>
                      <strong>
                        {totalScore}
                        <span> / 900 pts</span>
                      </strong>
                      <p>Your highest score for each procedure counts once.</p>
                    </div>
                  </div>
                  <section className="white-card">
                    <div className="section-heading">
                      <Trophy size={22} />
                      <h2>Procedure rankings</h2>
                    </div>
                    <div className="records-list">
                      {[...procedures]
                        .sort(
                          (a, b) =>
                            bestCorrect(progress, b.id) -
                            bestCorrect(progress, a.id),
                        )
                        .map((item, index) => (
                          <div className="record-row" key={item.id}>
                            <span className={`rank rank-${index}`}>
                              {index + 1}
                            </span>
                            <div>
                              <h3>{item.title}</h3>
                              <p>
                                {completedIds.has(item.id)
                                  ? 'Completed'
                                  : progress.sessions[item.id]?.answers.length
                                    ? 'In progress'
                                    : 'Ready to practice'}
                              </p>
                            </div>
                            <strong>
                              {bestCorrect(progress, item.id) * 50}
                              <small> pts</small>
                            </strong>
                            <button
                              className="text-button"
                              onClick={() => openProcedure(item.id)}
                            >
                              Practice <ArrowRight size={16} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </section>
                  <div className="content-notice">
                    <Info size={18} />
                    <p>
                      This personal version tracks your own records. A shared
                      class leaderboard would require accounts and a database;
                      no other students’ data is displayed here.
                    </p>
                  </div>
                </>
              )}

              {page === 'Achievements' && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">CELEBRATE THE LITTLE WINS</span>
                      <h2>Good habits deserve recognition.</h2>
                      <p>
                        You’ve earned{' '}
                        {badges.filter((badge) => badge.unlocked).length} of{' '}
                        {badges.length} achievements. Keep showing up.
                      </p>
                    </div>
                    <span className="soft-pill">
                      <Award size={17} /> Level {level}
                    </span>
                  </div>
                  <div className="badge-grid">
                    {badges.map(
                      ({ title, description, icon: Icon, unlocked }) => (
                        <article
                          className={`badge-card ${unlocked ? 'unlocked' : 'locked'}`}
                          key={title}
                        >
                          <div className="badge-emblem">
                            <Icon size={39} strokeWidth={1.5} />
                            {!unlocked && (
                              <span className="badge-lock">
                                <LockKeyhole size={12} />
                              </span>
                            )}
                          </div>
                          <h3>{title}</h3>
                          <p>{description}</p>
                          <span className="badge-status">
                            {unlocked ? (
                              <>
                                <Check size={14} /> Earned
                              </>
                            ) : (
                              'Keep practicing'
                            )}
                          </span>
                        </article>
                      ),
                    )}
                  </div>
                </>
              )}

              {page === 'Resources' && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">YOUR LEARNING TOOLKIT</span>
                      <h2>A little knowledge goes a long way.</h2>
                      <p>
                        Trusted references to support your practice and
                        curiosity.
                      </p>
                    </div>
                    <BookOpen size={38} className="intro-icon" />
                  </div>
                  <div className="resource-grid">
                    {resourceItems.map((item) => (
                      <article className="resource-card" key={item.title}>
                        <span className="resource-icon">
                          <BookOpen size={25} />
                        </span>
                        <span className="eyebrow">{item.category}</span>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <a href={item.url} target="_blank" rel="noreferrer">
                          Read the reference <ExternalLink size={16} />
                        </a>
                      </article>
                    ))}
                  </div>
                  <section className="white-card reflection-card">
                    <span className="heading-icon">
                      <MessageCircle size={22} />
                    </span>
                    <div>
                      <h2>Make your practice meaningful.</h2>
                      <p>
                        After each scenario, ask yourself: What was the safest
                        action? What made another answer less appropriate? What
                        would I confirm with my instructor?
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate('Procedures')}
                      >
                        Put your learning into practice <ArrowRight size={16} />
                      </button>
                    </div>
                  </section>
                  <div className="content-notice">
                    <Info size={18} />
                    <p>
                      External references open in a new tab. Always follow your
                      institution’s current policies and your instructor’s
                      guidance.
                    </p>
                  </div>
                </>
              )}

              {page === 'About' && (
                <>
                  <div className="about-hero">
                    <span className="about-icon">
                      <HeartPulse size={48} />
                    </span>
                    <span className="eyebrow">WELCOME TO RETDEMQUEST</span>
                    <h2>
                      A safe space to practice
                      <br />
                      your next caring decision.
                    </h2>
                    <p>
                      RETDEMQUEST turns nursing practice into small, thoughtful
                      scenarios. Make a decision, understand the reasoning, and
                      build confidence one step at a time.
                    </p>
                    <button
                      className="primary-button"
                      onClick={() => navigate('Procedures')}
                    >
                      Let’s practice <ArrowRight size={17} />
                    </button>
                  </div>
                  <div className="about-grid">
                    <article className="white-card">
                      <ShieldCheck size={28} />
                      <h3>Learn with care</h3>
                      <p>
                        Three six-question demo procedures support reflection.
                        They are educational examples and need instructor review
                        before use in formal assessment.
                      </p>
                    </article>
                    <article className="white-card">
                      <LockKeyhole size={28} />
                      <h3>Your progress, your device</h3>
                      <p>
                        Your name and practice history stay in this browser’s
                        local storage. There are no accounts or cloud sync.
                        Clearing browser data removes your progress.
                      </p>
                    </article>
                    <article className="white-card">
                      <Star size={28} />
                      <h3>Progress over perfection</h3>
                      <p>
                        Earn 50 points for each correct answer. Your highest run
                        score per procedure counts toward your total. Revisit
                        explanations and practice again anytime.
                      </p>
                    </article>
                  </div>
                </>
              )}
            </div>
          )}
          <footer className="page-footer">
            <span>
              RETDEMQUEST <span className="footer-dot">·</span> A little
              practice, a little more confidence.
            </span>
            <span>
              Educational demo <span className="footer-dot">·</span> Personal
              practice
            </span>
          </footer>
        </main>
      </div>

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
      {modal && (
        <ModalDialog
          title={
            modal === 'settings'
              ? 'Your practice settings'
              : modal === 'help'
                ? 'A little help along the way'
                : 'Your learning updates'
          }
          onClose={closeModal}
        >
          {modal === 'settings' && (
            <>
              <form onSubmit={saveName}>
                <label className="form-label" htmlFor="profile-name">
                  What should we call you?
                </label>
                <input
                  id="profile-name"
                  className="profile-input"
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  maxLength={30}
                  required
                />
                <p className="small-note">
                  Your profile and practice progress are saved in this browser.
                </p>
                <button
                  className="primary-button"
                  disabled={!profileName.trim()}
                  type="submit"
                >
                  Save Profile <Check size={16} />
                </button>
              </form>
              <div className="settings-divider" />
              <h3>Start fresh</h3>
              <p className="modal-copy">
                Reset all scores, history, and achievements on this device. Your
                display name will stay.
              </p>
              {confirmReset ? (
                <div className="reset-confirm">
                  <strong>
                    This permanently removes your practice progress.
                  </strong>
                  <div>
                    <button className="danger-button" onClick={resetProgress}>
                      Yes, reset my progress
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setConfirmReset(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="reset-button"
                  onClick={() => setConfirmReset(true)}
                >
                  <RotateCcw size={16} /> Reset progress
                </button>
              )}
            </>
          )}
          {modal === 'help' && (
            <>
              <p className="modal-copy">
                Take your time. This is a space to learn, not a race.
              </p>
              <ol className="help-steps">
                <li>
                  <strong>Read the scenario.</strong>
                  <p>
                    Consider the patient information and what the question asks.
                  </p>
                </li>
                <li>
                  <strong>Make your decision.</strong>
                  <p>
                    Select A, B, or C, then submit. Each answer is recorded once
                    per run.
                  </p>
                </li>
                <li>
                  <strong>Learn from the explanation.</strong>
                  <p>
                    You’ll see feedback and the reasoning after every answer.
                  </p>
                </li>
                <li>
                  <strong>Keep going.</strong>
                  <p>
                    Finish all six steps to record a completed procedure.
                    Replays keep your best score.
                  </p>
                </li>
              </ol>
              <div className="content-notice">
                <ShieldCheck size={18} />
                <p>
                  This is a demonstration learning tool. For real patient care,
                  follow your approved clinical protocols and supervisor’s
                  guidance.
                </p>
              </div>
            </>
          )}
          {modal === 'notifications' && (
            <>
              {progress.history.length ? (
                <div className="notifications-list">
                  {progress.history
                    .slice(-5)
                    .reverse()
                    .map((run, index) => (
                      <div
                        className="notification-item"
                        key={`${run.completedAt}-${index}`}
                      >
                        <span className="history-icon">
                          <Award size={21} />
                        </span>
                        <div>
                          <strong>Another milestone!</strong>
                          <p>
                            You completed{' '}
                            {
                              procedures.find((item) => item.id === run.id)!
                                .title
                            }{' '}
                            with {correctCount(run.id, run.answers)} of 6
                            answers correct.
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon={Bell}
                  title="You’re all caught up"
                  text="Finish your first procedure to see your learning milestones here."
                />
              )}
            </>
          )}
        </ModalDialog>
      )}
    </>
  );
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
}) {
  return (
    <div className="metric-card">
      <span>
        <Icon size={23} />
      </span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}
function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="empty-state">
      <Icon size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

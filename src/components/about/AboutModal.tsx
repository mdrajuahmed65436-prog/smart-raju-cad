import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Cpu, Loader2, Mail, Send, X } from 'lucide-react';
import creatorPhoto from '@/assets/images/720919.jpg';
import { submitFeedback } from '@/lib/feedback';
import { BUTTON_PRIMARY, INPUT_CLASS, LABEL_CLASS } from '@/lib/uiClasses';

const CREATOR_EMAIL = 'mdrajuahmed65436@gmail.com';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

export default function AboutModal({ open, onClose }: AboutModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SubmitState>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 5) {
      setValidationError('Please write at least a few words in your message.');
      return;
    }
    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) {
      setValidationError('Please enter a valid email address or leave it empty.');
      return;
    }
    setValidationError(null);
    setStatus('sending');
    try {
      await submitFeedback({ name, email, message: trimmedMessage });
      setStatus('sent');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatus('error');
      setValidationError(err instanceof Error ? err.message : 'Your message could not be sent.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-creator-title"
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl animate-modal-in dark:border-slate-800 dark:bg-slate-900 sm:max-w-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-8">
          <div className="flex shrink-0 flex-col items-center gap-3 sm:w-40">
            <img
              src={creatorPhoto}
              alt="MD. Raju Ahmed"
              className="h-32 w-32 rounded-2xl object-cover shadow-md ring-2 ring-sky-500/30 sm:h-40 sm:w-40"
            />
            <a
              href={`mailto:${CREATOR_EMAIL}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 underline-offset-4 hover:underline dark:text-sky-300"
            >
              <Mail className="h-3.5 w-3.5" />
              {CREATOR_EMAIL}
            </a>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">About the Creator</p>
            <h2 id="about-creator-title" className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              MD. Raju Ahmed
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300" lang="bn">
              এমডি রাজু আহমেদ
            </p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Raju Ahmed is a software developer and embedded systems engineer who builds practical tools that connect hardware, data and
              everyday design work. Smart Raju CAD brings that approach to home planning: enter your plot, rooms and roof, and get a scaled
              blueprint, a 3D model, solar estimates and a material list in one place.
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Cpu className="h-3.5 w-3.5" /> Software development, embedded systems, Smart Raju CAD
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 p-5 sm:p-8 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Send feedback</h3>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Suggestions, bug reports or ideas for new features are welcome.</p>

          {status === 'sent' ? (
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300" role="status">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Thank you for your feedback!</p>
                <button type="button" onClick={() => setStatus('idle')} className="mt-1 text-xs underline underline-offset-4">
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="feedback-name" className={LABEL_CLASS}>
                    Name (optional)
                  </label>
                  <input
                    id="feedback-name"
                    className={`${INPUT_CLASS} mt-1.5`}
                    value={name}
                    maxLength={100}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="feedback-email" className={LABEL_CLASS}>
                    Email (optional)
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    className={`${INPUT_CLASS} mt-1.5`}
                    value={email}
                    maxLength={200}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="feedback-message" className={LABEL_CLASS}>
                  Message
                </label>
                <textarea
                  id="feedback-message"
                  rows={4}
                  className={`${INPUT_CLASS} mt-1.5 resize-y`}
                  value={message}
                  maxLength={2000}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              {validationError && (
                <p role="alert" className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  {validationError}
                </p>
              )}
              <button type="submit" className={BUTTON_PRIMARY} disabled={status === 'sending'}>
                {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {status === 'sending' ? 'Sending...' : 'Send feedback'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

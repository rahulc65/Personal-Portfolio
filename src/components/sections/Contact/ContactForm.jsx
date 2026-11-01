import { useRef, useState } from 'react';
import { submitContact } from '../../../lib/submitContact';
import ServiceSelect from './ServiceSelect';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY = { firstName: '', lastName: '', service: '', email: '', message: '', company: '' };

function validate(v) {
  const errors = {};
  if (!v.firstName.trim()) errors.firstName = 'Please enter your first name.';
  if (!v.email.trim()) errors.email = 'Please enter your email.';
  else if (!EMAIL_RE.test(v.email.trim())) errors.email = 'That email looks incomplete.';
  return errors;
}

const labelCls = 'm-0 mb-[clamp(2px,0.4vw,6px)] block font-mono text-[clamp(15px,1.4vw,18px)] font-bold text-[#3a3835]';
const fieldCls =
  'w-full border-0 border-b border-[#a9a7a2] bg-transparent px-0.5 py-2 font-mono text-[13px] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[#7d7a74] focus:border-accent focus:shadow-[0_1px_0_0_var(--color-accent)] aria-[invalid=true]:border-accent';
const errCls = 'm-0 mt-1 font-mono text-[11px] text-accent';

/**
 * ContactForm
 * Underline-style form: name, service, email, project description.
 * Validates on submit (first name + a valid email are required), focuses the first
 * problem, and shows sending / success / error states. Delivery lives in
 * lib/submitContact.js (endpoint or mailto, see data/contact.js).
 */
export default function ContactForm({ serviceOptions = [], config }) {
  const [values, setValues] = useState({ ...EMPTY, service: serviceOptions[0] ?? '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [note, setNote] = useState('');
  const refs = useRef({});

  const set = (name) => (e) => {
    const { value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
    if (status === 'success' || status === 'error') setStatus('idle');
  };

  const autosize = (e) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status === 'sending') return;

    const found = validate(values);
    setErrors(found);
    const firstBad = ['firstName', 'email'].find((k) => found[k]);
    if (firstBad) {
      refs.current[firstBad]?.focus();
      return;
    }

    // Honeypot: real visitors never see or fill this field.
    if (values.company) {
      setStatus('success');
      setNote('Thanks! Your message is on its way.');
      return;
    }

    setStatus('sending');
    try {
      const { mode } = await submitContact(values, config);
      setStatus('success');
      setNote(mode === 'mailto' ? 'Opening your email app with your message ready to send.' : 'Thanks! Your message is on its way.');
      setValues({ ...EMPTY, service: serviceOptions[0] ?? '' });
      const ta = refs.current.message;
      if (ta) ta.style.height = 'auto';
    } catch {
      setStatus('error');
      setNote('Something went wrong sending that. Please try again in a moment.');
    }
  };

  const sending = status === 'sending';

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[clamp(18px,2.4vw,30px)]">
      <fieldset className="m-0 border-0 p-0">
        <legend className={`${labelCls} p-0`}>Name (required )</legend>
        <div className="grid grid-cols-2 gap-[clamp(10px,1.2vw,14px)]">
          <div>
            <input
              ref={(n) => (refs.current.firstName = n)}
              type="text"
              name="firstName"
              autoComplete="given-name"
              placeholder="First Name"
              aria-label="First name"
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? 'err-firstName' : undefined}
              value={values.firstName}
              onChange={set('firstName')}
              className={fieldCls}
            />
            {errors.firstName && (
              <p id="err-firstName" className={errCls}>
                {errors.firstName}
              </p>
            )}
          </div>
          <input
            type="text"
            name="lastName"
            autoComplete="family-name"
            placeholder="Last Name"
            aria-label="Last name"
            value={values.lastName}
            onChange={set('lastName')}
            className={fieldCls}
          />
        </div>
      </fieldset>

      <div>
        <label htmlFor="contact-service" className={labelCls}>
          Service
        </label>
        <ServiceSelect
          id="contact-service"
          name="service"
          value={values.service}
          options={serviceOptions}
          onChange={(service) => set('service')({ target: { value: service } })}
          className={fieldCls}
        />
      </div>

      <div>
        <label htmlFor="contact-email" className={labelCls}>
          Email ( required )
        </label>
        <input
          ref={(n) => (refs.current.email = n)}
          id="contact-email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="example@gmail.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'err-email' : undefined}
          value={values.email}
          onChange={set('email')}
          className={fieldCls}
        />
        {errors.email && (
          <p id="err-email" className={errCls}>
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-message" className={labelCls}>
          Project description
        </label>
        <textarea
          ref={(n) => (refs.current.message = n)}
          id="contact-message"
          name="message"
          rows={1}
          placeholder="I need a website...."
          value={values.message}
          onChange={set('message')}
          onInput={autosize}
          className={`${fieldCls} block resize-none overflow-hidden`}
        />
      </div>

      {/* honeypot */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" value={values.company} onChange={set('company')} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="submit"
          disabled={sending}
          className="group inline-flex cursor-pointer items-center gap-3 rounded-pill border border-ink bg-transparent py-[4px] pl-[22px] pr-[4px] font-mono text-[13px] font-semibold text-ink transition-colors duration-300 hover:bg-ink hover:text-white disabled:cursor-wait disabled:opacity-60"
        >
          <span>{sending ? 'Sending…' : 'Submit'}</span>
          <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-accent text-white">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-45">
              <path d="M3 9 9 3M4 3h5v5" />
            </svg>
          </span>
        </button>

        <p
          role="status"
          aria-live="polite"
          className={`m-0 font-mono text-[12px] ${status === 'error' ? 'text-accent' : 'text-[#3a3835]'}`}
        >
          {status === 'success' || status === 'error' ? note : ''}
        </p>
      </div>
    </form>
  );
}
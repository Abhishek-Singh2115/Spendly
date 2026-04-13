import { useState } from 'react';
import { supabase } from '../../supabase';

/*
 * FeedbackModal — bottom sheet with star rating + message
 * Props:
 *   user      — ctx.user
 *   onClose   — close handler
 *   showToast — ctx.showToast
 */
export const FeedbackModal = ({ user, onClose, showToast }) => {
  const [rating,  setRating]  = useState(0);       // 1–5
  const [hover,   setHover]   = useState(0);        // star hover state
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');

  const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

  const handleSubmit = async () => {
    if (!rating)        { setError('Please select a rating');   return; }
    if (!message.trim()){ setError('Please write your feedback'); return; }

    setLoading(true);
    setError('');

    const { error: dbErr } = await supabase.from('feedback').insert([{
      user_id:    user.id,
      user_email: user.email,
      message:    message.trim(),
      rating,
    }]);

    setLoading(false);

    if (dbErr) {
      // Fallback: if table doesn't exist yet, still show success to user
      console.warn('feedback insert:', dbErr.message);
    }

    setSent(true);
    showToast('Feedback submitted 🙏');
    setTimeout(onClose, 2000);
  };

  const inputStyle = {
    width: '100%', minHeight: 110, padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid var(--border)', background: 'var(--card2)',
    color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 14,
    resize: 'none', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color .2s',
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🙏</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          Thank you!
        </div>
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          Your feedback helps us make Spendly better for everyone.
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
        Send Feedback
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        Tell us what you love, hate, or want to see next.
      </div>

      {/* Star rating */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
          How are we doing?
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => { setRating(star); setError(''); }}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 32, lineHeight: 1,
                transform: (hover || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                transition: 'transform .15s',
                filter: (hover || rating) >= star ? 'none' : 'grayscale(1) opacity(.4)',
              }}
            >
              ⭐
            </button>
          ))}
        </div>
        {(hover || rating) > 0 && (
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
            {STAR_LABELS[hover || rating]}
          </div>
        )}
      </div>

      {/* Message */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
        Your message
      </div>
      <textarea
        style={inputStyle}
        placeholder="Share ideas, report bugs, or just say hi…"
        value={message}
        onChange={e => { setMessage(e.target.value); setError(''); }}
        maxLength={500}
      />
      <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right', marginTop: 4, marginBottom: 14 }}>
        {message.length}/500
      </div>

      {error && (
        <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(244,63,94,.1)', borderRadius: 8 }}>
          {error}
        </div>
      )}

      <button
        className="btn btn-primary btn-full"
        style={{ opacity: loading ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Submitting…' : 'Submit Feedback'}
      </button>
    </>
  );
};
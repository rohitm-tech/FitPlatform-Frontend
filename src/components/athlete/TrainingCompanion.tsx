import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, ImagePlus, ArrowUp, X, Sparkles, Images } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
export default function TrainingCompanion() {
  const queries = useQueryClient();
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState<{ mimeType: string; data: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [gallery, setGallery] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const {
    data: messages = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['ai-conversation'],
    queryFn: async () => (await api.get('/ai/conversation')).data.data,
  });
  const { data: photos = [] } = useQuery({
    queryKey: ['ai-photos'],
    queryFn: async () => (await api.get('/ai/photos')).data.data,
    enabled: gallery,
  });
  useEffect(() => {
    bottom.current?.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, [messages, busy]);
  const choose = async (file: File | undefined) => {
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 15 * 1024 * 1024
    ) {
      toast.error('Choose a JPEG, PNG or WebP under 15 MB');
      return;
    }
    try {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.src = url;
      await image.decode();
      const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = image.width * ratio;
      canvas.height = image.height * ratio;
      canvas
        .getContext('2d')!
        .drawImage(image, 0, 0, canvas.width, canvas.height);
      setPhoto({
        mimeType: 'image/jpeg',
        data: canvas.toDataURL('image/jpeg', 0.82).split(',')[1],
      });
      URL.revokeObjectURL(url);
    } catch {
      toast.error('This image could not be read');
    }
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !photo) return;
    setBusy(true);
    try {
      await api.post('/ai/chat', {
        message: message.trim() || 'What can you tell me about this photo?',
        ...(photo ? { photo } : {}),
      });
      setMessage('');
      setPhoto(null);
      await queries.invalidateQueries({ queryKey: ['ai-conversation'] });
      queries.invalidateQueries({ queryKey: ['ai-photos'] });
    } catch (e: any) {
      toast.error(
        e.response?.status === 429
          ? 'AI usage limit reached. Try again later.'
          : 'The AI response could not be completed. Your message is still here; try again.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <aside className="training-companion">
      <div className="companion-heading">
        <div className="companion-icon">
          <Sparkles size={18} />
        </div>
        <div>
          <h2>Your training companion</h2>
          <p>Gemini · grounded in your data</p>
        </div>
        <button
          type="button"
          aria-label={
            gallery ? 'Return to conversation' : 'Open your photo gallery'
          }
          aria-expanded={gallery}
          onClick={() => setGallery(!gallery)}
        >
          <Images size={19} />
        </button>
      </div>
      {gallery ? (
        <div className="photo-gallery">
          <h3>Your private photo gallery</h3>
          <p>Only photos you send to the AI are saved.</p>
          {photos.length ? (
            <div className="gallery-grid">
              {photos.map((p: any) => (
                <figure key={p._id}>
                  <img
                    src={`${api.defaults.baseURL}/ai/photos/${p._id}`}
                    alt={p.caption || 'Your uploaded photo'}
                  />
                  <figcaption>{p.caption}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p>No photos sent yet.</p>
          )}
        </div>
      ) : (
        <div
          className="conversation"
          role="log"
          aria-live="polite"
          aria-label="Training conversation"
        >
          {isLoading ? (
            <p>Loading your conversation…</p>
          ) : isError ? (
            <p>
              Could not load conversation.{' '}
              <button onClick={() => refetch()}>Retry</button>
            </p>
          ) : messages.length ? (
            messages.map((m: any) => (
              <div
                key={m._id}
                className={`chat-message ${m.role === 'user' ? 'from-user' : 'from-ai'}`}
              >
                {m.photoId && (
                  <img
                    className="chat-photo"
                    src={`${api.defaults.baseURL}/ai/photos/${m.photoId}`}
                    alt="Photo you shared with the coach"
                  />
                )}
                <p>{m.text}</p>
                <span>{m.role === 'user' ? 'You' : 'AI companion'}</span>
              </div>
            ))
          ) : (
            <div className="chat-welcome">
              <Sparkles size={28} />
              <h3>Let’s connect the dots.</h3>
              <p>
                Ask about your training or recovery. Share a meal photo for an
                approximate calorie range, or an exercise photo for general
                guidance.
              </p>
              <div className="chat-suggestions">
                {[
                  'How does my recovery look?',
                  'Explain my latest review',
                  'What should I focus on today?',
                ].map((q) => (
                  <button key={q} onClick={() => setMessage(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {busy && (
            <div className="chat-message from-ai thinking" role="status">
              Reviewing your context<span>Gemini is preparing a response…</span>
            </div>
          )}
          <div ref={bottom} />
        </div>
      )}
      <form className="chat-composer" onSubmit={send}>
        {photo && (
          <div className="photo-preview">
            <img
              src={`data:${photo.mimeType};base64,${photo.data}`}
              alt="Photo ready to send"
            />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => setPhoto(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <textarea
          aria-label="Message your AI companion"
          placeholder="Ask a question or add a photo…"
          rows={2}
          value={message}
          maxLength={2000}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="composer-tools">
          <label className="upload-control" title="Upload photo">
            <ImagePlus size={18} />
            <span className="sr-only">Upload photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                choose(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          <label className="upload-control" title="Take a photo">
            <Camera size={18} />
            <span className="sr-only">Take a photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                choose(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          <small>Photos are sent to Gemini for analysis.</small>
          <button
            className="send-message"
            type="submit"
            aria-label="Send message"
            disabled={busy || (!message.trim() && !photo)}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </form>
      <p className="companion-disclaimer">
        General training guidance. Photo estimates have uncertainty; pain or
        injury needs a qualified professional.
      </p>
    </aside>
  );
}

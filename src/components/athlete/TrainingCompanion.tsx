import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Camera, ImagePlus, ArrowUp, X, Sparkles, Images, History, Plus, Search, Pencil, Archive, RotateCcw, Copy, Check, ArrowLeft, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import '../../companion.css';

type Photo = { mimeType: string; data: string };
type ChatMessage = { _id?: string; role: 'user' | 'assistant'; text: string; turnId?: string; status?: 'pending' | 'complete' | 'failed'; error?: string; photoId?: string; preview?: Photo; at?: string };
type Thread = { _id: string; title: string; archived: boolean; messages: ChatMessage[]; activeTurnId?: string; updatedAt: string };
type Pending = { conversationId: string | null; turnId: string; text: string; photo: Photo | null; failed?: boolean; error?: string };
const photoUrl = (id: string) => `${api.defaults.baseURL}/ai/photos/${id}`;

export default function TrainingCompanion({ expanded = false }: { expanded?: boolean }) {
  const queries = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [compactId, setCompactId] = useState<string | null>(null);
  const [newChat, setNewChat] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { text: string; photo: Photo | null }>>({});
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [gallery, setGallery] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState('');
  const [updating, setUpdating] = useState(false);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [copied, setCopied] = useState('');
  const scroll = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true);
  const previousId = useRef<string | null>(null);
  useEffect(() => { const timer = setTimeout(() => setSearchTerm(search), 250); return () => clearTimeout(timer); }, [search]);
  const history = useInfiniteQuery({
    queryKey: ['ai-history', archived, searchTerm], initialPageParam: 1,
    queryFn: async ({ pageParam }) => (await api.get('/ai/conversations', { params: { page: pageParam, archived, q: searchTerm } })).data.data,
    getNextPageParam: (last: any) => last.hasMore ? last.page + 1 : undefined,
  });
  const latest = useQuery({ queryKey: ['ai-latest'], queryFn: async () => (await api.get('/ai/conversations')).data.data.conversations[0] || null });
  const rows: Thread[] = history.data?.pages.flatMap((p: any) => p.conversations) || [];
  const activeId = newChat ? null : (expanded ? params.get('chat') : compactId) || latest.data?._id || null;
  const draftKey = activeId || 'new';
  const draft = drafts[draftKey] || { text: '', photo: null };
  const setDraft = (patch: Partial<typeof draft>) => setDrafts(current => ({ ...current, [draftKey]: { ...(current[draftKey] || { text: '', photo: null }), ...patch } }));
  const thread = useQuery<Thread>({
    queryKey: ['ai-thread', activeId], enabled: !!activeId,
    queryFn: async () => (await api.get(`/ai/conversations/${activeId}`)).data.data,
    refetchInterval: query => query.state.data?.activeTurnId ? 3000 : false,
  });
  const photos = useQuery({ queryKey: ['ai-photos'], queryFn: async () => (await api.get('/ai/photos')).data.data, enabled: gallery });
  const refreshHistory = () => { queries.invalidateQueries({ queryKey: ['ai-history'] }); queries.invalidateQueries({ queryKey: ['ai-latest'] }); };
  const chooseThread = (id: string) => {
    setNewChat(false); setGallery(false); setHistoryOpen(false); setRenaming(false);
    if (expanded) setParams({ chat: id }); else setCompactId(id);
  };
  const startNew = () => { setNewChat(true); setGallery(false); setHistoryOpen(false); setRenaming(false); if (expanded) setParams({}); composer.current?.focus(); };
  const visiblePending = pending && pending.conversationId === activeId ? pending : (!activeId && pending?.conversationId === null ? pending : null);
  let messages = thread.data?.messages || [];
  if (visiblePending && !messages.some(m => m.turnId === visiblePending.turnId)) messages = [...messages,
    { role: 'user', text: visiblePending.text, turnId: visiblePending.turnId, preview: visiblePending.photo || undefined, at: new Date().toISOString() },
    { role: 'assistant', text: '', turnId: visiblePending.turnId, status: visiblePending.failed ? 'failed' : 'pending', error: visiblePending.error }];
  const waiting = sending || !!thread.data?.activeTurnId;
  useEffect(() => {
    const node = scroll.current; if (!node) return;
    if (previousId.current !== activeId || nearBottom.current) node.scrollTop = node.scrollHeight;
    previousId.current = activeId;
  }, [activeId, messages.length, thread.data?.updatedAt, pending, gallery]);
  const choosePhoto = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) { toast.error('Choose a JPEG, PNG or WebP under 15 MB'); return; }
    setReadingPhoto(true); const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      const ratio = Math.min(1, 1600 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas'); canvas.width = image.width * ratio; canvas.height = image.height * ratio;
      canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
      setDraft({ photo: { mimeType: 'image/jpeg', data: canvas.toDataURL('image/jpeg', .82).split(',')[1] } });
    } catch { toast.error('This image could not be read'); } finally { URL.revokeObjectURL(url); setReadingPhoto(false); }
  };
  const send = async (event?: FormEvent, retry?: { turnId: string; text: string }) => {
    event?.preventDefault(); if (waiting || readingPhoto || thread.data?.archived || (!retry && !draft.text.trim() && !draft.photo)) return;
    const snapshot: Pending = { conversationId: activeId, turnId: retry?.turnId || crypto.randomUUID(), text: retry?.text || draft.text.trim() || 'What can you tell me about this photo?', photo: retry ? (pending?.turnId === retry.turnId ? pending.photo : null) : draft.photo };
    setPending(snapshot); setSending(true); setGallery(false); nearBottom.current = true;
    if (!retry) setDraft({ text: '', photo: null });
    let id = activeId;
    try {
      if (!id) { const created = (await api.post('/ai/conversations')).data.data as Thread; id = created._id; queries.setQueryData(['ai-thread', id], created); setPending({ ...snapshot, conversationId: id }); chooseThread(id); }
      const result = await api.post('/ai/chat', { conversationId: id, clientRequestId: snapshot.turnId, message: snapshot.text, ...(snapshot.photo ? { photo: snapshot.photo } : {}) });
      const saved = (await api.get(`/ai/conversations/${id}`)).data.data;
      queries.setQueryData(['ai-thread', id], saved); setPending(null);
      if (!result.data.data.answer) toast.error('No reply was returned. Your message is saved.');
      queries.invalidateQueries({ queryKey: ['ai-photos'] });
    } catch (e: any) {
      const error = e.response?.status === 429 ? 'AI usage limit reached. Wait a little before retrying.' : e.response?.data?.message || 'The connection was interrupted. Your question is kept here so you can retry.';
      let saved: Thread | undefined;
      if (id) { try { saved = (await api.get(`/ai/conversations/${id}`)).data.data; queries.setQueryData(['ai-thread', id], saved); } catch { /* Keep the local question if the network is unavailable. */ } }
      setPending(saved?.messages.some(m => m.turnId === snapshot.turnId) ? null : { ...snapshot, conversationId: id, failed: true, error });
      toast.error(error);
    } finally { setSending(false); refreshHistory(); composer.current?.focus(); }
  };
  const updateThread = async (patch: { title?: string; archived?: boolean }) => {
    if (!activeId) return; setUpdating(true);
    try { const saved = (await api.patch(`/ai/conversations/${activeId}`, patch)).data.data; queries.setQueryData(['ai-thread', activeId], saved); setRenaming(false); refreshHistory(); toast.success(patch.archived === undefined ? 'Conversation renamed' : patch.archived ? 'Conversation archived. You can restore it from history.' : 'Conversation restored'); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Could not update conversation'); } finally { setUpdating(false); }
  };
  const copy = async (message: ChatMessage) => { try { await navigator.clipboard.writeText(message.text); setCopied(message._id || message.turnId || ''); } catch { toast.error('Copy is unavailable. Select the answer text to copy it.'); } };
  return <div className={expanded ? `ai-workspace ${historyOpen ? 'show-history' : ''}` : 'companion-compact'}>
    {expanded && <section className="chat-history" aria-label="Conversation history"><div className="history-title"><h2>Conversations</h2><button className="icon-control history-close" aria-label="Close conversation history" onClick={() => setHistoryOpen(false)}><X size={18}/></button></div><button className="new-chat-button" onClick={startNew} disabled={sending}><Plus size={17}/>New conversation</button><label className="history-search"><Search size={16}/><input aria-label="Search conversation titles" placeholder="Search conversations" value={search} onChange={e => setSearch(e.target.value)}/></label><div className="history-tabs"><button aria-pressed={!archived} onClick={() => setArchived(false)}>Recent</button><button aria-pressed={archived} onClick={() => setArchived(true)}>Archived</button></div><div className="history-list">{history.isLoading ? <p role="status">Loading conversations…</p> : history.isError ? <div className="chat-state"><p>History could not be loaded.</p><button onClick={() => history.refetch()}>Retry</button></div> : rows.length ? rows.map(row => <button key={row._id} className={`history-row ${row._id === activeId ? 'selected' : ''}`} aria-current={row._id === activeId ? 'true' : undefined} onClick={() => chooseThread(row._id)}><MessageSquare size={16}/><span><strong>{row.title}</strong><small>{new Date(row.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{row.activeTurnId ? ' · Replying' : ''}</small></span></button>) : <p className="history-empty">{search ? 'No conversation titles match.' : archived ? 'No archived conversations.' : 'Your conversations will appear here.'}</p>}{history.hasNextPage && <button className="text-action" disabled={history.isFetchingNextPage} onClick={() => history.fetchNextPage()}>{history.isFetchingNextPage ? 'Loading…' : 'Load more conversations'}</button>}</div><p className="history-privacy">Private to your account. Archive keeps a conversation available here.</p></section>}
    <section className="training-companion" aria-label="AI training companion"><header className="companion-heading">{expanded ? <button className="icon-control history-toggle" aria-label="Open conversation history" aria-expanded={historyOpen} onClick={() => setHistoryOpen(true)}><History size={19}/></button> : <Sparkles size={20}/>}<div className="companion-title"><h2>{gallery ? 'Your photo gallery' : expanded ? thread.data?.title || 'New conversation' : 'Your training companion'}</h2><p>{gallery ? 'Only photos you send are saved' : 'AI coach · Gemini with your training context'}</p></div><div className="companion-header-actions">{!expanded && <Link className="icon-control" to="/athlete/companion" aria-label="Open conversation history"><History size={18}/></Link>}{expanded && activeId && !gallery && <><button className="icon-control" aria-label="Rename conversation" disabled={sending || thread.isLoading || thread.isError} onClick={() => { setTitle(thread.data?.title || ''); setRenaming(!renaming); }}><Pencil size={17}/></button><button className="icon-control" aria-label={thread.data?.archived ? 'Restore conversation' : 'Archive conversation'} disabled={waiting || updating} onClick={() => updateThread({ archived: !thread.data?.archived })}>{thread.data?.archived ? <RotateCcw size={17}/> : <Archive size={17}/>}</button></>}<button type="button" className="icon-control" aria-label={gallery ? 'Return to conversation' : 'Open your photo gallery'} aria-pressed={gallery} onClick={() => setGallery(!gallery)}>{gallery ? <ArrowLeft size={18}/> : <Images size={19}/>}</button></div></header>
    {renaming && <form className="rename-chat" onSubmit={e => { e.preventDefault(); if (title.trim()) updateThread({ title: title.trim() }); }}><label htmlFor="conversation-title">Conversation title</label><div><input id="conversation-title" className="fp-input" value={title} maxLength={80} onChange={e => setTitle(e.target.value)} required autoFocus/><button type="submit" disabled={updating}>Save</button><button type="button" onClick={() => setRenaming(false)}>Cancel</button></div></form>}
    {gallery ? <div className="photo-gallery">{photos.isLoading ? <p role="status">Loading photos…</p> : photos.isError ? <div className="chat-state"><p>Your gallery could not be loaded.</p><button onClick={() => photos.refetch()}>Retry</button></div> : photos.data?.length ? <div className="gallery-grid">{photos.data.map((p: any) => <figure key={p._id}><a href={photoUrl(p._id)} target="_blank" rel="noreferrer"><img src={photoUrl(p._id)} alt={p.caption || 'Your uploaded photo'} loading="lazy"/></a><figcaption>{p.caption}<time>{new Date(p.createdAt).toLocaleDateString()}</time></figcaption></figure>)}</div> : <div className="chat-state"><Images size={24}/><h3>A place for your photos.</h3><p>Send a photo with a question. It will be saved in your private gallery.</p><button onClick={() => setGallery(false)}>Back to conversation</button></div>}</div> : <div className="conversation" ref={scroll} role="log" aria-live="polite" aria-label="Training conversation" onScroll={() => { const n = scroll.current; if (n) nearBottom.current = n.scrollHeight - n.scrollTop - n.clientHeight < 100; }}>
    {activeId && thread.isLoading ? <div className="chat-state" role="status">Loading your conversation…</div> : thread.isError ? <div className="chat-state"><h3>This conversation couldn’t be opened.</h3><p>It may be unavailable or belong to a different account.</p><button onClick={() => thread.refetch()}>Retry</button><button onClick={startNew}>Start a new conversation</button></div> : messages.length ? messages.map((m, index) => <article key={m._id || `${m.turnId}-${m.role}-${index}`} className={`chat-message ${m.role === 'user' ? 'from-user' : 'from-ai'}`}><div className="chat-message-meta"><strong>{m.role === 'user' ? 'You' : 'AI coach'}</strong>{m.at && <time dateTime={m.at}>{new Date(m.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</time>}</div>{(m.preview || m.photoId) && <img className="chat-photo" src={m.preview ? `data:${m.preview.mimeType};base64,${m.preview.data}` : photoUrl(m.photoId!)} alt="Photo you shared with the AI coach"/>}{m.status === 'pending' ? <div className="reply-pending" role="status"><span className="reply-dots" aria-hidden="true"><i/><i/><i/></span><span>Reviewing your training context…</span></div> : m.status === 'failed' ? <div className="reply-failed" role="alert"><p>{m.error || 'The response was interrupted. Your question is saved.'}</p><button disabled={waiting} onClick={() => send(undefined, { turnId: m.turnId!, text: messages.find(x => x.turnId === m.turnId && x.role === 'user')?.text || '' })}><RotateCcw size={15}/>Retry reply</button></div> : <div className="chat-markdown"><ReactMarkdown>{m.text}</ReactMarkdown></div>}{m.role === 'assistant' && m.status !== 'pending' && m.status !== 'failed' && <button className="copy-answer" aria-label="Copy answer" onClick={() => copy(m)}>{copied === (m._id || m.turnId || '') ? <Check size={14}/> : <Copy size={14}/>}Copy</button>}</article>) : <div className="chat-welcome"><Sparkles size={25}/><h3>What’s on your mind?</h3><p>Make sense of your recovery, talk through a session, or share a photo.</p><div className="chat-suggestions">{['How does my recovery look?', 'Explain my latest review', 'What should I focus on today?'].map(q => <button key={q} onClick={() => { setDraft({ text: q }); composer.current?.focus(); }}>{q}<ArrowUp size={15}/></button>)}</div></div>}
    </div>}
    {thread.data?.archived ? <div className="chat-archived"><Archive size={17}/><p>This conversation is archived.</p><button disabled={updating} onClick={() => updateThread({ archived: false })}>Restore to continue</button></div> : <form className="chat-composer" onSubmit={send} aria-busy={sending}>{draft.photo && <div className="photo-preview"><img src={`data:${draft.photo.mimeType};base64,${draft.photo.data}`} alt="Photo ready to send"/><button type="button" className="icon-control" aria-label="Remove photo" onClick={() => setDraft({ photo: null })}><X size={17}/></button></div>}<textarea ref={composer} aria-label="Message your AI companion" placeholder="Ask about your training…" rows={2} value={draft.text} maxLength={2000} onChange={e => setDraft({ text: e.target.value })} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}/><div className="composer-tools"><label className="upload-control" title="Upload photo"><ImagePlus size={19}/><span className="sr-only">Upload photo</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={readingPhoto} onChange={e => { choosePhoto(e.target.files?.[0]); e.target.value = ''; }}/></label><label className="upload-control" title="Take a photo"><Camera size={19}/><span className="sr-only">Take a photo</span><input type="file" accept="image/*" capture="environment" disabled={readingPhoto} onChange={e => { choosePhoto(e.target.files?.[0]); e.target.value = ''; }}/></label><small>{readingPhoto ? 'Preparing photo…' : waiting ? 'You can write your next question while the AI replies.' : expanded ? 'Enter to send · Shift + Enter for a new line' : 'Ask a question or add a photo'}</small><button className="send-message" type="submit" aria-label="Send message" disabled={waiting || readingPhoto || (!draft.text.trim() && !draft.photo)}><ArrowUp size={19}/></button></div></form>}
    <p className="companion-disclaimer">AI can make mistakes. Photos are shared with Gemini. Guidance and food estimates are approximate.</p></section>
  </div>;
}

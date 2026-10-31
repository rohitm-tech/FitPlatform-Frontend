import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useComments, useCreateComment } from '../../queries/useAthlete';

interface CommentsThreadProps {
  athleteId: string;
  workoutId?: string;
  workoutLogId?: string;
}

export function CommentsThread({ athleteId, workoutId, workoutLogId }: CommentsThreadProps) {
  const { user } = useAuth();
  const { data: comments } = useComments(athleteId, { workoutId, workoutLogId });
  const createComment = useCreateComment(athleteId);
  const [text, setText] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await createComment.mutateAsync({ workoutId, workoutLogId, text });
    setText('');
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {comments?.map((comment) => (
          <li key={comment._id} className="text-sm">
            <span className="font-medium">{comment.authorId.name}</span>{' '}
            <span style={{ color: 'var(--fp-text-muted)' }}>{comment.text}</span>
          </li>
        ))}
      </ul>
      {user && (
        <div className="flex gap-2">
          <input
            className="fp-input"
            placeholder="Add a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button className="rounded-lg border px-3 py-1 text-sm" style={{ borderColor: 'var(--fp-border)' }} onClick={handleSubmit}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}

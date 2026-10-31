import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TrainingCompanion from '../../components/athlete/TrainingCompanion';
import { api } from '../../services/api';
vi.mock('../../services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), defaults: { baseURL: '/api/v1' } } }));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));
const id = '123456789012345678901234';
let current: any;
const envelope = (data: any) => ({ data: { data } });
function mount() { const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } }); return render(<MemoryRouter initialEntries={[`/athlete/companion?chat=${id}`]}><QueryClientProvider client={client}><TrainingCompanion expanded/></QueryClientProvider></MemoryRouter>); }
beforeEach(() => { cleanup(); vi.clearAllMocks(); current = { _id: id, title: 'Recovery conversation', archived: false, messages: [], updatedAt: '2026-10-31T12:00:00Z' }; vi.mocked(api.get).mockImplementation(async (path: any) => envelope(path === `/ai/conversations/${id}` ? current : path === '/ai/photos' ? [] : { conversations: [current], total: 1, page: 1, hasMore: false })); });
describe('Training companion', () => {
 it('clears the composer and displays the sent question before the answer arrives', async () => {
  let finish!: (value: any) => void;
  vi.mocked(api.post).mockImplementation((_path, body: any) => new Promise(resolve => { finish = value => { current = { ...current, messages: [{ _id: 'q', role: 'user', text: body.message, turnId: body.clientRequestId }, { _id: 'a', role: 'assistant', text: 'Keep today comfortable.', status: 'complete', turnId: body.clientRequestId }] }; resolve(value); }; }));
  mount(); const input = await screen.findByRole('textbox', { name: 'Message your AI companion' });
  await screen.findByRole('heading', { name: 'What’s on your mind?' });
  fireEvent.change(input, { target: { value: 'How is my recovery today?' } }); fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  expect(input).toHaveValue(''); expect(await screen.findByText('How is my recovery today?')).toBeVisible(); expect(screen.getByText('Reviewing your training context…')).toBeVisible(); expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  fireEvent.change(input, { target: { value: 'My next question' } });
  finish(envelope({ answer: 'Keep today comfortable.', conversationId: id }));
  expect(await screen.findByText('Keep today comfortable.')).toBeVisible(); expect(input).toHaveValue('My next question'); expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
 });
 it('keeps a failed sent message retryable without duplicating it or clearing the next draft', async () => {
  vi.mocked(api.post).mockRejectedValueOnce({ response: { status: 503, data: { message: 'AI unavailable' } } });
  mount(); const input = await screen.findByRole('textbox', { name: 'Message your AI companion' }); await screen.findByRole('heading', { name: 'What’s on your mind?' });
  fireEvent.change(input, { target: { value: 'Explain my training' } }); fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
  const retry = await screen.findByRole('button', { name: 'Retry reply' }); expect(input).toHaveValue('');
  const firstBody: any = vi.mocked(api.post).mock.calls[0][1];
  vi.mocked(api.post).mockImplementationOnce(async (_path, body: any) => { current = { ...current, messages: [{ role: 'user', text: body.message, turnId: body.clientRequestId }, { role: 'assistant', text: 'A useful answer.', status: 'complete', turnId: body.clientRequestId }] }; return envelope({ answer: 'A useful answer.' }); });
  fireEvent.change(input, { target: { value: 'Keep this draft' } }); fireEvent.click(retry);
  expect(await screen.findByText('A useful answer.')).toBeVisible(); expect(screen.getAllByText('Explain my training')).toHaveLength(1); expect(input).toHaveValue('Keep this draft'); expect((vi.mocked(api.post).mock.calls[1][1] as any).clientRequestId).toBe(firstBody.clientRequestId);
 });
 it('shows saved history and starts a fresh conversation without removing earlier chats', async () => {
  mount(); expect(await screen.findByRole('button', { name: /Recovery conversation/ })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));
  await waitFor(() => expect(screen.getByRole('heading', { name: 'New conversation' })).toBeVisible());
  expect(screen.getByRole('button', { name: /Recovery conversation/ })).toBeVisible(); expect(api.post).not.toHaveBeenCalled();
 });
});

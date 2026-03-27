/** @jest-environment jsdom */

import { jest } from '@jest/globals';

const mockSolveChallenge = jest.fn();

jest.mock('../src/solver.js', () => ({
  solveChallenge: (...args: unknown[]) => mockSolveChallenge(...args),
}));

import '../src/widget';

function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('RibauntWidget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    mockSolveChallenge.mockReset();
    global.fetch = jest.fn() as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches, solves, verifies, and emits lifecycle events', async () => {
    const widget = document.createElement('ribaunt-widget');
    widget.setAttribute('challenge-endpoint', '/challenge');
    widget.setAttribute('verify-endpoint', '/verify');

    const states: string[] = [];
    const verifyHandler = jest.fn();

    widget.addEventListener('state-change', ((event: CustomEvent<{ state: string }>) => {
      states.push(event.detail.state);
    }) as EventListener);
    widget.addEventListener('verify', verifyHandler as EventListener);

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ challenges: ['token-1', 'token-2'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    mockSolveChallenge.mockImplementation(async (_tokens: string[], onProgress?: (progress: number) => void) => {
      onProgress?.(25);
      onProgress?.(100);
      return [
        { nonce: '1', hash: 'hash-1' },
        { nonce: '2', hash: 'hash-2' },
      ];
    });

    document.body.appendChild(widget);

    const captcha = widget.shadowRoot?.querySelector('.captcha') as HTMLDivElement;
    expect(captcha).toBeTruthy();

    captcha.click();
    await flushPromises();
    await flushPromises();

    expect(global.fetch).toHaveBeenNthCalledWith(1, '/challenge');
    expect(mockSolveChallenge).toHaveBeenCalledWith(['token-1', 'token-2'], expect.any(Function));
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      '/verify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(verifyHandler).toHaveBeenCalledTimes(1);
    expect(states).toContain('initial');
    expect(states).toContain('verifying');
    expect(states).toContain('done');
    expect(widget.shadowRoot?.querySelector('p')?.textContent).toBe("You're a human");
  });

  it('emits an error event when challenge fetch fails', async () => {
    const widget = document.createElement('ribaunt-widget');
    widget.setAttribute('challenge-endpoint', '/challenge');

    const errorHandler = jest.fn();
    widget.addEventListener('error', errorHandler as EventListener);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    document.body.appendChild(widget);
    (widget.shadowRoot?.querySelector('.captcha') as HTMLDivElement).click();

    await flushPromises();
    await flushPromises();

    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(widget.shadowRoot?.querySelector('.captcha')?.getAttribute('data-state')).toBe('error');
  });

  it('does not start verification while disabled', async () => {
    const widget = document.createElement('ribaunt-widget');
    widget.setAttribute('challenge-endpoint', '/challenge');
    widget.setAttribute('disabled', 'true');

    document.body.appendChild(widget);

    const captcha = widget.shadowRoot?.querySelector('.captcha') as HTMLDivElement;
    expect(captcha.getAttribute('aria-disabled')).toBe('true');
    expect(captcha.tabIndex).toBe(-1);

    captcha.click();
    widget.startVerification?.();
    await flushPromises();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockSolveChallenge).not.toHaveBeenCalled();
    expect(captcha.getAttribute('data-state')).toBe('initial');
  });

  it('does not duplicate click listeners across rerenders', async () => {
    const widget = document.createElement('ribaunt-widget');
    widget.setAttribute('challenge-endpoint', '/challenge');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ challenges: ['token-1'] }),
    });
    mockSolveChallenge.mockResolvedValue([{ nonce: '1', hash: 'hash-1' }]);

    document.body.appendChild(widget);
    widget.setAttribute('show-warning', 'true');

    const captcha = widget.shadowRoot?.querySelector('.captcha') as HTMLDivElement;
    captcha.click();
    await flushPromises();
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(mockSolveChallenge).toHaveBeenCalledTimes(1);
  });

  it('does not start verification when the logo is clicked', async () => {
    const widget = document.createElement('ribaunt-widget');
    widget.setAttribute('challenge-endpoint', '/challenge');

    document.body.appendChild(widget);

    const logo = widget.shadowRoot?.querySelector('.logo') as HTMLAnchorElement;
    expect(logo).toBeTruthy();

    logo.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockSolveChallenge).not.toHaveBeenCalled();
    expect(widget.shadowRoot?.querySelector('.captcha')?.getAttribute('data-state')).toBe('initial');
  });
});

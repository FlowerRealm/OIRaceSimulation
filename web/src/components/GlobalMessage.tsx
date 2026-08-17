import type { ReactNode } from 'react';

export type GlobalMessageTone = 'warning' | 'success' | 'info';

export interface GlobalMessageProps {
  tone?: GlobalMessageTone;
  children?: ReactNode;
}

/** Transient banner under the level header. The engine writes #globalMessage. */
export function GlobalMessage({ tone, children }: GlobalMessageProps) {
  return (
    <div className={tone ? `global-message ${tone}` : 'global-message'} id="globalMessage">
      {children}
    </div>
  );
}

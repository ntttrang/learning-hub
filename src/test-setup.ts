import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// The eager content glob grew the module graph (Languages pack): first
// renders after a navigation can take longer than the 1s async-util default
// on CI hardware, flaking `waitFor` assertions suite-wide. One global
// default here beats sprinkling per-call timeouts.
configure({ asyncUtilTimeout: 5_000 });

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

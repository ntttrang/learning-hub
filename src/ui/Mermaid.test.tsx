import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Mermaid } from './Mermaid';

/* The library itself never loads in jsdom — every test mocks the import
 * boundary; real rendering is a walkthrough item, not a unit test. Mounts are
 * sequential on purpose: concurrent dynamic imports in one jsdom tick can
 * race past vitest's mock registry (one import loads the real library, which
 * jsdom cannot run). In the real app both imports share the module cache. */

const initialize = vi.fn();
const renderChart = vi.fn();

vi.mock('mermaid', () => ({
  default: {
    initialize: (...args: unknown[]) => initialize(...args),
    render: (...args: unknown[]) => renderChart(...args),
  },
}));

const CHART = 'flowchart TD\n  A --> B';

beforeEach(() => {
  initialize.mockReset();
  renderChart.mockReset();
});

describe('Mermaid', () => {
  it('renders the SVG the library produced', async () => {
    renderChart.mockResolvedValue({ svg: '<svg data-testid="ok">diagram</svg>' });
    render(<Mermaid chart={CHART} />);

    await waitFor(() => {
      expect(screen.getByTestId('ok')).toBeInTheDocument();
    });
    expect(renderChart).toHaveBeenCalledWith(expect.stringMatching(/^mmd-/), CHART);
  });

  it('initializes with the pinned options: no autostart, neutral theme, strict security', async () => {
    renderChart.mockResolvedValue({ svg: '<svg />' });
    render(<Mermaid chart={CHART} />);

    await waitFor(() => {
      expect(initialize).toHaveBeenCalled();
    });
    expect(initialize).toHaveBeenCalledWith({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'strict',
    });
  });

  it('falls back to the chart source in a <pre> when the library fails', async () => {
    initialize.mockImplementation(() => {
      throw new Error('module setup failed');
    });
    const { unmount } = render(<Mermaid chart={CHART} />);
    let fallback = await screen.findByLabelText('Diagram source');
    expect(fallback.tagName).toBe('PRE');
    expect(fallback.textContent).toContain('flowchart TD');
    unmount();

    initialize.mockImplementation(() => undefined); // library loads, render throws
    renderChart.mockRejectedValue(new Error('parse error'));
    render(<Mermaid chart={CHART} />);
    fallback = await screen.findByLabelText('Diagram source');
    expect(fallback.textContent).toContain('flowchart TD');
  });

  it('passes distinct render ids per invocation — the StrictMode double-render invariant', async () => {
    renderChart.mockResolvedValue({ svg: '<svg />' });

    const first = render(<Mermaid chart={CHART} />);
    await waitFor(() => {
      expect(renderChart).toHaveBeenCalledTimes(1);
    });
    first.unmount();

    render(<Mermaid chart={CHART} />);
    await waitFor(() => {
      expect(renderChart).toHaveBeenCalledTimes(2);
    });

    const [idA, idB] = [renderChart.mock.calls[0][0], renderChart.mock.calls[1][0]];
    expect(idA).not.toBe(idB);
    expect(String(idA)).toMatch(/^mmd-/);
    expect(String(idB)).toMatch(/^mmd-/);
  });
});

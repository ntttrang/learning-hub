import { fireEvent, render, screen } from '@testing-library/react';
import { Flame } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Callout } from './Callout';
import { DataTable } from './DataTable';
import { DocResolverProvider } from './doc-context';
import { Pill } from './Pill';
import { ProgressBar } from './ProgressBar';

describe('Button', () => {
  it('renders variants and an optional leading icon', () => {
    const { container } = render(
      <Button variant="secondary" icon={Flame}>
        Go
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Go' }).className).toBe('btn btn-secondary');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an anchor when href is given — hash navigation stays real', () => {
    render(<Button href="#/subject/gh-200/learn">Open</Button>);
    const link = screen.getByRole('link', { name: 'Open' });
    expect(link.getAttribute('href')).toBe('#/subject/gh-200/learn');
    expect(link.className).toBe('btn btn-primary');
  });

  it('fires onClick when enabled and stays silent when disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(
      <Button onClick={onClick} disabled>
        Act
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Act' }));
    expect(onClick).not.toHaveBeenCalled();

    rerender(<Button onClick={onClick}>Act</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Act' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the ghost variant and defaults type to button', () => {
    render(<Button variant="ghost">Quiet</Button>);
    const button = screen.getByRole('button', { name: 'Quiet' });
    expect(button.className).toBe('btn btn-ghost');
    expect(button.getAttribute('type')).toBe('button');
  });

  it('renders a submit button when asked', () => {
    render(<Button type="submit">Send</Button>);
    expect(screen.getByRole('button', { name: 'Send' }).getAttribute('type')).toBe('submit');
  });

  it('anchor buttons still fire their onClick handlers', () => {
    const onClick = vi.fn();
    render(
      <Button href="#/subject/gh-200/learn" onClick={onClick}>
        Open
      </Button>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Open' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Pill', () => {
  it('carries its tone class and optional icon', () => {
    const { container } = render(
      <Pill tone="success" icon={Flame}>
        Streak 3
      </Pill>,
    );
    const pill = screen.getByText('Streak 3');
    expect(pill.className).toBe('pill pill-success');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('defaults to the neutral tone', () => {
    render(<Pill>Plain</Pill>);
    expect(screen.getByText('Plain').className).toBe('pill pill-neutral');
  });

  it('carries the accent, warn, and danger tone classes', () => {
    const { rerender } = render(<Pill tone="accent">A</Pill>);
    expect(screen.getByText('A').className).toBe('pill pill-accent');
    rerender(<Pill tone="warn">W</Pill>);
    expect(screen.getByText('W').className).toBe('pill pill-warn');
    rerender(<Pill tone="danger">D</Pill>);
    expect(screen.getByText('D').className).toBe('pill pill-danger');
  });
});

describe('ProgressBar', () => {
  it('exposes progressbar semantics with a rounded percentage', () => {
    render(<ProgressBar value={0.456} label="GitHub Basics progress" />);
    const bar = screen.getByRole('progressbar', { name: 'GitHub Basics progress' });
    expect(bar.getAttribute('aria-valuenow')).toBe('46');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('clamps out-of-range values', () => {
    const { rerender } = render(<ProgressBar value={1.7} label="Labs" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    rerender(<ProgressBar value={-0.5} label="Labs" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('fills to the exact boundaries at 0 and 1', () => {
    const { container, rerender } = render(<ProgressBar value={0} label="Start" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
    expect((container.querySelector('.progress-fill') as HTMLElement).style.width).toBe('0%');
    rerender(<ProgressBar value={1} label="Done" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    expect((container.querySelector('.progress-fill') as HTMLElement).style.width).toBe('100%');
  });
});

describe('Callout', () => {
  it('renders as a note with the default Tip label and inline markup', () => {
    render(<Callout text="Use `git switch` to move." />);
    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByText('Tip')).toBeInTheDocument();
    expect(screen.getByText('git switch').tagName).toBe('CODE');
  });

  it('accepts a custom label', () => {
    render(<Callout text="Watch out." label="Warning" />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('resolves docId links in the tip body through the ambient context', () => {
    render(
      <DocResolverProvider
        resolveDoc={(docId) =>
          docId === 'doc-a' ? { title: 'Docs', url: 'https://example.com/d' } : undefined
        }
      >
        <Callout text="See [the docs](doc-a) and [the ghost](no-such-doc)." />
      </DocResolverProvider>,
    );
    const link = screen.getByRole('link', { name: 'the docs' });
    expect(link.getAttribute('href')).toBe('https://example.com/d');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(screen.queryByRole('link', { name: 'the ghost' })).toBeNull();
  });
});

describe('DataTable', () => {
  const HEADERS = ['Engine', 'File layout', 'Table layout'];

  it('renders caption, column headers, and row headers', () => {
    render(
      <DataTable
        caption="Warehouse comparison"
        headers={HEADERS}
        rows={[
          ['Delta', 'Parquet', 'Hive metastore'],
          ['Iceberg', 'Parquet + metadata', 'Catalog'],
        ]}
      />,
    );
    expect(screen.getByText('Warehouse comparison', { selector: 'caption' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Engine' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Delta' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Hive metastore' })).toBeInTheDocument();
  });

  it('runs cells through the inline tokenizer', () => {
    render(<DataTable headers={['Tool', 'Note']} rows={[['gh', 'run `gh pr`']]} />);
    expect(screen.getByText('gh pr').tagName).toBe('CODE');
  });

  it('normalizes ragged rows — short pads, long truncates, nothing crashes', () => {
    render(
      <DataTable
        headers={HEADERS}
        rows={[
          ['Short row'],
          ['Long', 'a', 'b', 'c', 'd'],
        ]}
      />,
    );
    const rows = screen.getAllByRole('row').map((row) => row as HTMLTableRowElement);
    expect(rows).toHaveLength(3); // header + 2 body rows
    rows.slice(1).forEach((row) => {
      expect(row.cells).toHaveLength(HEADERS.length);
    });
    expect(screen.getByRole('cell', { name: 'b' })).toBeInTheDocument();
    expect(screen.queryByText('c')).toBeNull();
    expect(screen.queryByText('d')).toBeNull();
  });

  it('renders a header-only table for an empty rows array', () => {
    const { container } = render(<DataTable headers={HEADERS} rows={[]} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getAllByRole('row')).toHaveLength(1); // just the header row
    expect(container.querySelectorAll('tbody tr')).toHaveLength(0);
  });

  it('renders single-column tables as row headers with no data cells', () => {
    render(<DataTable headers={['Step']} rows={[['Prepare'], ['Ship']]} />);
    expect(
      screen.getAllByRole('rowheader').map((header) => header.textContent),
    ).toEqual(['Prepare', 'Ship']);
    expect(screen.queryAllByRole('cell')).toHaveLength(0);
  });

  it('omits the caption when none is given', () => {
    const { container } = render(<DataTable headers={['A']} rows={[['a1']]} />);
    expect(container.querySelector('caption')).toBeNull();
  });
});

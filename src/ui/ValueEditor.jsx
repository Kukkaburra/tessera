import { useMemo, useState } from 'react';
import { isAlias } from '../model/dtcg.js';
import { toCssColor, toHex6, fromHex6, isColorObject } from '../model/color.js';

export const isColor = (t) => t?.$type === 'color';

// Inline editor for a token's $value: color picker for colors, comma list for
// fontFamily arrays, text otherwise — plus a 🔗 search-select to point the token
// at another token of the SAME $type (sets it to an alias {path}).
export default function ValueEditor({ token, onChange, targets = [], selfPath }) {
  const value = token.$value;
  const alias = isAlias(value);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const candidates = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return targets
      .filter((t) => t.type === token.$type && t.path !== selfPath)
      .filter((t) => !ql || t.path.toLowerCase().includes(ql))
      .slice(0, 60);
  }, [targets, token.$type, selfPath, q]);

  const hasPicker = targets.some((t) => t.type === token.$type);

  const editor =
    isColor(token) && !alias ? (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={toHex6(value)}
          onChange={(e) => onChange(fromHex6(e.target.value, value))}
          className="h-7 w-9 cursor-pointer rounded border border-white/15 bg-transparent p-0"
        />
        {isColorObject(value) ? (
          <span className="w-28 truncate font-mono text-[11px] text-white/60" title={toCssColor(value)}>
            {toCssColor(value)}
          </span>
        ) : (
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-28 rounded border border-white/15 bg-black/30 px-2 py-1 font-mono text-xs"
          />
        )}
      </div>
    ) : (
      <input
        type="text"
        value={Array.isArray(value) ? value.join(', ') : String(value)}
        onChange={(e) =>
          onChange(Array.isArray(value) ? e.target.value.split(',').map((s) => s.trim()) : e.target.value)
        }
        className="w-full max-w-[16rem] rounded border border-white/15 bg-black/30 px-2 py-1 font-mono text-xs"
      />
    );

  return (
    <div className="relative flex items-center gap-1.5">
      {editor}
      {hasPicker && (
        <button
          onClick={() => setOpen((o) => !o)}
          title={`Reference a ${token.$type} token`}
          className={`shrink-0 rounded px-1 text-xs ${open ? 'bg-indigo-500/30 text-white' : 'text-white/35 hover:bg-white/10 hover:text-white'}`}
        >
          🔗
        </button>
      )}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-md border border-white/15 bg-[#0b1020] shadow-xl">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Find a ${token.$type} token…`}
              className="w-full rounded-t-md border-b border-white/10 bg-black/40 px-2 py-1.5 text-xs outline-none"
            />
            <div className="max-h-60 overflow-auto py-1">
              {candidates.map((c) => {
                const sw = toCssColor(c.resolved);
                return (
                  <button
                    key={c.path}
                    onClick={() => {
                      onChange(`{${c.path}}`);
                      setOpen(false);
                      setQ('');
                    }}
                    className="flex w-full items-center gap-2 px-2 py-1 text-left text-xs hover:bg-white/5"
                  >
                    {sw && <span className="h-4 w-4 shrink-0 rounded border border-white/20" style={{ background: sw }} />}
                    <span className="truncate font-mono text-white/80">{c.path}</span>
                    <span className="ml-auto shrink-0 truncate font-mono text-[10px] text-white/35">
                      {sw || (c.resolved != null ? String(c.resolved) : '')}
                    </span>
                  </button>
                );
              })}
              {!candidates.length && (
                <div className="px-2 py-2 text-[11px] text-white/30">No {token.$type} tokens found.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

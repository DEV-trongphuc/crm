import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

const TAG_COLORS = [
  '#64748b', '#475569', '#334155', '#6366f1'
];

const getTagColor = (tag: string): string => {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) % TAG_COLORS.length;
  return TAG_COLORS[h];
};

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  readOnly?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags, onChange, maxTags = 10, placeholder = 'Thêm tag...', readOnly = false
}) => {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (val: string) => {
    const t = val.trim().toLowerCase().replace(/\s+/g, '-');
    if (!t || tags.includes(t) || tags.length >= maxTags) return;
    onChange([...tags, t]);
    setInput('');
  };

  const removeTag = (tag: string) => {
    if (readOnly) return;
    onChange(tags.filter(t => t !== tag));
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div
      onClick={() => !readOnly && inputRef.current?.focus()}
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center',
        padding: '0.375rem 0.625rem', minHeight: 38,
        background: readOnly ? 'transparent' : 'var(--color-bg)',
        border: readOnly ? 'none' : `1px solid ${focused ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)', cursor: readOnly ? 'default' : 'text',
        boxShadow: focused && !readOnly ? '0 0 0 3px var(--color-primary-light)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {tags.map(tag => {
        const color = getTagColor(tag);
        return (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
            background: `${color}18`, color, border: `1px solid ${color}33`,
            fontSize: '0.75rem', fontWeight: 700, lineHeight: 1.5,
          }}>
            {tag}
            {!readOnly && (
              <button
                onClick={e => { e.stopPropagation(); removeTag(tag); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: 0, display: 'flex', lineHeight: 1 }}
              >
                <X size={10} />
              </button>
            )}
          </span>
        );
      })}
      {!readOnly && tags.length < maxTags && (
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (input.trim()) addTag(input); }}
          placeholder={tags.length === 0 ? placeholder : ''}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: '0.8125rem', color: 'var(--color-text)',
            width: input ? `${Math.max(80, input.length * 9)}px` : '80px',
            minWidth: 60, padding: '2px 0',
          }}
        />
      )}
      {!readOnly && (
        <button
          onClick={() => addTag(input)}
          style={{ display: 'none' }}
          aria-label="Add tag"
        />
      )}
    </div>
  );
};

// Read-only display only
export const TagDisplay: React.FC<{ tags: string[]; max?: number }> = ({ tags, max = 3 }) => {
  const visible = tags.slice(0, max);
  const more = tags.length - max;
  return (
    <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.25rem', alignItems: 'center' }}>
      {visible.map(tag => {
        const color = getTagColor(tag);
        return (
          <span key={tag} style={{
            padding: '1px 7px', borderRadius: 'var(--radius-full)',
            background: `${color}18`, color, border: `1px solid ${color}33`,
            fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            {tag}
          </span>
        );
      })}
      {more > 0 && (
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>+{more}</span>
      )}
    </div>
  );
};

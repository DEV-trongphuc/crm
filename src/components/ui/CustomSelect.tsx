import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import styles from './CustomSelect.module.css';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Chọn...', 
  label,
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const filtered = searchable ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase())) : options;

  return (
    <div className={styles.wrapper} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div 
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? styles.selectedValue : styles.placeholder}>
          {selectedOption ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {selectedOption.icon && <span style={{ display: 'flex' }}>{selectedOption.icon}</span>}
              {selectedOption.label}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown size={16} className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={styles.dropdown}
          >
            {searchable && (
              <div className={styles.searchBox}>
                <Search size={14} className={styles.searchIcon} />
                <input 
                  type="text" 
                  autoFocus 
                  placeholder="Tìm kiếm..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  onClick={e => e.stopPropagation()}
                  className={styles.searchInput}
                />
              </div>
            )}
            <div className={styles.optionsList}>
              {filtered.length > 0 ? filtered.map((option) => (
                <div 
                  key={option.value}
                  className={`${styles.option} ${value === option.value ? styles.optionSelected : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    {option.icon && <span style={{ display: 'flex' }}>{option.icon}</span>}
                    {option.label}
                  </span>
                  {value === option.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />}
                </div>
              )) : (
                <div className={styles.noResult}>Không tìm thấy</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


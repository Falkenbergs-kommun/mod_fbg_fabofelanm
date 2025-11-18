import React, { useState, useRef, useEffect } from 'react';

export default function Combobox({ label, options, value, onChange, placeholder, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="uk-inline uk-width-1-1">
      {label && (
        <label className="uk-form-label">
          {label}
        </label>
      )}
      <div className="uk-inline uk-width-1-1">
        <input
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="uk-input"
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="uk-position-center-right uk-margin-small-right uk-text-muted"
          style={{background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer'}}
        >
          ▼
        </button>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="uk-card uk-card-default uk-position-absolute uk-width-1-1 uk-margin-small-top" style={{zIndex: 1000, maxHeight: '15rem', overflowY: 'auto'}}>
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`uk-padding-small ${
                option.value === value ? 'uk-background-primary uk-light' : 'uk-background-default'
              }`}
              style={{cursor: 'pointer'}}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.classList.add('uk-background-muted');
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) {
                  e.currentTarget.classList.remove('uk-background-muted');
                }
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && searchTerm && (
        <div className="uk-card uk-card-default uk-card-body uk-position-absolute uk-width-1-1 uk-margin-small-top uk-text-small uk-text-muted" style={{zIndex: 1000}}>
          Inga träffar
        </div>
      )}
    </div>
  );
}

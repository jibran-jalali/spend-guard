"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * A premium, visual replacement for standard <select> elements.
 * Supports searching, grid layouts, and custom icons/logos.
 */
export function VisualPicker({
  label,
  value,
  options,
  onChange,
  renderIcon,
  placeholder = "Select an item",
  searchPlaceholder = "Search...",
  allowCustom = false,
  customLabel = "Custom",
  onCustomClick,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  const safeOptions = useMemo(() => Array.isArray(options) ? options : [], [options]);

  const selectedOption = useMemo(
    () => safeOptions.find((opt) => opt.id === value),
    [safeOptions, value]
  );

  const filteredOptions = useMemo(() => {
    return safeOptions.filter((opt) =>
      String(opt.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [safeOptions, search]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="sg-visual-picker" ref={containerRef}>
      {label && <span className="sg-picker-label">{label}</span>}
      
      <button
        type="button"
        className={`sg-picker-trigger ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="sg-picker-selection">
          {selectedOption ? (
            <>
              <div className="sg-picker-icon">
                {renderIcon(selectedOption)}
              </div>
              <span className="sg-picker-name">{selectedOption.name}</span>
            </>
          ) : (
            <span className="sg-picker-placeholder">{placeholder}</span>
          )}
        </div>
        <Plus size={18} className="sg-picker-plus" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sg-picker-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="sg-picker-search">
              <Search size={16} />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredOptions.length > 0) {
                      onChange(filteredOptions[0].id);
                      setIsOpen(false);
                    }
                  }
                }}
                placeholder={searchPlaceholder}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="sg-picker-options">
              {allowCustom && search && !filteredOptions.some(o => o.name.toLowerCase() === search.toLowerCase()) && (
                <button
                  type="button"
                  className="sg-picker-option is-custom"
                  onClick={() => {
                    onCustomClick && onCustomClick(search);
                    setIsOpen(false);
                  }}
                >
                  <div className="sg-picker-icon is-new">
                    <Plus size={18} />
                  </div>
                  <span>Use "{search}"</span>
                </button>
              )}

              <div className="sg-picker-grid">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`sg-picker-option ${option.id === value ? "is-selected" : ""}`}
                      onClick={() => {
                        onChange(option.id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="sg-picker-icon">
                        {renderIcon(option)}
                      </div>
                      <span className="sg-picker-option-name">{option.name}</span>
                      {option.id === value && <Check size={14} className="sg-picker-check" />}
                    </button>
                  ))
                ) : (
                  <div className="sg-picker-empty">No matches found</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

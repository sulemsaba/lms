import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { useSidebarItems } from "@/hooks/useSidebarItems";
import { useAuthStore } from "@/stores/authStore";
import styles from "./CommandPalette.module.css";

interface Command {
  id: string;
  label: string;
  icon: string;
  category: string;
  action: () => void;
  shortcut?: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { allItems } = useSidebarItems();
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build command list
  const commands: Command[] = [
    // Navigation commands
    ...allItems.map(item => ({
      id: `nav-${item.path}`,
      label: `Go to ${item.label}`,
      icon: item.icon,
      category: "Navigation",
      action: () => {
        navigate(item.path);
        onClose();
      },
      keywords: [item.label, item.path.replace('/', '')]
    })),
    
    // Quick actions
    {
      id: 'new-note',
      label: 'Create new note',
      icon: 'edit_note',
      category: 'Quick Actions',
      action: () => {
        navigate('/notes/new');
        onClose();
      },
      shortcut: '⌘N',
      keywords: ['note', 'create', 'write']
    },
    {
      id: 'start-focus',
      label: 'Start focus session',
      icon: 'timer',
      category: 'Quick Actions',
      action: () => {
        navigate('/focus-mode');
        onClose();
      },
      shortcut: '⌘F',
      keywords: ['focus', 'pomodoro', 'study']
    },
    {
      id: 'scan-qr',
      label: 'Scan QR code',
      icon: 'qr_code_scanner',
      category: 'Quick Actions',
      action: () => {
        navigate('/qr-scanner');
        onClose();
      },
      shortcut: '⌘Q',
      keywords: ['scan', 'qr', 'attendance']
    },
    {
      id: 'search-campus',
      label: 'Search campus',
      icon: 'map',
      category: 'Quick Actions',
      action: () => {
        navigate('/map?search=true');
        onClose();
      },
      keywords: ['map', 'campus', 'location']
    },
    
    // Profile actions
    {
      id: 'view-profile',
      label: 'View profile',
      icon: 'person',
      category: 'Profile',
      action: () => {
        navigate('/profile');
        onClose();
      },
      keywords: ['profile', 'account', 'me']
    },
    {
      id: 'settings',
      label: 'Open settings',
      icon: 'settings',
      category: 'Profile',
      action: () => {
        navigate('/profile?tab=settings');
        onClose();
      },
      keywords: ['settings', 'preferences']
    },
    
    // System actions
    {
      id: 'toggle-theme',
      label: 'Toggle theme',
      icon: 'dark_mode',
      category: 'System',
      action: () => {
        // Toggle theme logic here
        onClose();
      },
      shortcut: '⌘T',
      keywords: ['theme', 'dark', 'light', 'mode']
    },
    {
      id: 'logout',
      label: 'Log out',
      icon: 'logout',
      category: 'System',
      action: () => {
        useAuthStore.getState().clearAuth();
        navigate('/login');
        onClose();
      },
      keywords: ['logout', 'signout', 'exit']
    }
  ];

  // Filter commands based on query
  const filteredCommands = query
    ? commands.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords?.some(keyword => 
          keyword.toLowerCase().includes(query.toLowerCase())
        )
      )
    : commands;

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, cmd) => {
    if (!groups[cmd.category]) {
      groups[cmd.category] = [];
    }
    groups[cmd.category].push(cmd);
    return groups;
  }, {} as Record<string, Command[]>);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setSelectedIndex(0);
      }, 100);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div 
        className={styles.container}
        ref={containerRef}
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.searchContainer}>
            <Icon name="search" size={20} className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search commands, navigate, or jump to..."
              className={styles.searchInput}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {query && (
              <button
                className={styles.clearButton}
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close command palette"
          >
            <span className={styles.closeText}>ESC</span>
          </button>
        </div>

        {/* Results */}
        <div className={styles.results}>
          {filteredCommands.length === 0 ? (
            <div className={styles.emptyState}>
              <Icon name="search_off" size={48} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No results found</p>
              <p className={styles.emptyDescription}>
                Try searching for navigation, actions, or settings
              </p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category} className={styles.categoryGroup}>
                <div className={styles.categoryHeader}>
                  <span className={styles.categoryName}>{category}</span>
                  <span className={styles.categoryCount}>
                    {categoryCommands.length}
                  </span>
                </div>
                <div className={styles.commandsList}>
                  {categoryCommands.map((cmd, index) => {
                    const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <button
                        key={cmd.id}
                        className={`${styles.commandItem} ${isSelected ? styles.selected : ''}`}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className={styles.commandIcon}>
                          <Icon name={cmd.icon} size={20} />
                        </div>
                        <div className={styles.commandContent}>
                          <span className={styles.commandLabel}>{cmd.label}</span>
                          {cmd.shortcut && (
                            <kbd className={styles.commandShortcut}>
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </div>
                        {isSelected && (
                          <div className={styles.selectionIndicator}>
                            <Icon name="arrow_right" size={16} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with shortcuts */}
        <div className={styles.footer}>
          <div className={styles.shortcutGroup}>
            <div className={styles.shortcutItem}>
              <kbd className={styles.shortcutKey}>↑↓</kbd>
              <span className={styles.shortcutLabel}>Navigate</span>
            </div>
            <div className={styles.shortcutItem}>
              <kbd className={styles.shortcutKey}>↵</kbd>
              <span className={styles.shortcutLabel}>Select</span>
            </div>
            <div className={styles.shortcutItem}>
              <kbd className={styles.shortcutKey}>ESC</kbd>
              <span className={styles.shortcutLabel}>Close</span>
            </div>
          </div>
          <div className={styles.stats}>
            <span className={styles.statsText}>
              {filteredCommands.length} of {commands.length} commands
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
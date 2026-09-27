import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Always default to light mode on first load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="glass-button px-4 py-2 rounded-lg inline-flex items-center gap-2 dark:bg-gray-800/60 dark:border-gray-700 dark:text-gray-100"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <>
          <Moon className="h-5 w-5" />
          <span className="text-sm">Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-5 w-5" />
          <span className="text-sm">Light</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;

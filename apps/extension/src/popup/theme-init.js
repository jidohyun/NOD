// Theme initialization to prevent flash of wrong theme
try {
  const saved = localStorage.getItem('nod_ext_theme');
  const theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(theme);
} catch (e) {
  document.documentElement.classList.add('dark');
}

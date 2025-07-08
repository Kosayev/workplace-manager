/**
 * Icon Component System
 * Provides a unified interface for Lucide icons with consistent styling
 */

// Import icons from node_modules
const iconSvgs = {
  trash2: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,6 5,6 21,6"></polyline><path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11,4H4a2,2 0 0,0-2,2v14a2,2 0 0,0,2,2h14a2,2 0 0,0,2-2v-7"></path><path d="M18.5,2.5a2.121,2.121 0 0,1,3,3L12,15l-4,1 1-4 9.5-9.5z"></path></svg>`,
  messageSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21,15a2,2 0 0,1-2,2H7l-4,4V5a2,2 0 0,1,2-2h14a2,2 0 0,1,2,2z"></path></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12,6 12,12 16,14"></polyline></svg>`,
  pin: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12,17l5-5a8,8 0 1,0-11.31,0z"></path><circle cx="12" cy="7" r="3"></circle></svg>`,
  barChart2: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  notebookPen: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"></path><path d="M2 6h4"></path><path d="M2 10h4"></path><path d="M2 14h4"></path><path d="M2 18h4"></path><path d="M18.4 2.6a2.17 2.17 0 0 1 3 3L16 11l-4 1 1-4Z"></path></svg>`,
  checkSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,11 12,14 22,4"></polyline><path d="M21,12v7a2,2 0 0,1-2,2H5a2,2 0 0,1-2-2V5a2,2 0 0,1,2-2h11"></path></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`
};

/**
 * Icon component for rendering Lucide icons with consistent styling
 * @param {string} name - Icon name (trash2, edit, messageSquare, clock, pin)
 * @param {string} size - Icon size (xs, sm, md) - uses CSS variables
 * @param {string} color - Icon color (base, primary) - uses CSS variables
 * @param {string} className - Additional CSS classes
 * @returns {string} SVG string with proper styling
 */
function Icon(name, size = 'sm', color = 'base', className = '') {
  const iconSvg = iconSvgs[name];
  if (!iconSvg) {
    console.warn(`Icon "${name}" not found`);
    return '';
  }

  // Create a temporary div to parse the SVG
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = iconSvg;
  const svg = tempDiv.querySelector('svg');
  
  if (!svg) {
    console.warn(`Invalid SVG for icon "${name}"`);
    return '';
  }

  // Apply consistent styling
  svg.style.width = `var(--icon-size-${size})`;
  svg.style.height = `var(--icon-size-${size})`;
  svg.style.color = `var(--icon-color-${color})`;
  svg.style.flexShrink = '0';
  
  // Add additional classes
  if (className) {
    svg.classList.add(...className.split(' '));
  }

  return svg.outerHTML;
}

/**
 * Helper function to create icon button HTML
 * @param {string} iconName - Icon name
 * @param {string} buttonText - Button text (for accessibility)
 * @param {string} buttonClass - CSS class for the button
 * @param {string} iconSize - Icon size
 * @param {string} iconColor - Icon color
 * @returns {string} Complete button HTML with icon
 */
function IconButton(iconName, buttonText, buttonClass = 'btn btn--sm btn--outline', iconSize = 'sm', iconColor = 'base') {
  return `
    <button class="${buttonClass}" aria-label="${buttonText}">
      ${Icon(iconName, iconSize, iconColor)}
      <span class="sr-only">${buttonText}</span>
    </button>
  `;
}

// Make functions available globally
window.iconSystem = {
  Icon,
  IconButton
};
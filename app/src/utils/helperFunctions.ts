export function closeMenu(menuId: string) {
  const menu = document.getElementById(menuId);
  if (!menu) {
    console.warn(`Menu with ID "${menuId}" not found`);
    return;
  }

  const items = menu.shadowRoot?.querySelector("details");
  if (items) items.open = false;
  else console.warn(`Details element not found in menu "${menuId}"`);
}

import { PerspectiveProxy } from '@coasys/ad4m';

export function closeMenu(menuId: string) {
  const menu = document.getElementById(menuId);
  if (!menu) {
    console.warn(`Menu with ID "${menuId}" not found`);
    return;
  }

  const items = menu.shadowRoot?.querySelector('details');
  if (items) items.open = false;
  else console.warn(`Details element not found in menu "${menuId}"`);
}

export async function fetchImageData(perspective: PerspectiveProxy, imageURI: string | undefined): Promise<string> {
  if (!imageURI) return '';
  try {
    const expression = await perspective.getExpression(imageURI);
    const { data } = expression;
    const { data_base64 } = JSON.parse(data);
    return `data:image/png;base64,${data_base64}`;
  } catch (e) {
    console.warn('Failed to fetch image data for', imageURI, e);
    return '';
  }
}

const EGYPT_ASSET_ROOT = `${import.meta.env.BASE_URL}egypt-assets/`;

export function egyptAssetUrl(path: string): string {
  return `${EGYPT_ASSET_ROOT}${path}`;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALLOWED_ORIGINS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

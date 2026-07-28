// Ambient global declaration for Deno namespace to satisfy VS Code / TypeScript IDE language server
declare namespace Deno {
  export const args: string[];
  export function exit(code?: number): never;
  export function mkdir(path: string | URL, options?: { recursive?: boolean }): Promise<void>;
  export function writeTextFile(path: string | URL, data: string): Promise<void>;
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
}

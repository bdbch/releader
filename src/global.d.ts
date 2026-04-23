export {};

declare global {
  interface Window {
    resetReleaderData: () => Promise<{ foldersCount: number; feedsCount: number }>;
  }
}

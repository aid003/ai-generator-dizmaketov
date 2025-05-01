export interface ExtractOptions {
  url: string;
  depth: number;
  idleTime: number;
  checkInterval: number;
  maxTimeout: number;
  allowanceInterval: number;
  hardTimeout: number;
}

export interface ScraperServerToClientEvents {
  log: (msg: string) => void;
  done: (hostFolder: string) => void;
  error: (msg: string) => void;
  extractStarted: (payload: { url: string }) => void;
  availableSites: (sites: string[]) => void;
}

export interface ScraperClientToServerEvents {
  startExtract: (payload: ExtractOptions) => void;
  availableSites: () => void;
  reloadServer: (ack: (response: { success: boolean }) => void) => void;
}

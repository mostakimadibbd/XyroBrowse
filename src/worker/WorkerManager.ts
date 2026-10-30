type TaskHandler = (payload: any) => Promise<any>;

interface PendingTask {
  resolve: (value: any) => void;
  reject: (reason: Error) => void;
}

export class WorkerManager {
  private worker: Worker | null = null;
  private pendingTasks = new Map<number, PendingTask>();
  private taskId = 0;
  private ready = false;
  private initPromise: Promise<void> | null = null;
  
  constructor(private workerUrl: string = '/worker.js') {}
  
  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(this.workerUrl, { type: 'module' });
        
        this.worker.onmessage = (event) => {
          const { id, result, error, type } = event.data;
          
          if (type === 'ready') {
            this.ready = true;
            resolve();
            return;
          }
          
          const pending = this.pendingTasks.get(id);
          if (pending) {
            this.pendingTasks.delete(id);
            if (error) {
              pending.reject(new Error(error));
            } else {
              pending.resolve(result);
            }
          }
        };
        
        this.worker.onerror = (error) => {
          console.error('[WorkerManager] Worker error:', error);
          reject(error);
        };
        
        setTimeout(() => {
          if (!this.ready) {
            reject(new Error('Worker initialization timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
    
    return this.initPromise;
  }
  
  private async ensureReady(): Promise<void> {
    if (!this.ready) {
      await this.initialize();
    }
  }
  
  async execute<T>(type: string, payload: any): Promise<T> {
    await this.ensureReady();
    
    const id = ++this.taskId;
    
    return new Promise((resolve, reject) => {
      this.pendingTasks.set(id, { resolve, reject });
      
      this.worker!.postMessage({ id, type, payload });
      
      setTimeout(() => {
        if (this.pendingTasks.has(id)) {
          this.pendingTasks.delete(id);
          reject(new Error(`Task ${type} timed out`));
        }
      }, 30000);
    });
  }
  
  async parseHtml(html: string, baseUrl: string) {
    return this.execute('parse-html', { html, baseUrl });
  }
  
  async checkAdblock(url: string) {
    return this.execute('check-adblock', { url });
  }
  
  async loadAdblockRules(url: string) {
    return this.execute('load-adblock-rules', { url });
  }
  
  async processSearch(results: any[], query: string) {
    return this.execute('process-search', { results, query });
  }
  
  async extractReader(html: string, url: string) {
    return this.execute('extract-reader', { html, url });
  }
  
  async encrypt(payload: any, password: string, salt: string) {
    return this.execute('encrypt', { payload, password, salt });
  }
  
  async decrypt(payload: any, password: string, salt: string) {
    return this.execute('decrypt', { payload, password, salt });
  }
  
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.ready = false;
      this.initPromise = null;
      this.pendingTasks.clear();
    }
  }
}

export const workerManager = new WorkerManager();

export async function initWorker() {
  await workerManager.initialize();
}
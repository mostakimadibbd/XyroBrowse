import { DownloadItem as ElectronDownloadItem, WebContents, dialog, shell } from 'electron';

export interface ActiveDownload {
  id: string;
  item: ElectronDownloadItem;
  url: string;
  fileName: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'in_progress' | 'complete' | 'interrupted' | 'cancelled';
  savePath: string;
}

export class DesktopDownloadManager {
  private downloads = new Map<string, ActiveDownload>();

  public handleWillDownload(
    item: ElectronDownloadItem,
    webContents: WebContents,
    sendToUI: (event: string, payload: any) => void
  ): void {
    const id = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fileName = item.getFilename();
    const url = item.getURL();
    const totalBytes = item.getTotalBytes();

    const active: ActiveDownload = {
      id,
      item,
      url,
      fileName,
      totalBytes,
      receivedBytes: 0,
      state: 'in_progress',
      savePath: item.getSavePath(),
    };

    this.downloads.set(id, active);

    sendToUI('download-started', {
      id,
      url,
      fileName,
      totalBytes,
      receivedBytes: 0,
      state: 'in_progress',
    });

    item.on('updated', (_evt, state) => {
      active.receivedBytes = item.getReceivedBytes();
      active.savePath = item.getSavePath();
      active.state = state === 'progressing' ? 'in_progress' : 'interrupted';

      sendToUI('download-progress', {
        id,
        receivedBytes: active.receivedBytes,
        totalBytes: active.totalBytes,
        state: active.state,
      });
    });

    item.once('done', (_evt, state) => {
      active.receivedBytes = item.getReceivedBytes();
      active.savePath = item.getSavePath();
      active.state = state === 'completed' ? 'complete' : state === 'cancelled' ? 'cancelled' : 'interrupted';

      sendToUI('download-completed', {
        id,
        receivedBytes: active.receivedBytes,
        totalBytes: active.totalBytes,
        state: active.state,
        path: active.savePath,
      });
    });
  }

  public pause(id: string): void {
    const dl = this.downloads.get(id);
    if (dl && dl.item.getState() === 'progressing') {
      dl.item.pause();
    }
  }

  public resume(id: string): void {
    const dl = this.downloads.get(id);
    if (dl && dl.item.canResume()) {
      dl.item.resume();
    }
  }

  public cancel(id: string): void {
    const dl = this.downloads.get(id);
    if (dl) {
      dl.item.cancel();
      this.downloads.delete(id);
    }
  }

  public openFile(id: string): void {
    const dl = this.downloads.get(id);
    if (dl && dl.savePath) {
      shell.openPath(dl.savePath);
    }
  }

  public showInFolder(id: string): void {
    const dl = this.downloads.get(id);
    if (dl && dl.savePath) {
      shell.showItemInFolder(dl.savePath);
    }
  }
}

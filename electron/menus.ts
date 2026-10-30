import { Menu, MenuItem, BrowserWindow, WebContents, clipboard } from 'electron';

export function setupAppMenu(mainWindow: BrowserWindow): void {
  const isMac = process.platform === 'darwin';

  const template: any[] = [
    ...(isMac
      ? [
          {
            label: 'XyroBrowse',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => mainWindow.webContents.send('engine-event', 'newTab', {}),
        },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('engine-event', 'newWindow', {}),
        },
        {
          label: 'New Incognito Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => mainWindow.webContents.send('engine-event', 'newIncognito', {}),
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => mainWindow.webContents.send('engine-event', 'shortcut', { key: 'w', ctrlKey: true }),
        },
        { role: isMac ? 'close' : 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.webContents.send('engine-event', 'shortcut', { key: 'r', ctrlKey: true }),
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow.webContents.send('engine-event', 'reloadHard', {}),
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow.webContents.send('engine-event', 'shortcut', { key: '+', ctrlKey: true }),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow.webContents.send('engine-event', 'shortcut', { key: '-', ctrlKey: true }),
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow.webContents.send('engine-event', 'shortcut', { key: '0', ctrlKey: true }),
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'History',
      submenu: [
        {
          label: 'Show Full History',
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow.webContents.send('engine-event', 'shortcut', { key: 'h', ctrlKey: true }),
        },
      ],
    },
    {
      label: 'Bookmarks',
      submenu: [
        {
          label: 'Bookmark This Tab',
          accelerator: 'CmdOrCtrl+D',
          click: () => mainWindow.webContents.send('engine-event', 'shortcut', { key: 'd', ctrlKey: true }),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About XyroBrowse',
          click: () => mainWindow.webContents.send('engine-event', 'openAbout', {}),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

export function showContextMenu(
  guestContents: WebContents,
  params: any,
  onNewTab: (url: string) => void
): void {
  const menu = new Menu();

  if (params.linkURL) {
    menu.append(
      new MenuItem({
        label: 'Open link in new tab',
        click: () => onNewTab(params.linkURL),
      })
    );
    menu.append(
      new MenuItem({
        label: 'Copy link address',
        click: () => clipboard.writeText(params.linkURL),
      })
    );
    menu.append(new MenuItem({ type: 'separator' }));
  }

  if (params.srcURL && params.mediaType === 'image') {
    menu.append(
      new MenuItem({
        label: 'Open image in new tab',
        click: () => onNewTab(params.srcURL),
      })
    );
    menu.append(
      new MenuItem({
        label: 'Copy image address',
        click: () => clipboard.writeText(params.srcURL),
      })
    );
    menu.append(new MenuItem({ type: 'separator' }));
  }

  if (params.selectionText) {
    menu.append(new MenuItem({ role: 'copy' }));
    menu.append(
      new MenuItem({
        label: `Search with Google for "${params.selectionText.slice(0, 20)}..."`,
        click: () => onNewTab(`https://www.google.com/search?q=${encodeURIComponent(params.selectionText)}`),
      })
    );
    menu.append(new MenuItem({ type: 'separator' }));
  }

  if (params.isEditable) {
    menu.append(new MenuItem({ role: 'undo' }));
    menu.append(new MenuItem({ role: 'redo' }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ role: 'cut' }));
    menu.append(new MenuItem({ role: 'copy' }));
    menu.append(new MenuItem({ role: 'paste' }));
    menu.append(new MenuItem({ role: 'selectAll' }));
    menu.append(new MenuItem({ type: 'separator' }));
  }

  menu.append(
    new MenuItem({
      label: 'Back',
      enabled: guestContents.navigationHistory?.canGoBack() ?? guestContents.canGoBack(),
      click: () => guestContents.navigationHistory?.goBack() ?? guestContents.goBack(),
    })
  );
  menu.append(
    new MenuItem({
      label: 'Forward',
      enabled: guestContents.navigationHistory?.canGoForward() ?? guestContents.canGoForward(),
      click: () => guestContents.navigationHistory?.goForward() ?? guestContents.goForward(),
    })
  );
  menu.append(
    new MenuItem({
      label: 'Reload',
      click: () => guestContents.reload(),
    })
  );
  menu.append(new MenuItem({ type: 'separator' }));
  menu.append(
    new MenuItem({
      label: 'View Page Source',
      click: () => onNewTab(`view-source:${guestContents.getURL()}`),
    })
  );
  menu.append(
    new MenuItem({
      label: 'Inspect Element',
      click: () => guestContents.inspectElement(params.x, params.y),
    })
  );

  menu.popup();
}

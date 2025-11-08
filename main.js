const { app, BrowserWindow, dialog, ipcMain, shell, protocol, nativeImage, Menu } = require('electron');
app.setName("Copy Finder");
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const pLimit = require('p-limit'); // CommonJS import
const { autoUpdater } = require('electron-updater');
const { pathToFileURL } = require('url');

let mainWindow;

const scans = new Map(); // key = webContents.id

let lastScanFiles = [];
let lastDuplicates = [];

let windows = [];

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// Read settings
function getSettings() {
  try { return JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } 
  catch { return {}; }
}

// Save settings
function saveSettings(settings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

let settings = getSettings();

function registerThumProtocol() {
  protocol.handle("thum", async (request) => {
    const filePath = decodeURIComponent(request.url.slice("thum:///".length));
    try {
      const image = await nativeImage.createThumbnailFromPath(filePath, { width: 128, height: 128 });
      return new Response(image.toPNG(), { headers: { "content-type": "image/png" } });
    } 
    catch (err) {
      try {
        const icon = await app.getFileIcon(filePath, { size: "normal" });
        return new Response(icon.toPNG(), { headers: { "content-type": "image/png" } });
      } 
      catch {
        return new Response("", { status: 404 });
      }
    }
  });
}

function createMainWindow() {
  const startMaximized = settings.startMaximized === true;

  const win = new BrowserWindow({
    title: "Copy Finder",
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true
    },
  });
  win.webContents.on('will-navigate', e => e.preventDefault());

  if (startMaximized) win.maximize();

  win.loadFile('index.html');

  const menu = Menu.buildFromTemplate(createMenuTemplate(win));
  win.setMenu(menu);

  windows.push(win);

  win.on('closed', () => {
    windows = windows.filter(w => w !== win);
  });

  return win;
}

app.on('browser-window-created', (_, window) => {
  window.setIcon(path.join(__dirname, 'assets', 'search.ico'));
});

// ================== MENU TEMPLATE ==================
function createMenuTemplate(mainWindow) {
  return [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'Ctrl+N',
          click: () => {
            createMainWindow(); // open another one
          },
        },
        { type: 'separator' },
        {
          label: 'Add Folder',
          accelerator: 'Ctrl+O',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              document.getElementById("addFolderBtn")?.click();
            `);
          },
        },
        {
          label: 'Start Scan',
          accelerator: 'Ctrl+S',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              document.getElementById("scanBtn")?.click();
            `);
          },
        },
        { type: 'separator' },
        {
          label: 'Export Scanned File List...',
          accelerator: 'Ctrl+E',
          click: () => {
            // Ask renderer process to start export
            exportFileList(mainWindow);
          },
        },
        {
          label: 'Export Duplicates List...',
          accelerator: 'Ctrl+Shift+D',
          click: () => {
            exportDuplicates(mainWindow, lastDuplicates); // `lastScanDuplicates` = duplicates from last scan
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen', label: 'Toggle Fullscreen' },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CommandOrControl+=',
          click: (item, win) => {
            if (win) win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5);
          }
        },
        { role: 'zoomOut', label: 'Zoom Out' },
        { role: 'resetZoom', label: 'Reset Zoom' },
        { type: 'separator' },
        {
          label: 'Toggle DevTools',
          accelerator: 'Ctrl+Shift+I',
          click: (menuItem, browserWindow) => {
            if (!browserWindow) return;
            browserWindow.webContents.toggleDevTools();
          },
        },
        { type: 'separator' },
        {
          label: 'Open Settings',
          click: () => {
            mainWindow.webContents.send('open-settings-ui');
          },
        },
        { type: 'separator' },
        {
          label: 'Start Maximized on Launch',
          type: 'checkbox',
          checked: settings.startMaximized === true,
          click: (menuItem) => {
            settings.startMaximized = menuItem.checked;
            saveSettings(settings);
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', label: 'Minimize' },
        {
          label: 'Maximize / Restore',
          click: (menuItem, browserWindow) => {
            if (!browserWindow) return;
            if (browserWindow.isMaximized()) browserWindow.unmaximize();
            else browserWindow.maximize();
          },
        },
        { role: 'close', label: 'Close' },
      ],
    },
     {
      label: 'Help',
      submenu: [
        {
          label: 'Open Changelog',
          click: () => {

            let changelogPath;

            if (process.defaultApp || process.env.NODE_ENV === 'development') {
              // Running in dev mode
              changelogPath = path.join(__dirname, 'changelog.txt');
            } 
            else {
              // Running from packaged app (after build)
              changelogPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'changelog.txt');
            }

            if (fs.existsSync(changelogPath)) {
              shell.openPath(changelogPath);
            }
             else {
              console.error('Changelog not found at:', changelogPath);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Open DevTools (Detached)',
          click: () => mainWindow.webContents.openDevTools({ mode: 'detach' }),
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            mainWindow.webContents.send('open-about-ui');
          },
        },
      ],
    },
  ];
}

function getFocused() {
  return BrowserWindow.getFocusedWindow();
}

// --- Window Controls ---
ipcMain.on('toggle-fullscreen', () => {
  const win = getFocused();
  if (win) win.setFullScreen(!win.isFullScreen());
});

ipcMain.on('minimize', () => {
  const win = getFocused();
  if (win) win.minimize();
});

ipcMain.on('maximize', () => {
  const win = getFocused();
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});

ipcMain.on('restore', () => {
  const win = getFocused();
  if (win && win.isMaximized()) win.unmaximize();
});

// --- DevTools ---
ipcMain.on('open-devtools', () => {
  const win = getFocused();
  if (win) win.webContents.openDevTools({ mode: undefined });
});

// --- Reload ---
ipcMain.on('reload', () => {
  const win = getFocused();
  if (win) win.reload();
});

// --- Zoom Controls ---

let zoomLevel = 0;

ipcMain.on('zoom-in', () => {
  const win = getFocused();
  if (win) {
    let level = win.zoomLevel || 0; // store per-window
    level += 0.2;
    if (level > 3) level = 3; // optional max
    win.setZoomFactor(1 + level);
    win.zoomLevel = level; // save on window object
  }
});

ipcMain.on('zoom-out', () => {
  const win = getFocused();
  if (win) {
    let level = win.zoomLevel || 0;
    level -= 0.2;
    if (level < -0.9) level = -0.9;
    win.setZoomFactor(1 + level);
    win.zoomLevel = level;
  }
});

ipcMain.on('zoom-reset', () => {
  const win = getFocused();
  if (win) {
    win.zoomLevel = 0;
    win.setZoomFactor(1);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Optional: Handle directory reading
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(dirPath, file.name)
    }));
  } 
  catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});

// ---- Folder Selection ----
ipcMain.handle('select-folders', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'multiSelections']
  });
  return result.filePaths;
});

// ---- File Hash ----

function getAdaptiveHashSize(fileSize, mode = 'full') {
  const KB = 1024;
  const MB = 1024 * 1024;
  const GB = 1024 * 1024 * 1024;

  if (fileSize <= 0) return 0;

  // Different scaling modes
  const modes = {
    balanced: [
      { max: 1 * KB, hash: 1 * KB },
      { max: 10 * KB, hash: 5 * KB },
      { max: 50 * KB, hash: 20 * KB },
      { max: 500 * KB, hash: 250 * KB },
      { max: 1 * MB, hash: 500 * KB },
      { max: 5 * MB, hash: 1 * MB },
      { max: 10 * MB, hash: 500 * KB },
      { max: 30 * MB, hash: 1 * MB },
      { max: 50 * MB, hash: 2 * MB },
      { max: 70 * MB, hash: 3 * MB },
      { max: 90 * MB, hash: 4 * MB },
      { max: 200 * MB, hash: 10 * MB },
      { max: 400 * MB, hash: 15 * MB },
      { max: 600 * MB, hash: 20 * MB },
      { max: 800 * MB, hash: 25 * MB },
      { max: 1 * GB, hash: 30 * MB },
      { max: 2 * GB, hash: 60 * MB },
      { max: 5 * GB, hash: 100 * MB },
      { max: Infinity, hash: 200 * MB }
    ],
    half: [ // Reads half the file
      { max: Infinity, hash: fileSize / 2 }
    ],
    full: [ // 🐢 Whole file hashing
      { max: Infinity, hash: Infinity }
    ]
  };

  const table = modes[mode] || modes.balanced;
  for (const entry of table) {
    if (fileSize <= entry.max) return entry.hash;
  }

  return 4 * KB; // Default fallback
}

async function hashFile(filePath, fileSize, hashSetting = 'full') {
  try {
    // Pick hash size depending on setting
    let endBytes;

    switch (hashSetting) {
      case '4kb': endBytes = 4 * 1024; break;
      case '8kb': endBytes = 8 * 1024; break;
      case '16kb': endBytes = 16 * 1024; break;
      case 'full': endBytes = fileSize; break; // hash entire file
      case 'balanced':
        endBytes = getAdaptiveHashSize(fileSize, 'balanced');
        break;
      default:
        // Custom like "32kb"
        if (/^\d+kb$/i.test(hashSetting)) {
          endBytes = parseInt(hashSetting) * 1024;
        } 
        else {
          endBytes = getAdaptiveHashSize(fileSize, 'full');
        }
    }

    // Clamp to file size
    if (endBytes > fileSize) endBytes = fileSize;

    // Create hash stream
    const hash = crypto.createHash('md5'); // or 'sha256'

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, {
        start: 0,
        end: endBytes - 1
      });

      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  } 
  catch (err) {
    throw err;
  }
}

function shouldIgnore(filePath, ignorePatterns) {
  const normalized = filePath.replace(/\\/g, '/');
  return ignorePatterns.some(re => re.test(normalized) || re.test(path.basename(normalized)));
}

async function scanFolder(dir, ignorePatterns, senderId) {
    const win = BrowserWindow.getAllWindows().find(w => w.webContents.id === senderId);
    const scanData = scans.get(senderId);

    if (!scanData) return []; // safety check
    if (scanData.cancel) {
        win?.webContents.send('scan-cancelled');
        return [];
    }

    let results = [];
    let list;
    try {
        list = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (err) {
        win?.webContents.send('scan-errors', [`Error reading folder: ${dir}\n${err.message}`]);
        return [];
    }

    for (const entry of list) {
        if (scanData.cancel) {
            win?.webContents.send('scan-cancelled');
            return [];
        }

        const fullPath = path.join(dir, entry.name);
        if (shouldIgnore(fullPath, ignorePatterns)) continue;

        try {
            const lst = await fs.promises.lstat(fullPath);
            if (lst.isSymbolicLink()) continue;
        } catch { continue; }

        if (entry.isDirectory()) {
            const subFiles = await scanFolder(fullPath, ignorePatterns, senderId); // ✅ pass senderId
            results = results.concat(subFiles);
        } else {
            try {
                const stat = await fs.promises.stat(fullPath);
                results.push({
                    path: fullPath,
                    name: entry.name,
                    directory: path.dirname(fullPath),
                    size: stat.size,
                    mtime: stat.mtimeMs,
                    ctime: stat.birthtimeMs
                });
            } catch { continue; }
        }
    }

    return results;
}

// ---- Find Duplicates ----
ipcMain.handle('find-duplicates', async (event, folders, hashSetting = 'full', blinkEnabled = true, ignoreSettings) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const senderId = event.sender.id;
  
  const ignoreSmallEnabled = Boolean(ignoreSettings.ignoreSmallEnabled);
  const ignoreSmallValue = Number(ignoreSettings.ignoreSmallValue) || 10;    // KB
  const ignoreLargeEnabled = Boolean(ignoreSettings.ignoreLargeEnabled);
  const ignoreLargeValue = Number(ignoreSettings.ignoreLargeValue) || 500;   // MB
  const excludeLinks = Boolean(ignoreSettings.excludeLinks);

  // Convert KB/MB to bytes (use let so we can adjust if invalid)
  let minSize = ignoreSmallEnabled ? Math.max(0, Math.floor(ignoreSmallValue * 1024)) : 0;
  let maxSize = ignoreLargeEnabled ? Math.max(0, Math.floor(ignoreLargeValue * 1024 * 1024)) : Infinity;
  
  // If user entered invalid thresholds (min > max), clear filters and warn
  if (minSize > maxSize) {
    console.warn(`find-duplicates: minSize (${minSize}) > maxSize (${maxSize}). Ignoring size filters.`);
    minSize = 0;
    maxSize = Infinity;
  }

  const ignorePatterns = [];

  if (Array.isArray(ignoreSettings.ignorePatterns)) {
    for (const pattern of ignoreSettings.ignorePatterns) {
      try {
        ignorePatterns.push(new RegExp(pattern, 'i')); // Always regex
      }
      catch (err) {
        //console.warn(`Invalid regex ignored: ${pattern}`, err.message);
      }
    }
  }

  try {
    //cancelScan = false; // reset at start
    scans.set(senderId, { cancel: false });

    const sizeMap = new Map();     // Map size -> list of file objects
    const allFiles = [];           // All files scanned
    let filesScanned = 0;          // Counter for progress
    const startTime = Date.now();
    
    // debug counters
    let skippedSmall = 0;
    let skippedLarge = 0;
    let skippedInvalidSize = 0;
    let skippedLinks = 0;

    /* 
    // collect error messages to report to renderer
    const errors = []; 
    */

    // Step 1: Scan all files and group by size
    for (const folder of folders) {
      try {
        //const files = await (folder);
        //const files = await scanFolder(folder, ignorePatterns);
        const files = await scanFolder(folder, ignorePatterns, senderId);

        /* if (cancelScan) {
          win.setProgressBar(-1); // reset taskbar progress if cancelled
          return [];
        } */
        if (scans.get(senderId).cancel) {
          win.setProgressBar(-1); // reset taskbar progress if cancelled 
          win.setTitle("Copy Finder");
          return []; 
        }
        /*       
        for (const file of files) {
          allFiles.push(file);
          if (!sizeMap.has(file.size)) sizeMap.set(file.size, []);
          sizeMap.get(file.size).push(file); // push full object (with mtime/ctime)
        } 
        */

        for (const file of files) {
          // Guard: ensure file.size exists and is a number
          if (file == null || typeof file.size !== 'number') {
            skippedInvalidSize++;
            continue;
          }

          // Exclude shortcuts if checkbox enabled
          if (excludeLinks && /\.lnk$/i.test(file.name)) {
            skippedLinks++;
            continue;
          }

          // Apply ignore filters
          if (ignoreSmallEnabled && file.size < minSize) {
            skippedSmall++;
            continue;
          }
          if (ignoreLargeEnabled && file.size > maxSize) {
            skippedLarge++;
            continue;
          }

          // file passes filters -> include it
          allFiles.push(file);

          const sizeKey = Number(file.size); // force numeric key
          if (!sizeMap.has(sizeKey)) sizeMap.set(sizeKey, []);
          sizeMap.get(sizeKey).push(file);
        }
      }
      catch (err) {
        /* 
        // Permission or filesystem errors
        console.warn(`Skipping folder due to error: ${folder}`, err.message);

        // only push known permission-related errors
        if (err.code === 'EPERM' || err.code === 'EACCES' || /operation not permitted/i.test(err.message)) {
          errors.push(`Permission denied: ${folder}`);
        } 
        else {
          errors.push(`Error reading folder: ${folder}\n${err.message}`);
        } 
        */
      }
    } 

    /*     
    // Send quick stats to renderer so you can debug when scan returns 0
    win.webContents.send('scan-stats', {
      candidates: allFiles.length,
      skippedSmall,
      skippedLarge,
      skippedInvalidSize,
      minSize,
      maxSize
    }); 
    */

    const totalFiles = allFiles.length;
    //const limit = pLimit(50);     // Limit parallel hashing
    // Get user-defined pLimit (default 50)
    const userPLimit = Number(ignoreSettings.pLimit) || 50;
    const limit = pLimit(Math.max(1, userPLimit)); // enforce minimum 1

    const fileMap = new Map();    // Map hash -> files

    // Step 2: Hash files grouped by size
    for (const [size, files] of sizeMap) {
      for (const file of files) {
        if (scans.get(senderId).cancel) {
          win.setProgressBar(-1); // reset taskbar progress if cancelled 
          win.setTitle("Copy Finder");
          return []; 
        }

        filesScanned++;
        const progress = totalFiles > 0 ? filesScanned / totalFiles : 0;
        win.webContents.send('scan-progress', { scanned: filesScanned, total: totalFiles });
        win.setProgressBar(progress);

        // 🔹 Update titlebar with % scanned
        const percent = Math.floor(progress * 100);
        win.setTitle(`${percent}%`);

        if (files.length < 2) continue;

        try {
          const hash = await limit(() => hashFile(file.path, file.size, hashSetting));

          if (!fileMap.has(hash)) fileMap.set(hash, []);
          fileMap.get(hash).push({
            path: file.path,
            name: file.name,
            directory: file.directory,
            size: file.size,
            mtime: file.mtime,
            ctime: file.ctime,
            hash
          });
        } 
        catch (err) {
          /* 
          console.warn("Skipping unreadable file:", file.path, err.message);

          if (err.code === 'EPERM' || err.code === 'EACCES' || /operation not permitted/i.test(err.message)) {
            errors.push(`Permission denied: ${file.path}`);
          } 
          else {
            errors.push(`Error reading file: ${file.path}\n${err.message}`);
          }    
          */   
        }
      }
    }

    // Step 3: Collect duplicate groups
    const duplicates = [];
    for (const [hash, group] of fileMap) {
      if (group.length > 1) duplicates.push(group);
    }

    const duration = (Date.now() - startTime) / 1000;
    win.webContents.send('scan-complete', { duration, scanned: filesScanned, total: totalFiles });

    win.setProgressBar(-1);

    // 🔹 Blink only if user setting allows it
    if (blinkEnabled) {
      win.flashFrame(true);
    }

    // 🔹 Reset window title
    win.setTitle("Copy Finder");

    /* console.log('allFiles.length',allFiles.length);
    console.log('skippedSmall',skippedSmall);
    console.log('skippedLarge',skippedLarge);
    console.log('skippedInvalidSize',skippedInvalidSize);
    console.log('minSize',minSize);
    console.log('maxSize',maxSize);
    console.log('skippedLinks',skippedLinks); */

    /* // Inform renderer if any errors occurred
    if (errors.length > 0) {
      win.webContents.send('scan-errors', errors);
    }
    */

    lastScanFiles = allFiles; 
    lastDuplicates = duplicates;
    return duplicates; // Array of groups of duplicate files
  } 
  catch (err) {

    if (err.code === 'EPERM' || err.code === 'EACCES') {
      //console.warn('Skipping restricted folder:', dir);
      return []; // just skip
    }
    //console.error('❌ Scan failed:', err);

    /* // Notify renderer
    const win = BrowserWindow.getFocusedWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('scan-error', err.message || String(err));
    } */

    win.webContents.send('scan-cancel-error', err.message);

    // Rethrow to reject the promise
    throw err;
  }
});

// ----------------- Delete Files -----------------

ipcMain.handle('delete-files', async (event, filePaths) => {
  for (const file of filePaths) {
    try {
      const result = await shell.trashItem(file);
      if (result) console.warn(`Failed to trash: ${file}`, result);
    } 
    catch (err) {
      console.error("Delete failed:", err);
    }
  }
  return true;
});

// Read file content
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } 
  catch (err) {
    console.error("Read file error:", err);
    return null; // returning null is clearer than a string for error
  }
});

// Open file with default app
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    const result = await shell.openPath(filePath);
    if (result) {
      console.warn(`Failed to open: ${filePath}`, result);
      return false;
    }
    return true;
  } 
  catch (err) {
    console.error("Failed to open file:", err);
    return false;
  }
});

ipcMain.handle("open-folder", async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      console.warn("Path does not exist:", folderPath);
      return false;
    }

    const stats = fs.statSync(folderPath);

    if (stats.isDirectory()) {
      // Opens folder in OS file explorer
      const result = await shell.openPath(folderPath);
      if (result) console.warn("shell.openPath warning:", result); // result is empty string if success
    } 
    else {
      // If it's a file, open parent folder and highlight file
      shell.showItemInFolder(folderPath);
    }

    return true;
  } 
  catch (err) {
    console.error("Failed to open folder:", err);
    return false;
  }
});

ipcMain.handle('cancel-scan', (event) => {

  scans.get(event.sender.id).cancel = true;

  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    win.webContents.send("scan-cancelled");
  }
  
  return true;
});

ipcMain.handle('get-file-url', (event, filePath) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender); // optional
    const url = pathToFileURL(filePath);
    return url.href; // sent back to the renderer that requested it
  } 
  catch (err) {
    console.error(err);
    return null;
  }
});

// IPC handlers
ipcMain.handle('getSetting', (event, key) => {
  return settings[key];
});

ipcMain.handle('setSetting', (event, key, value) => {
  settings[key] = value;
  saveSettings(settings);
  return true;
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    const safe = /^https?:\/\//i.test(url);
    if (!safe) throw new Error('Invalid URL');
    await shell.openExternal(url);
  } 
  catch (err) {
    console.error('Failed to open URL:', err);
    return false;
  }
});

/* ----- OPEN MULTIPLE WINDOW ON APP ICON ----- */
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} 
else {
  app.on('second-instance', () => {
    createMainWindow();
  });

  app.whenReady().then(() => {
    registerThumProtocol();

    mainWindow = createMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });

    checkForUpdates();
  });
}

async function exportFileList(mainWindow) {
  if (!lastScanFiles || !lastScanFiles.length) {
    mainWindow.webContents.send('show-alert', 'No scan results available to export.');
    return;
  }

  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save File List',
      defaultPath: 'scanned_files.txt',
      filters: [{ name: 'Text Files', extensions: ['txt'] }],
    });

    if (result.canceled || !result.filePath) return;

    let content = `Scanned Files (${lastScanFiles.length})\n\n`;
    for (const f of lastScanFiles) {
      const ctime = new Date(f.ctime).toLocaleString();
      const mtime = new Date(f.mtime).toLocaleString();
      content += `${f.path}\nSize: ${formatBytes(f.size)} / Created: ${ctime} / Modified: ${mtime}\n\n`;
    }

    await fs.promises.writeFile(result.filePath, content, 'utf8');
    mainWindow.webContents.send('show-alert', `✅ File list exported to:\n${result.filePath}`);
  } catch (err) {
    mainWindow.webContents.send('show-alert', `❌ Export failed:\n${err.message}`);
  }
}

async function exportDuplicates(mainWindow, lastDuplicates) {
  if (!lastDuplicates || lastDuplicates.length === 0) {
    mainWindow.webContents.send('show-alert', 'No duplicates found to export.');
    return;
  }

  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Duplicate Files List',
      defaultPath: 'duplicates.txt',
      filters: [{ name: 'Text Files', extensions: ['txt'] }],
    });

    if (result.canceled || !result.filePath) return;

    let content = `Duplicate Files Report\n\nTotal Groups: ${lastDuplicates.length}\n\n`;

    lastDuplicates.forEach((group, i) => {
      content += `--- Group ${i + 1} ---\n`;
      group.forEach(f => {
        const ctime = new Date(f.ctime).toLocaleString();
        const mtime = new Date(f.mtime).toLocaleString();
        content += `${f.path}\nSize: ${formatBytes(f.size)} / Created: ${ctime} / Modified: ${mtime}\n\n`;
      });
    });

    await fs.promises.writeFile(result.filePath, content, 'utf8');
    mainWindow.webContents.send('show-alert', `✅ Duplicates exported to:\n${result.filePath}`);
  } 
  catch (err) {
    mainWindow.webContents.send('show-alert', `❌ Export failed:\n${err.message}`);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

function checkForUpdates() {
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdates();
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `Version ${info.version} is available. Do you want to download it now?`,
      buttons: ['Yes', 'No'],
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Install Update',
      message: 'Update downloaded. Restart now to install?',
      buttons: ['Restart', 'Later'],
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
  });
}

function openChangelog(mainWindow) {
  const changelogPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'changelog.txt');

  if (fs.existsSync(changelogPath)) {
    shell.openPath(changelogPath);
  } 
}
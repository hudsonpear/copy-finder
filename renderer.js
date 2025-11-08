const addFolderBtn = document.getElementById('addFolderBtn');
const folderListDiv = document.getElementById('folderList');
const scanBtn = document.getElementById('scanBtn');
const deleteBtn = document.getElementById('deleteBtn');
const resultsDiv = document.getElementById('results');
const downControls = document.getElementById('downControls');
const controls = document.getElementById('controls');
const downLeft = document.getElementById('downLeft');
const downRight = document.getElementById('downRight');
const scanTimeDiv = document.getElementById('scanTime');
const scanPercent = document.getElementById('scanPercent');
const scanStatus = document.getElementById('scanStatus');
const selectDupBtn = document.getElementById('selectDupBtn');
const selectedFolderSpan = document.getElementById('selectedFolderSpan');
const cancelBtn = document.getElementById("cancelScanBtn");
const emptyState = document.getElementById('emptyState');
const delSelected = document.getElementById('delSelected');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill')
const settingsWindow = document.getElementById('settingsWindow');
const settCloseBtn = document.getElementById('settCloseBtn');
const backToTop = document.getElementById("backToTop");
const openSettBtn = document.getElementById('openSettBtn');
const clearBtn = document.getElementById('clearBtn');

const hashModeSelect = document.getElementById('hashModeSelect');
const customHashKB = document.getElementById('customHashKB');
const dynamicHashInfo = document.getElementById('dynamicHashInfo');

const totalScan = document.getElementById('totalScan');
const dupGroups = document.getElementById('dupGroups');
const totalDuplicates = document.getElementById("totalDuplicates");
const wastedSpace = document.getElementById('wastedSpace');
const totalScanTime = document.getElementById('totalScanTime');

const rightClickMenuItem_file = document.getElementById('rightClickMenuItem_file');
const rightClickMenu = document.getElementById("rightClickMenu");
const rightClickMenuFile = document.getElementById("rightClickMenuItem_file");

const generalTab = document.getElementById('generalTab');
const hashSearchTab = document.getElementById('hashSearchTab');
const ignoreTab = document.getElementById('ignoreTab');
const generalContentDiv = document.getElementById('generalContentDiv');
const hashContentDiv = document.getElementById('hashContentDiv');
const ignoreContentDiv = document.getElementById('ignoreContentDiv');

const sortBtn = document.getElementById('sortBtn');
const sortDropdown = document.getElementById('sortDropdown');
const selectBtn = document.getElementById('selectBtn');
const selectDropdown = document.getElementById('selectDropdown');

const ignoreSmallCheck = document.getElementById('settIngoreSmall');
const ignoreSmallInput = document.getElementById('ignoreSmallInput');
const ignoreLargeCheck = document.getElementById('settIngoreLarger');
const ignoreLargeInput = document.getElementById('ignoreLargeInput');

const savedIgnoreSmall = localStorage.getItem('ignoreSmallEnabled') === 'true';
const savedIgnoreSmallValue = localStorage.getItem('ignoreSmallValue') || '';
const savedIgnoreLarge = localStorage.getItem('ignoreLargeEnabled') === 'true';
const savedIgnoreLargeValue = localStorage.getItem('ignoreLargeValue') || '';

const excludeLinksCheckbox = document.getElementById('excludeLinks');

const infoBtn = document.getElementById('infoBtn');
const aboutWindow = document.getElementById('aboutWindow');
const aboutCloseBtn = document.getElementById('aboutCloseBtn');

let duplicatesSelected = false; // toggle state

// Load from LocalStorage or set defaults
let stored = localStorage.getItem('ignorePatterns');
let ignorePatterns = [];

if (stored === null) {
  // Key does not exist → load defaults
  ignorePatterns.push(/^\..*/);                        
  ignorePatterns.push(/^\$.*/);                        
  ignorePatterns.push(/^\$Recycle\.Bin($|[\\/])/);     
  ignorePatterns.push(/^System Volume Information($|[\\/])/);  
  ignorePatterns.push(/^[A-Z]:[\\/]+Windows([\\/]|$)/i);
  ignorePatterns.push(/^SysReset($|[\\/])/);           
  ignorePatterns.push(/^OneDriveTemp($|[\\/])/);       

  ignorePatterns.push(/^DumpStack\.log\.tmp$/i);
  ignorePatterns.push(/^hiberfil\.sys$/i);
  ignorePatterns.push(/^pagefile\.sys$/i);
  ignorePatterns.push(/^swapfile\.sys$/i);

  ignorePatterns.push(/\.git([\\/]|$)/);               
  ignorePatterns.push(/node_modules([\\/]|$)/);       
  ignorePatterns.push(/lost\+found([\\/]|$)/);        

  ignorePatterns.push(/^\.Trash\-.*$/);
  ignorePatterns.push(/^\.DS_Store$/);
  ignorePatterns.push(/^desktop\.ini$/i);
  ignorePatterns.push(/^thumbs\.db$/i);

  ignorePatterns.push(/AlbumArt/i);

  saveIgnoreList();
} 
else {
  // Key exists → keep whatever is stored (even if empty)
  ignorePatterns = JSON.parse(stored).map(s => {
    if (typeof s === 'string' && s.startsWith('/') && s.lastIndexOf('/') > 0) {
      const lastSlash = s.lastIndexOf('/');
      const body = s.slice(1, lastSlash);
      const flags = s.slice(lastSlash + 1);
      try { return new RegExp(body, flags); } catch { return null; }
    }
    return null;
  }).filter(r => r !== null);
}

// Default ignore patterns
const defaultIgnorePatterns = [
  /^\..*/,
  /^\$.*/,
  /^\$Recycle\.Bin($|[\\/])/,
  /^System Volume Information($|[\\/])/,
  /^[A-Z]:[\\/]+Windows([\\/]|$)/i,
  /^SysReset($|[\\/])/,
  /^OneDriveTemp($|[\\/])/,
  /^DumpStack\.log\.tmp$/i,
  /^hiberfil\.sys$/i,
  /^pagefile\.sys$/i,
  /^swapfile\.sys$/i,
  /\.git([\\/]|$)/,
  /node_modules([\\/]|$)/,
  /lost\+found([\\/]|$)/,
  /^\.Trash\-.*$/,
  /^\.DS_Store$/,
  /^desktop\.ini$/i,
  /^thumbs\.db$/i,
  /AlbumArt/i
];

let currentFile = null; // store the file being clicked

let selectedFolders = [];
let duplicateGroups = [];

let showThumbs = false;
let toggleBtn = null;
let currentScanToken = null;

// Disable cancel button initially
cancelBtn.disabled = true;
scanBtn.disabled = false;
scanBtn.innerHTML = '🔍 Start Scan';

// Render folder list
function renderFolderList() {
  folderListDiv.innerHTML = "";
  if (!selectedFolders.length) { 
    selectedFolderSpan.innerText = "No folders selected."; 
    return;
  }
  selectedFolders.forEach((folder, index) => {
    const div = document.createElement('div');
    div.innerHTML = `
    <div class="folder-item">
      <div class="folder-icon">📁</div>
      <div class="folder-path">${folder}</div>
      <button data-link="${folder}" class="buttonStyle open-folder">Open Folder</button>
      <button data-index="${index}" class="buttonStyle remove-folder">Remove</button>
    </div>
    `;
    
    folderListDiv.appendChild(div);
    selectedFolderSpan.innerText = `Selected Folders (${selectedFolders.length})`;
  });

  folderListDiv.querySelectorAll('.remove-folder').forEach(btn => {
    btn.addEventListener('click', e => {
      selectedFolders.splice(parseInt(e.target.dataset.index), 1);
      renderFolderList();
    });
  });

  // open folder
  folderListDiv.querySelectorAll('.open-folder').forEach(btn => {
    btn.addEventListener('click', e => {
      const folderPath = e.target.dataset.link;
      if (folderPath) {
        window.api.openFolder(folderPath); // send to your API
      }
    });
  });

}

clearBtn.addEventListener("click", async () => {
  duplicateGroups = [];
  selectedFolders = [];
  currentScanToken = null;

  folderListDiv.innerHTML = "";
  selectedFolderSpan.innerText = "No folders selected."; 
  
  await window.api.cancelScan();
  
  cancelBtn.disabled = true;

  scanBtn.disabled = false;
  scanBtn.innerHTML = '🔍 Start Scan';

  resultsDiv.innerHTML = "";

  scanStatus.textContent = '';
  scanPercent.textContent = "";
  scanTimeDiv.textContent = ``;

  progressFill.style.width = `0%`;
  progressBar.style.display = 'none';

  document.getElementById("panel").style.display = "none";
  totalScan.textContent = `0`;
  totalDuplicates.textContent = `0`;
  dupGroups.textContent = `0`;
  wastedSpace.textContent = `0 MB`;
  totalScanTime.textContent = `0s`;

  selectBtn.style.display = "none";

  // remove old toggle button if it exists
  if (toggleBtn && toggleBtn.parentNode) {
    toggleBtn.parentNode.removeChild(toggleBtn);
    toggleBtn = null;
  }
  showThumbs = false;

  emptyState.style.display = "block";

  closePreview();
});

addFolderBtn.addEventListener("click", async () => {
  const folders = await window.api.selectFolders();
  if (!folders || folders.length === 0) return;

  folders.forEach(folder => {
    const resolved = folder.toLowerCase();

    // Check if folder already exists
    if (selectedFolders.some(f => f.toLowerCase() === resolved)) {
      showErrorMsg('att', `Skipped: "${folder}" already added.`, 5000);
      return;
    }

    // If a parent already exists, skip adding this subfolder
    if (selectedFolders.some(f => resolved.startsWith(f.toLowerCase() + "\\"))) {
      showErrorMsg('att', `Skipped: "${folder}" already included in a parent folder.`, 5000);
      return;
    }

    // If the new folder is a parent of any existing ones, remove the subfolders
    selectedFolders = selectedFolders.filter(
      f => !f.toLowerCase().startsWith(resolved + "\\")
    );

    // Add the parent folder
    selectedFolders.push(folder);
  });

  renderFolderList();
});


// Scan duplicates
scanBtn.addEventListener('click', async () => {
  if (scanBtn.disabled) return;

  if (!selectedFolders.length) return showErrorMsg('error', "Add folders first.", 5000);

  document.getElementById("panel").style.display = "none";
  totalScan.textContent = `0`;
  totalDuplicates.textContent = `0`;
  dupGroups.textContent = `0`;
  wastedSpace.textContent = `0 MB`;
  totalScanTime.textContent = `0s`;

  emptyState.style.display = "none";

  scanStatus.textContent = 'Scanning Folders... ';
  //scanStatus.textContent = 'Collecting Files... ';
  progressBar.style.display = 'block';
  progressFill.style.width = `0%`;

  scanPercent.textContent = '';
  resultsDiv.innerHTML = ''; 
  scanTimeDiv.textContent = '';

  cancelBtn.disabled = false;
  scanBtn.disabled = true;
  scanBtn.innerHTML = '⏳ Scanning...';

  // 🔹 Get selected hash mode
  let hashSetting = hashModeSelect.value;
  if (hashSetting === 'custom') {
    const kb = parseInt(customHashKB.value, 10);
    if (!kb || kb <= 0) {
      return showErrorMsg('error', "Enter a valid custom KB value.", 5000);
    }
    hashSetting = `${kb}kb`; // send like "32kb"
  }

  // 🔹 Generate new scan token
  currentScanToken = Date.now();
  const scanToken = currentScanToken;

  // reset UI before starting scan
  resultsDiv.innerHTML = "";

  closePreview();

  selectBtn.style.display = "none";

  // remove old toggle button if it exists
  if (toggleBtn && toggleBtn.parentNode) {
    toggleBtn.parentNode.removeChild(toggleBtn);
    toggleBtn = null;
  }
  showThumbs = false;

  //duplicateGroups = await window.api.findDuplicates(selectedFolders);
  // 🔹 Send folders and hash mode to backend
    //duplicateGroups = await window.api.findDuplicates(selectedFolders, hashSetting, blinkEnabled);

  const blinkEnabled = localStorage.getItem('blinkEnabled') === 'true';
  
  const ignoreSettings = getIgnoreSettings();

  duplicateGroups = await window.api.findDuplicates(
    selectedFolders,
    hashSetting,
    blinkEnabled,
    ignoreSettings
  );

  // Apply default sort or last sort
  if (appSettings.lastSort && appSettings.lastSort.criteria) {
    sortDuplicates(appSettings.lastSort.criteria, appSettings.lastSort.order, scanToken);
  } 
  else if (appSettings.defaultSort.criteria) {
    sortDuplicates(appSettings.defaultSort.criteria, appSettings.defaultSort.order, scanToken);
  }

  // Update panel (stats)
  updateScanPanel(duplicateGroups)
});

let appSettings = {
  defaultSort: { criteria: 'size', order: 'desc' } // example
};

let currentSort = { 
  criteria: appSettings.defaultSort.criteria, 
  order: appSettings.defaultSort.order 
};

// ---- Restore last used sorting from LocalStorage ----
const savedSort = JSON.parse(localStorage.getItem('lastSort'));

// If user has a saved sort, use it; otherwise default to size/desc
if (savedSort && savedSort.criteria && savedSort.order) {
  appSettings.lastSort = savedSort;
  currentSort.criteria = savedSort.criteria;
  currentSort.order = savedSort.order;
} 
else {
  appSettings.lastSort = { criteria: 'size', order: 'desc' };
}

function sortDuplicates(criteria, forceOrder = null, scanToken) {
  if (currentSort.criteria === criteria) {
    // only toggle if forceOrder is not provided
    if (forceOrder === null) {
      currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
    } 
    else {
      currentSort.order = forceOrder;
    }
  } 
  else {
    currentSort.criteria = criteria;
    // default order: descending for size, modified, created; ascending for name/path
    currentSort.order = forceOrder !== null ? forceOrder
      : ['size','mtime','ctime'].includes(criteria) ? 'desc' : 'asc';
  }

  // Save the current sort in appSettings.lastSort
  appSettings.lastSort = {
    criteria: currentSort.criteria,
    order: currentSort.order
  };

  // Clone the groups so original data stays intact
  let sortedGroups = [...duplicateGroups];

  // Sort files inside each group
  sortedGroups.forEach(group => {
    group.sort((a, b) => {
      if (criteria === "name") {
        const nameA = a.path.split(/[\\/]/).pop();
        const nameB = b.path.split(/[\\/]/).pop();
        return nameA.localeCompare(nameB);
      } 
      else if (criteria === "path") {
        return a.path.localeCompare(b.path);
      } 
      else if (criteria === "size") {
        return a.size - b.size;
      } 
      else if (criteria === "mtime") {
        return a.mtime - b.mtime;
      } 
      else if (criteria === "ctime") {
        return a.ctime - b.ctime;
      }
    });

    if (currentSort.order === 'desc') group.reverse();
  });

  // Sort the groups themselves based on first file
  sortedGroups.sort((a, b) => {
    const fileA = a[0];
    const fileB = b[0];

    if (criteria === "name") {
      const nameA = fileA.path.split(/[\\/]/).pop();
      const nameB = fileB.path.split(/[\\/]/).pop();
      return nameA.localeCompare(nameB);
    } 
    else if (criteria === "path") {
      return fileA.path.localeCompare(fileB.path);
    } 
    else if (criteria === "size") {
      return fileA.size - fileB.size;
    } 
    else if (criteria === "mtime") {
      return fileA.mtime - fileB.mtime;
    } 
    else if (criteria === "ctime") {
      return fileA.ctime - fileB.ctime;
    }
  });

  if (currentSort.order === 'desc') sortedGroups.reverse();

  displayResults(sortedGroups, scanToken);

  updateSortDropdownUI(currentSort.criteria, currentSort.order);
}

const sortLabels = {
  name: "Name",
  path: "Path",
  size: "Size",
  mtime: "Modified",
  ctime: "Created"
};

function updateSortDropdownUI(criteria, order) {
  document.querySelectorAll('#sortDropdown .sortOption').forEach(option => {
    const label = sortLabels[option.dataset.sort] || option.dataset.sort;

    if (option.dataset.sort === criteria) {
      option.textContent = `${label} (${order === 'asc' ? '↑' : '↓'})`;
      option.classList.add('selected');  // make bold
    } 
    else {
      option.textContent = label;
      option.classList.remove('selected');
    }
  });
}

// Initialize the dropdown labels based on saved sort
updateSortDropdownUI(currentSort.criteria, currentSort.order);

// Optional: visually update the button text to show current sorting
const arrow = currentSort.order === 'asc' ? '↑' : '↓';
const labelMap = { name: 'Name', path: 'Path', size: 'Size', mtime: 'Modified', ctime: 'Created' };

// Persist last used sorting in LocalStorage
localStorage.setItem('lastSort', JSON.stringify({
  criteria: currentSort.criteria,
  order: currentSort.order
}));

// Toggle dropdown
sortBtn.addEventListener('click', () => {
  sortDropdown.style.display = sortDropdown.style.display === 'block' ? 'none' : 'block';
});

// Close dropdown if clicked outside
document.addEventListener('click', (e) => {
  if (!sortDropdown.contains(e.target) && e.target !== sortBtn) {
    sortDropdown.style.display = 'none';
  }
  if (!selectDropdown.contains(e.target) && e.target !== selectBtn) {
    selectDropdown.style.display = 'none';
  }
});

// TOGGLE SORT MENU
selectBtn.addEventListener('click', () => {
  selectDropdown.style.display = selectDropdown.style.display === 'block' ? 'none' : 'block';
});

sortDropdown.addEventListener('click', (e) => {
  const option = e.target.closest('.sortOption');
  if (!option) return;

  const criteria = option.dataset.sort;
  sortDropdown.style.display = 'none';

  // Perform sorting
  sortDuplicates(criteria, null, currentScanToken);

  // Save last used sorting to LocalStorage
  localStorage.setItem('lastSort', JSON.stringify({
    criteria: currentSort.criteria,
    order: currentSort.order
  }));
});

function displayResults(duplicateGroups, scanToken) {
    // 🔹 Ignore results from previous scans
  if (scanToken !== currentScanToken) return;

  // Clear the results area
  resultsDiv.innerHTML = "";

  closePreview();

  // 🔹 Show/hide "Select Duplicated" depending on results
  if (duplicateGroups.length > 0) {
    selectBtn.style.display = "inline-block"; // or "block" if you want full width
  } 
  else {
    selectBtn.style.display = "none";
  }

  // Create the toggle button once for this scan (if there are results)
  if (!toggleBtn && duplicateGroups.length > 0) {
    toggleBtn = document.createElement("button");
    toggleBtn.className = 'buttonStyle';
    toggleBtn.textContent = showThumbs ? "❌ Hide Thumbnails" : "🖼️ Show Thumbnails";

    toggleBtn.addEventListener("click", () => {
      showThumbs = !showThumbs;
      toggleBtn.textContent = showThumbs ? "❌ Hide Thumbnails" : "🖼️ Show Thumbnails";

      // 🔹 Reset duplicate selection state
      duplicatesSelected = false;
      delSelected.innerText = "0";
      //selectDupBtn.innerText = "⬜ Select Duplicated";
      deleteBtn.disabled = true;

      updateDeleteButtons();

      displayResults(duplicateGroups, currentScanToken);
    });
    
    downLeft.appendChild(toggleBtn);
  }

  // IntersectionObserver for lazy-loading thumbnails
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset && img.dataset.src) {
          img.src = img.dataset.src;
          delete img.dataset.src;
        }
        observer.unobserve(img);
      }
    });
  }, {
    root: null,
    rootMargin: "200px",
    threshold: 0.1
  });

  // Render groups
  duplicateGroups.forEach((group, index) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group';

    const numberLabel = document.createElement('div');
    numberLabel.className = 'group-number';
    numberLabel.textContent = index + 1;
    groupDiv.appendChild(numberLabel);

    group.forEach(f => {
      const div = document.createElement('div');
      div.className = 'file-item';

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = f.path;

      // 🔹 Update counter when user checks/unchecks
      checkbox.addEventListener("change", () => {
        const count = resultsDiv.querySelectorAll("input[type='checkbox']:checked").length;
        delSelected.textContent = count;
        deleteBtn.disabled = count === 0;

        updateDeleteButtons();

        // Highlight the file item
        if (checkbox.checked) { div.classList.add("selected"); } 
        else { div.classList.remove("selected"); }
      });

      div.appendChild(checkbox);

      // Thumbnail OR placeholder
      if (showThumbs) {
        const thumb = document.createElement("img");
        thumb.className = "file-thumb";
        thumb.src = `thum:///${encodeURIComponent(f.path)}`;

        // 🔹 Make thumbnail clickable → open preview
        thumb.addEventListener("click", e => {
          e.stopPropagation(); // prevent triggering checkbox or context menu accidentally
          showPreview(f);
        });

        div.appendChild(thumb);
        observer.observe(thumb);
      } 
      else {
        const placeholder = document.createElement("div");
        //placeholder.className = "file-placeholder";
        //placeholder.textContent = "";
        div.appendChild(placeholder);
      }

      // Clickable label
      const span = document.createElement("span");
      span.className = "file-label";
      span.dataset.path = f.path;

      span.addEventListener("click", async () => {
        const mode = getItemClickMode();

        if (mode === 'openPreview') {
          showPreview(f);
        } 
        else if (mode === 'selectItem') {
          const checkbox = div.querySelector('input[type="checkbox"]');
          if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event("change"));
          }
        }
      });

      const timeMode = getDisplayTimeMode();
      const fileTime = (timeMode === 'creTime') ? f.ctime : f.mtime;
      const timeLabel = (timeMode === 'creTime') ? 'Created' : 'Modified';

      span.innerHTML = `
        <div class="file-name">${f.name}</div>
        <div class="file-details">
          <span>${truncatePath(f.directory, 100)}</span>
          <span>${formatBytes(f.size)}</span>
          <span title="${timeLabel} Time">${new Date(fileTime).toLocaleString()}</span>
        </div>
      `;
      div.appendChild(span);

      // Open File button
      const openFileBtn = document.createElement('button');
      openFileBtn.className = 'buttonStyle itemBtn';
      openFileBtn.textContent = 'Open File';
      openFileBtn.addEventListener('click', () => window.api.openFile(f.path));
      div.appendChild(openFileBtn);

      // Open Folder button
      const openFolderBtn = document.createElement('button');
      openFolderBtn.className = 'buttonStyle itemBtn';
      openFolderBtn.textContent = 'Open Folder';
      openFolderBtn.addEventListener('click', () => window.api.openFolder(f.path));
      div.appendChild(openFolderBtn);

      // 🔹 ADD CONTEXT MENU HOOK HERE
      attachContextMenu(div, f);

      groupDiv.appendChild(div);
    });

    resultsDiv.appendChild(groupDiv);
  });

  if (!duplicateGroups.length) {
    resultsDiv.innerHTML = '<div id="middleDiv"><span>No duplicates found.</span></div>';
  }
}

// Show preview depending on file type
async function showPreview(file) {
  // Remove any existing preview window
  const existing = document.querySelector(".preview-window");
  if (existing) existing.remove();

  // Create new preview window
  const previewDiv = document.createElement("div");
  previewDiv.className = "preview-window";

  // ---- HEADER (name + size + close button) ----
  const header = document.createElement("div");
  header.className = "preview-header";

  const fileName = file.path.split(/[\\/]/).pop();
  const title = document.createElement("span");
  title.textContent = `${fileName} (${formatBytes(file.size)})`;

  const closeBtn = document.createElement("div");
  closeBtn.className = "preview-close";
  closeBtn.textContent = "✖";
  closeBtn.onclick = () => previewDiv.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);
  previewDiv.appendChild(header);

  // ---- CONTENT ----
  const contentDiv = document.createElement("div");
  previewDiv.appendChild(contentDiv);

  if (/\.(png|apng|jpe?g|gif|bmp|webp|ico|svg|avif|jp2|j2k|jpf|jpx|jpm|mj2|cur|jfif)$/i.test(file.path)) {
    const img = document.createElement("img");
    const url = await window.api.getFileURL(file.path);
    img.src = url;
    img.style.maxWidth = "100%";
    img.style.maxHeight = "300px";
    contentDiv.appendChild(img);
  }
  else if (/\.(txt|md|log|json|js|css|html)$/i.test(file.path)) {
    const content = await window.api.readFile(file.path);
    const pre = document.createElement("pre");
    pre.textContent = content.substring(0, 1000) + (content.length > 1000 ? "\n...[truncated]" : "");
    pre.style.overflow = "auto";
    contentDiv.appendChild(pre);
  }
  else if (/\.(mp4|webm|mkv|mov|m4v)$/i.test(file.path)) {
    const video = document.createElement("video");
    const url = await window.api.getFileURL(file.path);
    video.src = url;
    video.controls = true;
    video.autoplay = true;   // autoplay enabled
    video.style.maxWidth = "100%";
    video.style.maxHeight = "300px";
    contentDiv.appendChild(video);
    video.play().catch(err => console.warn("Autoplay blocked:", err));
  }
  else if (/\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(file.path)) {
    const audio = document.createElement("audio");
    const url = await window.api.getFileURL(file.path);
    audio.src = url;
    audio.controls = true;
    audio.autoplay = true;   // autoplay enabled
    contentDiv.appendChild(audio);
    audio.play().catch(err => console.warn("Autoplay blocked:", err));
  }
  else if (/\.pdf$/i.test(file.path)) {
    const url = await window.api.getFileURL(file.path);
    const embed = document.createElement("embed");
    embed.src = url;
    embed.type = "application/pdf";
    embed.style.width = "100%";
    embed.style.height = "400px";
    contentDiv.appendChild(embed);
  }
  else if (/\.flv$/i.test(file.path)) {
    const msg = document.createElement("div");
    msg.textContent = "Flash Video (.flv) file preview not supported.";
    previewDiv.appendChild(msg);
  }
  else if (/\.avi$/i.test(file.path)) {
    const msg = document.createElement("div");
    msg.textContent = "Audio Video Interleave (.avi) file preview not supported.";
    previewDiv.appendChild(msg);
  }
  else if (/\.wmv$/i.test(file.path)) {
    const msg = document.createElement("div");
    msg.textContent = "Windows Media Video (.wmv) file preview not supported.";
    previewDiv.appendChild(msg);
  }
  else if (/\.3gp$/i.test(file.path)) {
    const msg = document.createElement("div");
    msg.textContent = "3GP (.3gp) file preview not supported.";
    previewDiv.appendChild(msg);
  }
  else if (/\.mpeg$/i.test(file.path)) {
    const msg = document.createElement("div");
    msg.textContent = "Moving Picture Experts Group (.mpeg) file preview not supported.";
    previewDiv.appendChild(msg);
  }
  else if (/\.tif|tiff$/i.test(file.path)) {
    const msg = document.createElement("div");
    msg.textContent = "Tagged Image File Format (.tif/tiff) file preview not supported.";
    previewDiv.appendChild(msg);
  }
  else {
    const fallback = document.createElement("p");
    fallback.textContent = `Preview not available for this type.\nFile: ${file.path}`;
    contentDiv.appendChild(fallback);
  }

  document.body.appendChild(previewDiv);
}

deleteBtn.addEventListener('click', async () => {
  const checkboxes = resultsDiv.querySelectorAll('input[type=checkbox]:checked');
  const toDelete = Array.from(checkboxes).map(cb => cb.value);

  if (!toDelete.length) return showErrorMsg('error', "Select files to delete.", 5000);

  const confirmed = await confirmDlg(`Are you sure you want to delete ${delSelected.textContent} selected files? They will be moved to trash.`);
  if (!confirmed) return;

  await window.api.deleteFiles(toDelete);

  // Iterate over groups
  duplicateGroups.forEach((group, gIndex) => {
    // Remove files from group array
    const remainingFiles = group.filter(f => !toDelete.includes(f.path));
    duplicateGroups[gIndex] = remainingFiles;

    // Remove deleted files from DOM
    group.forEach(f => {
      if (toDelete.includes(f.path)) {
        const checkbox = resultsDiv.querySelector(`input[type=checkbox][value="${f.path.replace(/\\/g,'\\\\')}"]`);
        if (checkbox) {
          const parentDiv = checkbox.closest('.file-item');
          if (parentDiv) parentDiv.remove();
        }
      }
    });
  });

  // Remove groups with 1 or 0 items
  duplicateGroups = duplicateGroups.filter(group => {
    if (group.length <= 1) {  // check for 0 or 1
      // Find the corresponding div in the DOM
      const groupDivs = resultsDiv.querySelectorAll('.group');
      for (const div of groupDivs) {
        const items = div.querySelectorAll('.file-item');
        // Match the number of items in the group
        if (items.length === group.length) {
          div.remove();
          break;
        }
      }
      return false; // remove from array
    }
    return true; // keep groups with 2 or more items
  });

  // Reset selection UI
  delSelected.innerText = `0`;
  //selectDupBtn.innerText = `⬜ Select Duplicated`;
  deleteBtn.disabled = true;
  floatingDeleteBtn.classList.remove("show");
});

function truncatePath(path, maxLength) {
  if (path.length <= maxLength) return path;
  const start = path.substring(0, maxLength / 2);
  const end = path.substring(path.length - maxLength / 2);
  return `${start}...${end}`;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

/* BACK TO TOP BUTTON */

window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    backToTop.style.opacity = "1";
    backToTop.style.pointerEvents = "auto";
  } else {
    backToTop.style.opacity = "0";
    backToTop.style.pointerEvents = "none";
  }
});

// Smooth scroll effect (manual animation with requestAnimationFrame)
backToTop.addEventListener("click", () => {
  const start = window.scrollY;
  const duration = 600; // ms
  const startTime = performance.now();

  function scrollStep(timestamp) {
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    window.scrollTo(0, start * (1 - ease));

    if (progress < 1) {
      requestAnimationFrame(scrollStep);
    }
  }

  requestAnimationFrame(scrollStep);
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 200 && localStorage.getItem('backToTopEnabled') === 'true') {
    backToTop.style.display = "block";
  } 
  else {
    backToTop.style.display = "none";
  }
});

//DRAG WINDOW SYSTEM------------------------------------

const draggableIds = ['dragHandleSett','dragHandleAbout'];
let draggableElements = [];

draggableIds.forEach((id) => {
    const dragHandle = document.getElementById(id);
    const form = dragHandle.parentElement;
    draggableElements.push({ dragHandle, form });
});

draggableElements.forEach((draggable) => {
    let isDraggingWin = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    draggable.dragHandle.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', dragForm);
    document.addEventListener('mouseup', stopDrag);
    function startDrag(e) {
        isDraggingWin = true;
        dragOffsetX = e.pageX - draggable.form.offsetLeft;
        dragOffsetY = e.pageY - draggable.form.offsetTop;
    }
    function dragForm(e) {
        if (isDraggingWin) {
            draggable.form.style.left = e.pageX - dragOffsetX + 'px';
            draggable.form.style.top = e.pageY - dragOffsetY + 'px';
        }
    }
    function stopDrag() {
        isDraggingWin = false;
    }
});

settCloseBtn.addEventListener('click', () => {
  settingsWindow.style.display = 'none';
});
aboutCloseBtn.addEventListener('click', () => {
  aboutWindow.style.display = 'none';
});

infoBtn.onclick = function () {
    if (aboutWindow.style.display === 'none' || aboutWindow.style.display === '') {
       aboutWindow.style.display = 'block';
    }
    else {
        aboutWindow.style.display = 'none';
    }
};

openSettBtn.onclick = function () {
    if (settingsWindow.style.display === 'none' || settingsWindow.style.display === '') {
       settingsWindow.style.display = 'block';
    }
    else {
        settingsWindow.style.display = 'none';
    }
};

function updateScanPanel(duplicateGroups) {
  dupGroups.textContent = `${duplicateGroups.length}`;

  // Total duplicates & wasted space
  let dupCount = 0;
  let wasted = 0;
  duplicateGroups.forEach(group => {
    if (group.length > 1) {
      dupCount += group.length - 1;
      wasted += group.slice(1).reduce((sum, f) => sum + f.size, 0);
    }
  });

  totalDuplicates.textContent = dupCount;
  wastedSpace.textContent = formatBytes(wasted);
}

// =-=-=-=-=-=-=UP NOTIFICATIONS=-=-=-=-=-=-= 

let errorMsgNotificationTimeouts = [];

function showErrorMsg(type, message, duration = 5000) {
    const errorBox = document.getElementById("errorMsgDisplayDiv");

    const errorMsgDisplay = document.createElement('div');
    errorMsgDisplay.classList.add('errorMsgDisplay');

    errorBox.appendChild(errorMsgDisplay);

    // Close button
    const closeBtn = document.createElement('div');
    closeBtn.classList.add('errorCloseBtn');
    closeBtn.innerHTML = `
        <svg class="errorxBtn" viewBox="0 -960 960 960">
                <path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/>
        </svg>
    `;
    errorMsgDisplay.appendChild(closeBtn);

    closeBtn.onclick = () => {
        errorMsgDisplay.classList.add('fadeOut');
        setTimeout(() => {
            errorMsgDisplay.remove();
        }, 500);
    };

    const errorIconDiv = document.createElement('div');
    errorIconDiv.classList.add('errorIconDiv');

    errorMsgDisplay.appendChild(errorIconDiv);

    const errorMsg = document.createElement('span');

    // Set message text
    errorMsg.textContent = message;

    errorMsgDisplay.appendChild(errorMsg);

    const errorTimeLeftDiv = document.createElement('div');
    errorTimeLeftDiv.classList.add('errorTimeLeftDiv');

    errorMsgDisplay.appendChild(errorTimeLeftDiv);

    const errorProgressBar = document.createElement('div');
    errorProgressBar.classList.add('errorProgressBar');

    errorTimeLeftDiv.appendChild(errorProgressBar);

    // Reset progress bar
    errorProgressBar.style.transition = "none"; // Remove transition to reset width instantly
    errorProgressBar.style.width = "100%";

    // Delay applying transition to ensure it animates properly
    setTimeout(() => {
        errorProgressBar.style.transition = `width ${duration / 1000}s linear`;
        errorProgressBar.style.width = "0%";
    }, 50);

    // Set the icon and progress bar color based on the type
    if (type == 'error') {
        errorIconDiv.innerHTML = `
        <svg class="errorIconSvg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM7.29289 16.7071C6.90237 16.3166 6.90237 15.6834 7.29289 15.2929L10.5858 12L7.29289 8.70711C6.90237 8.31658 6.90237 7.68342 7.29289 7.29289C7.68342 6.90237 8.31658 6.90237 8.70711 7.29289L12 10.5858L15.2929 7.29289C15.6834 6.90237 16.3166 6.90237 16.7071 7.29289C17.0976 7.68342 17.0976 8.31658 16.7071 8.70711L13.4142 12L16.7071 15.2929C17.0976 15.6834 17.0976 16.3166 16.7071 16.7071C16.3166 17.0976 15.6834 17.0976 15.2929 16.7071L12 13.4142L8.70711 16.7071C8.31658 17.0976 7.68342 17.0976 7.29289 16.7071Z"/>
        </svg> 
        `;
        errorProgressBar.classList.add('errorColor');
        //SET COLOR RED WHEN IS AN ERROR MSG
        errorMsg.classList.add('errorMsgColor');
    }
    else if (type == 'ok') {
        errorIconDiv.innerHTML = `
        <svg class="okIconSvg" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zm2.72 5.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-2-2a.75.75 0 011.06-1.06l1.47 1.47 3.97-3.97z" clip-rule="evenodd"/>
        </svg>
        `;
        errorProgressBar.classList.add('okColor');
    }
    else if (type == 'att') {
        errorIconDiv.innerHTML = `
        <svg class="attIconSvg" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 1a2.143 2.143 0 00-1.827 1.024l-5.88 9.768a2.125 2.125 0 00.762 2.915c.322.188.687.289 1.06.293h11.77a2.143 2.143 0 001.834-1.074 2.126 2.126 0 00-.006-2.124L9.829 2.028A2.149 2.149 0 008 1zM7 11a1 1 0 011-1h.007a1 1 0 110 2H8a1 1 0 01-1-1zm1.75-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z" clip-rule="evenodd"/>
        </svg>
        `;
        errorProgressBar.classList.add('attColor');
    }
    else if (type == 'info') {
        errorIconDiv.innerHTML = `
        <svg class="infoIconSvg" viewBox="0 0 416.979 416.979">
            <path d="M356.004,61.156c-81.37-81.47-213.377-81.551-294.848-0.182c-81.47,81.371-81.552,213.379-0.181,294.85
                c81.369,81.47,213.378,81.551,294.849,0.181C437.293,274.636,437.375,142.626,356.004,61.156z M237.6,340.786
                c0,3.217-2.607,5.822-5.822,5.822h-46.576c-3.215,0-5.822-2.605-5.822-5.822V167.885c0-3.217,2.607-5.822,5.822-5.822h46.576
                c3.215,0,5.822,2.604,5.822,5.822V340.786z M208.49,137.901c-18.618,0-33.766-15.146-33.766-33.765
                c0-18.617,15.147-33.766,33.766-33.766c18.619,0,33.766,15.148,33.766,33.766C242.256,122.755,227.107,137.901,208.49,137.901z"/>
        </svg>
        `;
        errorProgressBar.classList.add('infoColor');
    }
    // Automatically remove notification after the duration
    const timeoutIdUp = setTimeout(() => {
        errorMsgDisplay.classList.add('upRightFadeOut');
        setTimeout(() => {
            errorMsgDisplay.remove();
            errorMsgNotificationTimeouts.shift();
        }, 500);
    }, duration);

    errorMsgNotificationTimeouts.push(timeoutIdUp);

}

function closePreview() {
  const preview = document.querySelector(".preview-window");
  if (preview) preview.remove();
}

/* -------------------RIGHT CLICK MENU---------------- */

// Hide menu on click anywhere
document.addEventListener("click", () => {
  rightClickMenu.style.display = "none";
});

// Prevent default context menu
document.addEventListener("contextmenu", e => {
  if (!e.target.closest(".file-item")) {
    rightClickMenu.style.display = "none";
  }
});
function attachContextMenu(div, fileData) {
  div.addEventListener("contextmenu", e => {
    e.preventDefault();

    currentFile = fileData;

    rightClickMenuFile.textContent = truncatePath(fileData.name, 20);

    rightClickMenu.style.display = "block";

    const menuHeight = rightClickMenu.offsetHeight;
    const menuWidth = rightClickMenu.offsetWidth;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = e.clientY; // relative to viewport
    let left = e.clientX;

    // Flip up if overflowing bottom
    if (top + menuHeight > viewportHeight) {
      top = viewportHeight - menuHeight;
    }

    // Flip left if overflowing right
    if (left + menuWidth > viewportWidth) {
      left = viewportWidth - menuWidth;
    }

    // Make sure we don't go negative
    if (top < 0) top = 0;
    if (left < 0) left = 0;

    rightClickMenu.style.top = `${top}px`;
    rightClickMenu.style.left = `${left}px`;
  });
}
// Handle menu item clicks
document.querySelectorAll("#rightClickMenu .rightClickMenuItem").forEach(item =>  {
  item.addEventListener("click", async () => {
    if (!currentFile) return;

    const action = item.textContent.trim();

    switch (action) {
      case "Select File": {
        // Find the file-item that matches the current file
        const fileItem = [...document.querySelectorAll(".file-item")]
          .find(el => {
            const span = el.querySelector(".file-label");
            return span && span.dataset.path === currentFile.path;
          });

        if (fileItem) {
          const checkbox = fileItem.querySelector("input[type='checkbox']");
          if (checkbox) {
            checkbox.checked = !checkbox.checked; // toggle selection
            checkbox.dispatchEvent(new Event("change")); // trigger your update logic
          }
        }
        break;
      }

      case "Open File":
        window.api.openFile(currentFile.path);
        break;

      case "Open Folder":
        window.api.openFolder(currentFile.path);
        break;

      case "Show Preview":
        showPreview(currentFile);
        break;

      case "Delete File": {
        const confirmDelete = await confirmDlg(`Are you sure you want to delete "${currentFile.name}"? It will be moved to trash.`);
        if (!confirmDelete) return;
        // Delete immediately
        window.api.deleteFiles([currentFile.path]).then(() => {
          // Remove file from duplicateGroups
          duplicateGroups.forEach((group, gIndex) => {
            duplicateGroups[gIndex] = group.filter(f => f.path !== currentFile.path);
          });

          // Remove from DOM
          const checkbox = resultsDiv.querySelector(
            `input[type=checkbox][value="${currentFile.path.replace(/\\/g,'\\\\')}"]`
          );
          if (checkbox) {
            const parentDiv = checkbox.closest('.file-item');
            const groupDiv = parentDiv.closest('.group');

            // Remove file-item from DOM
            parentDiv.remove();

            // 🔹 If this group has 1 or 0 items left → remove it
            if (groupDiv && groupDiv.querySelectorAll('.file-item').length <= 1) {
              groupDiv.remove();

              // Also remove group from duplicateGroups array
              duplicateGroups = duplicateGroups.filter(g => g.length > 1);
            }
          }
        });

        break;
      }

      case "Close":
        rightClickMenu.style.display = "none";
        break;
    }

    // Always hide menu after an action
    rightClickMenu.style.display = "none";
  });
});

/* -=-=-=-=-HASH SIZE SEARCH SETTINGS=-=-=-=-=-=- */

// Function to toggle visibility
function updateCustomInputVisibility() {
  if (hashModeSelect.value === "custom") {
    customHashKB.style.display = "inline-block";
  } 
  else {
    customHashKB.style.display = "none";
  }
}

// Save on change
hashModeSelect.addEventListener("change", () => {
  const value = hashModeSelect.value;

  updateCustomInputVisibility();

  updateHashInfo();

  // If it's "custom", also save the custom KB value
  if (value === "custom") {
    const kb = parseInt(customHashKB.value, 10) || 800;
    localStorage.setItem("hashMode", JSON.stringify({ mode: value, kb }));
    const kvalue = localStorage.getItem("hashMode");
    const parsed = JSON.parse(kvalue);
    customHashKB.value = parsed.kb;
  } 
  else {
    localStorage.setItem("hashMode", JSON.stringify({ mode: value }));
  }

});

customHashKB.addEventListener("input", () => {
  if (hashModeSelect.value === "custom") {
    const kb = parseInt(customHashKB.value, 10) || 800;
    localStorage.setItem("hashMode", JSON.stringify({ mode: "custom", kb }));
    customHashKB.value = parsed.kb;
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("hashMode");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      hashModeSelect.value = parsed.mode || "full";
      if (parsed.mode === "custom" && parsed.kb) {
        customHashKB.value = parsed.kb;
      }
    } catch (err) {
      console.error("Failed to load saved hash mode:", err);
      hashModeSelect.value = "full";
    }
  } 
  else {
    hashModeSelect.value = "full"; // Default
  }
  // Apply visibility according to current selection
  updateCustomInputVisibility();

  updateHashInfo();
});

function updateHashInfo() {
  const mode = hashModeSelect.value;
  switch(mode) {
    case '4kb':
      dynamicHashInfo.textContent = 'Very fast scan, may miss some duplicates.';
      customHashKB.style.display = 'none';
      break;
    case '8kb':
      dynamicHashInfo.textContent = 'Fast scan, reasonably accurate.';
      customHashKB.style.display = 'none';
      break;
    case '16kb':
      dynamicHashInfo.textContent = 'Moderate speed, good accuracy.';
      customHashKB.style.display = 'none';
      break;
    case 'balanced':
      dynamicHashInfo.textContent = 'Balanced speed and accuracy based on file size.';
      customHashKB.style.display = 'none';
      break;
    case 'full':
      dynamicHashInfo.textContent = 'Slower scan, but perfect accuracy detection.';
      customHashKB.style.display = 'none';
      break;
    case 'custom':
      dynamicHashInfo.textContent = 'Specify a custom value for scanning. Higher = slower but more accurate.';
      customHashKB.style.display = 'inline-block';
      break;
    default:
      dynamicHashInfo.textContent = '';
      customHashKB.style.display = 'none';
  }
}

// Update on page load
updateHashInfo();

generalTab.addEventListener('click', function () {
    generalTab.classList.add('tabactive');
    hashSearchTab.classList.remove('tabactive');
    ignoreTab.classList.remove('tabactive');

    generalContentDiv.classList.remove('hidden');
    hashContentDiv.classList.add('hidden');
    ignoreContentDiv.classList.add('hidden');
});
hashSearchTab.addEventListener('click', function () {
    hashSearchTab.classList.add('tabactive');
    generalTab.classList.remove('tabactive');
    ignoreTab.classList.remove('tabactive');

    hashContentDiv.classList.remove('hidden');
    generalContentDiv.classList.add('hidden');
    ignoreContentDiv.classList.add('hidden');
});
ignoreTab.addEventListener('click', function () {
    ignoreTab.classList.add('tabactive');
    hashSearchTab.classList.remove('tabactive');
    generalTab.classList.remove('tabactive');

    ignoreContentDiv.classList.remove('hidden');
    hashContentDiv.classList.add('hidden');
    generalContentDiv.classList.add('hidden');
});

/* generalTab.click(); */

function formatDuration(seconds) {
  seconds = Math.floor(seconds); // ignore fractions for display

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  let parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(" ");
}

const floatingDeleteBtn = document.getElementById("floatingDeleteBtn");

let controlsVisible = true;

// 🔹 Watch if #controls is on screen
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    controlsVisible = entry.isIntersecting;
    updateDeleteButtons(); // re-check which button should show
  });
}, { threshold: 0.1 });

observer.observe(controls);

// 🔹 Show/hide delete buttons based on state
function updateDeleteButtons() {
  const selectedCount = resultsDiv.querySelectorAll("input[type='checkbox']:checked").length;
  delSelected.textContent = selectedCount;

  if (controlsVisible) {
    // Top controls visible → show top delete, hide floating
    deleteBtn.style.display = "inline-block";
    deleteBtn.disabled = selectedCount === 0;
    floatingDeleteBtn.classList.remove("show");
  } 
  else {
    // Top controls hidden → hide top delete, show floating if something is selected
    deleteBtn.style.display = "none";
    if (selectedCount > 0) {
      floatingDeleteBtn.classList.add("show");
    } 
    else {
      floatingDeleteBtn.classList.remove("show");
    }
  }
}
// 🔹 Clicking floating button = trigger normal delete
floatingDeleteBtn.addEventListener("click", () => {
  deleteBtn.click();
});

/* =-=-=BACK TO TOP BUTTON SETTINGS-=-=-=-= */

// Check if blinkEnabled exists in LocalStorage
if (localStorage.getItem('blinkEnabled') === null) {
  localStorage.setItem('blinkEnabled', 'true'); // Default to enabled
}

const flashTaskbar = document.getElementById('flashTaskbar');

// Initialize the checkbox based on stored value
flashTaskbar.checked = localStorage.getItem('blinkEnabled') === 'true';

// Update the stored value whenever the user toggles it
flashTaskbar.addEventListener('change', () => {
  localStorage.setItem('blinkEnabled', flashTaskbar.checked);
});

const backToTopBtn = document.getElementById('backToTopBtn');

// Initialize setting if missing
if (localStorage.getItem('backToTopEnabled') === null) {
  localStorage.setItem('backToTopEnabled', 'true'); // Default ON
}

// Sync checkbox with stored setting
backToTopBtn.checked = localStorage.getItem('backToTopEnabled') === 'true';

// Save whenever user toggles
backToTopBtn.addEventListener('change', () => {
  localStorage.setItem('backToTopEnabled', backToTopBtn.checked);

  // Optional: instantly show/hide the Back-To-Top button
  const btn = document.getElementById('backToTop');
  if (btn) btn.style.display = backToTopBtn.checked ? 'block' : 'none';
});

/* =-=-=SORTING SETTINGS-=-=-=-= */

// 🔹 Handle item click mode (Open Preview / Select Item)
const itemClickRadios = document.querySelectorAll('input[name="itemClick"]');

// If first time opening the app, set default to 'openPreview'
if (!localStorage.getItem('itemClickMode')) {
  localStorage.setItem('itemClickMode', 'openPreview');
}

// Load saved setting and update the radios
const savedItemClick = localStorage.getItem('itemClickMode');
itemClickRadios.forEach(radio => {
  radio.checked = (radio.value === savedItemClick);

  radio.addEventListener('change', () => {
    if (radio.checked) {
      localStorage.setItem('itemClickMode', radio.value);
    }
  });
});

// Helper to get current click mode
function getItemClickMode() {
  return localStorage.getItem('itemClickMode') || 'openPreview';
}

/* DISPLAY ITEM LIST TIME */

// 🔹 Handle which time to display (Modified / Creation)
const displayTimeRadios = document.querySelectorAll('input[name="displayItemList"]');

// If first time opening the app, set default to 'modTime'
if (!localStorage.getItem('displayTimeMode')) {
  localStorage.setItem('displayTimeMode', 'modTime');
}

// Load saved setting and update radios
const savedDisplayTime = localStorage.getItem('displayTimeMode');
displayTimeRadios.forEach(radio => {
  radio.checked = (radio.value === savedDisplayTime);

  radio.addEventListener('change', () => {
    if (radio.checked) {
      localStorage.setItem('displayTimeMode', radio.value);
    }
  });
});

// Helper to get current display time mode
function getDisplayTimeMode() {
  return localStorage.getItem('displayTimeMode') || 'modTime';
}


/* SEARCH IGNORE SMALL/BIG SETTING */

ignoreSmallCheck.checked = savedIgnoreSmall;
ignoreSmallInput.value = savedIgnoreSmallValue;
ignoreLargeCheck.checked = savedIgnoreLarge;
ignoreLargeInput.value = savedIgnoreLargeValue;

// Load settings from localStorage or set defaults
if (localStorage.getItem('ignoreSmallEnabled') === null) {
  localStorage.setItem('ignoreSmallEnabled', 'false');
  localStorage.setItem('ignoreSmallValue', '10'); // 10 KB default
  ignoreSmallInput.value = 10;
}

if (localStorage.getItem('ignoreLargeEnabled') === null) {
  localStorage.setItem('ignoreLargeEnabled', 'false');
  localStorage.setItem('ignoreLargeValue', '500'); // 500 MB default
  ignoreLargeInput.value = 500;
}

// --- Save settings on change ---
ignoreSmallCheck.addEventListener('change', () => {
  localStorage.setItem('ignoreSmallEnabled', ignoreSmallCheck.checked);
});

ignoreSmallInput.addEventListener('input', () => {
  localStorage.setItem('ignoreSmallValue', ignoreSmallInput.value);
});

ignoreLargeCheck.addEventListener('change', () => {
  localStorage.setItem('ignoreLargeEnabled', ignoreLargeCheck.checked);
});

ignoreLargeInput.addEventListener('input', () => {
  localStorage.setItem('ignoreLargeValue', ignoreLargeInput.value);
});

function getIgnoreSettings() {
  return {
    ignoreSmallEnabled: localStorage.getItem('ignoreSmallEnabled') === 'true',
    ignoreSmallValue: parseFloat(localStorage.getItem('ignoreSmallValue') || 10),
    ignoreLargeEnabled: localStorage.getItem('ignoreLargeEnabled') === 'true',
    ignoreLargeValue: parseFloat(localStorage.getItem('ignoreLargeValue') || 500),
    excludeLinks: excludeLinksCheckbox.checked,
    ignorePatterns: ignorePatterns, // still strings
    pLimit: parseInt(localStorage.getItem('pLimit') || 50)
  };
}

/* SEARCH EXCLUDE LINKS */

// Load saved state on app start
excludeLinksCheckbox.checked = localStorage.getItem('excludeLinks') === 'true';

// Save when toggled
excludeLinksCheckbox.addEventListener('change', () => {
  localStorage.setItem('excludeLinks', excludeLinksCheckbox.checked);
});

/* IGNORE LIST */
const ignoreList = document.getElementById('ignoreList');
const addIgnoreBtn = document.getElementById('addIgnoreBtn');
const clearIgnoreBtn = document.getElementById('clearIgnoreBtn');

// Render ignore list
function renderIgnoreList() {
  ignoreList.innerHTML = '';
  ignorePatterns.forEach((pattern, index) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = pattern.toString();

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✖';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', () => {
      ignorePatterns.splice(index, 1);
      saveIgnoreList();
      renderIgnoreList();
    });

    li.appendChild(span);
    li.appendChild(removeBtn);
    ignoreList.appendChild(li);
  });
}

// Add new regex
addIgnoreBtn.addEventListener('click', async () => {
  openInputDlg();
});

// Clear all
clearIgnoreBtn.addEventListener('click', async () => {
  const confirmed = await confirmDlg(`Clear all ignore patterns?`);
  if (!confirmed) return;
    ignorePatterns = [];
    saveIgnoreList();
    renderIgnoreList();
});

// --- Grab elements ---
const inputDlg = document.getElementById("inputDlg");
const inputDlgTitle = document.getElementById("inputDlg_Title");
const inputDlgInput = document.getElementById("inputDlgInput");
const inputDlgBtns = inputDlg.querySelectorAll(".inputDlgBtns button");

// --- Show the dialog ---
function openInputDlg() {
  inputDlgInput.value = "";
  inputDlg.style.display = "block";
  setTimeout(() => inputDlgInput.focus(), 100); // focus input
  setTimeout(() => inputDlgInput.select(), 200); // focus input
}

// --- Hide the dialog ---
document.getElementById("inputDlgCloseBtn").onclick = () => {
  inputDlg.style.display = "none";
};
document.getElementById("inputDlgOk").onclick = () => {
  const value = inputDlgInput.value.trim();

  try {
    if (!value.startsWith('/') || value.lastIndexOf('/') <= 0) throw new Error('Invalid regex format');
    const lastSlash = value.lastIndexOf('/');
    const body = value.slice(1, lastSlash);
    const flags = value.slice(lastSlash + 1);
    const regex = new RegExp(body, flags);

    ignorePatterns.push(regex);
    saveIgnoreList();
    renderIgnoreList();
    inputDlg.style.display = "none";

  } 
  catch (err) {
    alert('Invalid regex:\n' + err.message);
  }

};
document.getElementById("inputDlgCancel").onclick = () => {
  inputDlg.style.display = "none";
};

// Optional: handle Enter / Escape keys
inputDlgInput.onkeydown = (e) => {
  if (e.key === "Enter") inputDlgBtns[0].onclick();
  else if (e.key === "Escape") inputDlgBtns[1].onclick();
};

function saveIgnoreList() {
  const arr = ignorePatterns.map(r => r instanceof RegExp ? r.toString() : r);
  localStorage.setItem('ignorePatterns', JSON.stringify(arr));
}

function loadIgnoreList() {
  const stored = localStorage.getItem('ignorePatterns');
  if (!stored) {
    ignorePatterns = [...defaultIgnorePatterns];
    saveIgnoreList();
    return;
  }

  ignorePatterns = JSON.parse(stored).map(s => {
    if (typeof s === 'string' && s.startsWith('/') && s.lastIndexOf('/') > 0) {
      const lastSlash = s.lastIndexOf('/');
      const body = s.slice(1, lastSlash);
      const flags = s.slice(lastSlash + 1);
      try { return new RegExp(body, flags); } catch { return null; }
    }
    return null;
  }).filter(r => r !== null);
}
// Restore Defaults button
const restoreDefaultsBtn = document.getElementById('restoreDefaultsBtn');

restoreDefaultsBtn.addEventListener('click', async () => {
  //if (confirm('Restore default ignore patterns?')) {
  const confirmed = await confirmDlg(`Restore default ignore patterns?`);
  if (!confirmed) return;

    ignorePatterns = [...defaultIgnorePatterns];
    saveIgnoreList();
    renderIgnoreList();
  //}
});

// Initial load
loadIgnoreList();
renderIgnoreList();

function confirmDlg(message) {
  return new Promise((resolve) => {
    const dlg = document.getElementById('confirmDlg');
    const text = document.getElementById('confirmText');
    const ok = document.getElementById('confirmOk');
    const cancel = document.getElementById('confirmCancel');
    const closeBtn = document.getElementById('confirmDlgCloseBtn');

    text.textContent = message;
    dlg.style.display = 'block';
    setTimeout(() => ok.focus(), 0);

    const cleanup = (result) => {
      dlg.style.display = 'none';
      ok.onclick = cancel.onclick = closeBtn.onclick = null;
      resolve(result);
    };

    ok.onclick = () => cleanup(true);
    cancel.onclick = () => cleanup(false);
    closeBtn.onclick = () => cleanup(false);

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}

/* SETTINGS START MAXIMIZED */

document.getElementById('startMaximized').addEventListener('change', async (e) => {
  await window.api.setSetting('startMaximized', e.target.checked);
});

window.addEventListener('DOMContentLoaded', async () => {
  const startMaximized = await window.api.getSetting('startMaximized');
  document.getElementById('startMaximized').checked = !!startMaximized;
});

//--------------------ABOUT-----------------

const copyIcon = document.getElementById("copyIcon");
copyIcon.onclick = function() {
  const textToCopy = "coolnewtabpage@gmail.com";
  copyToClipboard(textToCopy);
}
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    //console.log("Copied to clipboard!");
  } 
  catch (err) {
    //console.error("Failed to copy text:", err);
  }
}

const helpGithub = document.getElementById('helpGithub');
helpGithub.onclick = () => {
  window.api.openExternal("https://github.com/hudsonpear");
};

// ----- SELECT MENU / SELECTION MENU-------------

function clearAllSelections() {
  const allBoxes = resultsDiv.querySelectorAll('input[type="checkbox"]');
  allBoxes.forEach(cb => {
    cb.checked = false;
    cb.closest(".file-item")?.classList.remove("selected");
  });
  delSelected.innerText = `0`;
  deleteBtn.disabled = true;
}

function selectFileItem(file) {
  const checkbox = resultsDiv.querySelector(
    `input[type="checkbox"][value="${file.path.replace(/\\/g, '\\\\')}"]`
  );
  if (checkbox) {
    checkbox.checked = true;
    checkbox.closest(".file-item")?.classList.add("selected");
  }
}

function updateSelectionCount(count) {
  delSelected.innerText = `${count}`;
  deleteBtn.disabled = count === 0;
  updateDeleteButtons?.();
}

// 🔹 HANDLE MENU OPTION CLICKS
selectDropdown.addEventListener('click', (e) => {
  const option = e.target.closest('.selectOption');
  if (!option) return;

  const action = option.dataset.select;
  selectDropdown.style.display = 'none'; // close after selecting

  switch (action) {
    // ==========================================================
    // 🔹 Select Duplicated
    // ==========================================================
    case 'seldup': {
      if (!duplicateGroups || !duplicateGroups.length) {
        return showErrorMsg('error', "No duplicates to select.", 5000);
      }

      clearAllSelections();
      
      let selectedCount = 0;

      if (!duplicatesSelected) {
        // Select all duplicates except the first in each group
        duplicateGroups.forEach(group => {
          group.forEach((file, index) => {
            if (index === 0) return; // skip first item

            const checkbox = resultsDiv.querySelector(
              `input[type="checkbox"][value="${file.path.replace(/\\/g, '\\\\')}"]`
            );

            if (checkbox && !checkbox.checked) {
              checkbox.checked = true;
              checkbox.closest(".file-item")?.classList.add("selected");
              selectedCount++;
            }
          });
        });

        delSelected.innerText = `${selectedCount}`;
        deleteBtn.disabled = selectedCount === 0;
        duplicatesSelected = true;
      } 
      else {
        // Deselect all
        const allBoxes = resultsDiv.querySelectorAll('input[type="checkbox"]');
        allBoxes.forEach(cb => {
          cb.checked = false;
          cb.closest(".file-item")?.classList.remove("selected");
        });

        delSelected.innerText = `0`;
        deleteBtn.disabled = true;
        duplicatesSelected = false;
      }
      break;
    }

    // ==========================================================
    // 🔹 Select Biggest
    // ==========================================================
    case 'selbig':
      console.log("TODO: Select the biggest file in each duplicate group");
      showErrorMsg('info', "Select biggest size - not implemented yet.", 3000);
      break;

    // ==========================================================
    // 🔹 Select Smallest
    // ==========================================================
    case 'selsmall':
      console.log("TODO: Select the smallest file in each duplicate group");
      showErrorMsg('info', "Select smallest size - not implemented yet.", 3000);
      break;

    // ==========================================================
    // 🔹 Select Newest CREATION TIME
    // ==========================================================
    case 'selnew_ctime':
      if (!duplicateGroups?.length) return showErrorMsg('error', "No duplicates to select.", 3000);

      clearAllSelections();

      let selectedCount = 0;

      for (const group of duplicateGroups) {
        if (group.length < 2) continue;

        let newest = group[0];
        for (const file of group) {
          const fileTime = new Date(file.ctime);
          const newestTime = new Date(newest.ctime);
          if (fileTime > newestTime) newest = file;
        }

        selectFileItem(newest);
        selectedCount++;
      }

      updateSelectionCount(selectedCount);
      showErrorMsg('info', `Selected ${selectedCount} newest by creation time.`, 3000);
      break;

    // ==========================================================
    // 🔹 Select Oldest CREATION TIME
    // ==========================================================
    case 'selold_ctime':
      if (!duplicateGroups?.length) return showErrorMsg('error', "No duplicates to select.", 3000);

      clearAllSelections();

      let selectedCountOldCtime = 0;

      for (const group of duplicateGroups) {
        if (group.length < 2) continue;

        let oldest = group[0];
        for (const file of group) {
          const fileTime = new Date(file.ctime);
          const oldestTime = new Date(oldest.ctime);
          if (fileTime < oldestTime) oldest = file;
        }

        selectFileItem(oldest);
        selectedCountOldCtime++;
      }

      updateSelectionCount(selectedCountOldCtime);
      showErrorMsg('info', `Selected ${selectedCountOldCtime} oldest by creation time.`, 3000);
      break;

    // ==========================================================
    // 🔹 Select Newest MODIFIED TIME
    // ==========================================================
    case 'selnew_mtime':
      if (!duplicateGroups?.length) return showErrorMsg('error', "No duplicates to select.", 3000);

      clearAllSelections();

      let selectedCountnewMtime = 0;

      for (const group of duplicateGroups) {
        if (group.length < 2) continue;

        let newest = group[0];
        for (const file of group) {
          const fileTime = new Date(file.mtime);
          const newestTime = new Date(newest.mtime);
          if (fileTime > newestTime) newest = file;
        }

        selectFileItem(newest);
        selectedCountnewMtime++;
      }

      updateSelectionCount(selectedCountnewMtime);
      showErrorMsg('info', `Selected ${selectedCountnewMtime} newest by modified time.`, 3000);
      break;

    // ==========================================================
    // 🔹 Select Oldest MODIFIED TIME
    // ==========================================================
    case 'selold_mtime':
      if (!duplicateGroups?.length) return showErrorMsg('error', "No duplicates to select.", 3000);

      clearAllSelections();

      let selectedCountoldMtime = 0;

      for (const group of duplicateGroups) {
        if (group.length < 2) continue;

        let oldest = group[0];
        for (const file of group) {
          const fileTime = new Date(file.mtime);
          const oldestTime = new Date(oldest.mtime);
          if (fileTime < oldestTime) oldest = file;
        }

        selectFileItem(oldest);
        selectedCountoldMtime++;
      }

      updateSelectionCount(selectedCountoldMtime);
      showErrorMsg('info', `Selected ${selectedCountoldMtime} oldest by modified time.`, 3000);
      break;

    // ==========================================================
    // 🔹 Invert Selection
    // ==========================================================
    case 'selinv': {
      const checkboxes = resultsDiv.querySelectorAll('input[type="checkbox"]');
      let selectedCount = 0;
      checkboxes.forEach(cb => {
        cb.checked = !cb.checked;
        cb.closest(".file-item")?.classList.toggle("selected", cb.checked);
        if (cb.checked) selectedCount++;
      });
      delSelected.innerText = `${selectedCount}`;
      deleteBtn.disabled = selectedCount === 0;
      break;
    }

    // ==========================================================
    // 🔹 Select All
    // ==========================================================
    case 'selall': {
      const checkboxes = resultsDiv.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => {
        cb.checked = true;
        cb.closest(".file-item")?.classList.add("selected");
      });
      delSelected.innerText = `${checkboxes.length}`;
      deleteBtn.disabled = checkboxes.length === 0;
      break;
    }

    // ==========================================================
    // 🔹 Unselect All
    // ==========================================================
    case 'unsel': {
      const checkboxes = resultsDiv.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => {
        cb.checked = false;
        cb.closest(".file-item")?.classList.remove("selected");
      });
      delSelected.innerText = `0`;
      deleteBtn.disabled = true;
      break;
    }

    default:
      console.warn("Unknown select action:", action);
  }
});

const pLimitInput = document.getElementById('pLimitInput');
const MAX_PLIMIT = 9999999;

// Load saved value or default to 50
const savedLimit = parseInt(localStorage.getItem('pLimit')) || 50;
pLimitInput.value = Math.max(1, savedLimit);

// Save valid values as the user types
pLimitInput.addEventListener('input', () => {
  localStorage.setItem('pLimit', pLimitInput.value);
});

// Validate when user leaves the field
pLimitInput.addEventListener('blur', () => {
  let value = parseInt(pLimitInput.value);

  if (isNaN(value) || value < 1) value = 1;
  else if (value > MAX_PLIMIT) value = MAX_PLIMIT;

  pLimitInput.value = value;
  localStorage.setItem('pLimit', value);
});















































































/* =-=-=-=-=-=-=-=-=-=-=-=CANCEL SCAN=-=-=-=-=-=-=-=-=-=-=-= */

window.api.onScanCancelled(() => {
  // Reset UI
  resultsDiv.innerHTML = "";
  scanTimeDiv.textContent = ``;
  scanPercent.style.display = 'block';
  scanPercent.textContent = "Scan cancelled.";
  scanStatus.textContent = '';

  cancelBtn.disabled = true;
  scanBtn.disabled = false;
  scanBtn.innerHTML = '🔍 Start Scan';

  progressFill.style.width = `0%`;
  progressBar.style.display = 'none';
});

// Cancel click
cancelBtn.addEventListener("click", async () => {
  if (!cancelBtn.disabled) {
    await window.api.cancelScan();
  }
});


// Progress updates
window.api.onScanProgress(({ scanned, total }) => {
  cancelBtn.disabled = false;
  scanBtn.disabled = true;
  scanBtn.innerHTML = '⏳ Scanning...';

  const percent = Math.round((scanned / total) * 100);
  scanPercent.textContent = `Scanning Files... ${percent}% (${scanned}/${total})`;

  progressBar.style.display = 'block';
  scanPercent.style.display = 'block';
  scanStatus.textContent = '';

  progressFill.style.width = `${percent}%`;
});

window.api.onScanComplete(({ duration, scanned, total }) => {
  cancelBtn.disabled = true;
  scanBtn.disabled = false;
  scanBtn.innerHTML = '🔍 Start Scan';

  scanPercent.textContent = `Scanned: ${scanned}/${total}`;
  scanTimeDiv.textContent = `Scan completed in ${duration.toFixed(2)} seconds`;
  scanPercent.style.display = 'none';
  progressBar.style.display = 'none';

  document.getElementById("panel").style.display = "block";
  totalScan.textContent = `${scanned}`;
  totalScanTime.textContent = formatDuration(duration);

});

window.api.onScanErrors((errors) => {
  if (errors && errors.length > 0) {
    const message = errors.slice(0, 10).join('\n');
    showErrorMsg(
      'att', 
      `Some folders or files could not be scanned due to permission issues:\n\n${message}\n\n` +
      (errors.length > 10 ? `...and ${errors.length - 10} more.` : ''), 5000);
  }
});

window.api.onScanCancelError( async (error)  => {
  if (error) {
    showErrorMsg('att', `❌ Scan failed: ${error}`, 5000);
  }
  await window.api.cancelScan();
});

window.api.onOpenSettings(() => {
  settingsWindow.style.display = 'block';
});

window.api.onOpenAbout(() => {
  aboutWindow.style.display = 'block';
});
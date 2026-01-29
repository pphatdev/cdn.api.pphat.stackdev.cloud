// API Base URL
const API_BASE = '/api';

// Current folder path
let currentPath = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    setupRouting();
    setupFileUpload();
    setupImageUpload();
    setupSearch();
    setupOptimize();
    setupModals();
    loadVersion();

    // Initialize route on page load
    handleRoute();
});

// Load application version
async function loadVersion() {
    try {
        const response = await fetch(`${API_BASE}/version`);
        const data = await response.json();
        console.log('Version API response:', data);

        if (data.result && data.result.version) {
            document.getElementById('app-version').textContent = `v${data.result.version}`;
        } else if (data.data && data.data.version) {
            document.getElementById('app-version').textContent = `v${data.data.version}`;
        } else {
            document.getElementById('app-version').textContent = 'v1.0.0';
        }
    } catch (error) {
        console.error('Failed to load version:', error);
        document.getElementById('app-version').textContent = 'v1.0.0';
    }
}

// Route Management
function setupRouting() {
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
        handleRoute();
    });

    // Handle navigation clicks
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.getAttribute('href');
            navigateTo(route);
        });
    });
}

function navigateTo(path) {
    // Update browser history
    history.pushState(null, '', path);
    // Handle the route
    handleRoute();
}

function handleRoute() {
    // Get current route from pathname, default to '/dashboard'
    let route = window.location.pathname.slice(1) || 'dashboard';

    // Handle root path
    if (route === '' || route === '/') {
        route = 'dashboard';
        history.replaceState(null, '', '/dashboard');
    }

    // Validate route exists
    const validRoutes = ['dashboard', 'upload', 'browse', 'search', 'optimize'];
    if (!validRoutes.includes(route)) {
        route = 'dashboard';
        history.replaceState(null, '', '/dashboard');
    }

    // Update active navigation item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.dataset.route === route) {
            item.classList.add('active', 'bg-white/15', 'text-white', 'font-semibold');
            item.classList.remove('text-white/80');
            item.style.borderLeft = '4px solid white';
        } else {
            item.classList.remove('active', 'bg-white/15', 'text-white', 'font-semibold');
            item.classList.add('text-white/80');
            item.style.borderLeft = 'none';
        }
    });

    // Show active content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        if (content.dataset.route === route) {
            content.classList.remove('hidden');
            content.classList.add('block');
        } else {
            content.classList.add('hidden');
            content.classList.remove('block');
        }
    });

    // Load data for specific routes
    if (route === 'browse') {
        loadFolderStructure(currentPath);
    } else if (route === 'dashboard') {
        loadDashboard();
    }

    // Update page title
    const routeTitles = {
        dashboard: 'Dashboard - Asset Management',
        upload: 'Upload - Asset Management',
        browse: 'Browse - Asset Management',
        search: 'Search - Asset Management',
        optimize: 'Optimize - Asset Management'
    };
    document.title = routeTitles[route] || 'Asset Management System';
}

// File Upload
function setupFileUpload() {
    const form = document.getElementById('file-upload-form');
    const fileInput = document.getElementById('file-input');
    const statusDiv = document.getElementById('file-upload-status');
    const previewDiv = document.getElementById('upload-preview');

    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        previewDiv.innerHTML = '';

        if (files.length > 0) {
            previewDiv.innerHTML = `<p><strong>${files.length}</strong> file(s) selected</p>`;
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const files = fileInput.files;
        if (files.length === 0) {
            showStatus(statusDiv, 'Please select files to upload', 'error');
            return;
        }

        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        const storagePath = document.getElementById('storage-path').value;
        const filePrefix = document.getElementById('file-prefix').value;

        try {
            showStatus(statusDiv, 'Uploading...', 'success');

            const headers = {};
            if (storagePath) headers['storage'] = storagePath;
            if (filePrefix) headers['X-Prefix'] = filePrefix;

            const response = await fetch(`${API_BASE}/file/upload`, {
                method: 'POST',
                body: formData,
                headers: headers
            });

            const data = await response.json();

            if (response.ok) {
                showStatus(statusDiv, `Successfully uploaded ${files.length} file(s)!`, 'success');
                form.reset();
                previewDiv.innerHTML = '';
            } else {
                showStatus(statusDiv, `Upload failed: ${data.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            showStatus(statusDiv, `Upload failed: ${error.message}`, 'error');
        }
    });
}

// Image Upload
function setupImageUpload() {
    const form = document.getElementById('image-upload-form');
    const imageInput = document.getElementById('image-input');
    const statusDiv = document.getElementById('image-upload-status');
    const previewDiv = document.getElementById('upload-preview');

    imageInput.addEventListener('change', () => {
        const files = imageInput.files;
        previewDiv.innerHTML = '';

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'preview-item';
                div.innerHTML = `<img src="${e.target.result}" alt="${file.name}">`;
                previewDiv.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const files = imageInput.files;
        if (files.length === 0) {
            showStatus(statusDiv, 'Please select images to upload', 'error');
            return;
        }

        const formData = new FormData();
        for (let file of files) {
            formData.append('images', file);
        }

        try {
            showStatus(statusDiv, 'Uploading...', 'success');

            const response = await fetch(`${API_BASE}/image/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showStatus(statusDiv, `Successfully uploaded ${files.length} image(s)!`, 'success');
                form.reset();
                previewDiv.innerHTML = '';
            } else {
                showStatus(statusDiv, `Upload failed: ${data.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            showStatus(statusDiv, `Upload failed: ${error.message}`, 'error');
        }
    });
}

// Browse Folders
async function loadFolderStructure(path) {
    const contentDiv = document.getElementById('folder-content');
    const breadcrumb = document.querySelector('.breadcrumb');

    contentDiv.innerHTML = '<div class="loader">Loading...</div>';

    try {
        const url = path ? `${API_BASE}/folder/${path}` : `${API_BASE}/folder`;
        console.log('Loading folder:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('Response:', data);

        if (response.ok && data.result) {
            currentPath = path;
            updateBreadcrumb(path);
            displayFolderContent(data.result);
        } else {
            const errorMsg = data.message || 'Failed to load folder structure';
            contentDiv.innerHTML = `<p style="color: red; padding: 20px;">❌ ${errorMsg}</p>`;
            console.error('Failed to load:', data);
        }
    } catch (error) {
        contentDiv.innerHTML = `<p style="color: red; padding: 20px;">❌ Error: ${error.message}<br><small>Check console for details</small></p>`;
        console.error('Error loading folder:', error);
    }
}

function updateBreadcrumb(path) {
    const breadcrumb = document.querySelector('.breadcrumb');
    const parts = path ? path.split('/').filter(p => p) : [];

    let html = `<span class="breadcrumb-item flex items-center gap-1 cursor-pointer hover:text-orange-600" data-path="">
        <svg viewBox="0 0 24 24" fill="currentColor" class="size-5">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" />
        </svg>
        <span class="pb-0.5">storage</span>
    </span>`;

    let currentPath = '';
    parts.forEach(part => {
        currentPath += (currentPath ? '/' : '') + part;
        html += `<span class="text-gray-400 mx-0.5">/</span><span class="breadcrumb-item flex items-center gap-1 cursor-pointer hover:text-orange-600" data-path="${currentPath}">
            <svg viewBox="0 0 24 24" fill="currentColor" class="size-5">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" />
            </svg><span class="pb-0.5">${part}</span>
        </span>`;
    });

    breadcrumb.innerHTML = html;

    // Add click handlers to breadcrumb items
    breadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
        item.addEventListener('click', () => {
            loadFolderStructure(item.dataset.path);
        });
    });
}

function displayFolderContent(content) {
    const contentDiv = document.getElementById('folder-content');

    // Handle array response from API
    if (!Array.isArray(content) || content.length === 0) {
        contentDiv.innerHTML = '<p class="col-span-full text-center py-10 text-gray-500">This folder is empty</p>';
        return;
    }

    let html = '';

    // Flatten the structure - separate folders and files at current level only
    const folders = content.filter(item => item.type === 'folder');
    const files = content.filter(item => item.type === 'file');

    // Display folders
    folders.forEach(folder => {
        const folderPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
        html += `
            <div class="bg-gray-50 p-5 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-orange-600 hover:shadow-lg transition-all transform hover:-translate-y-1 text-center" onclick="loadFolderStructure('${folderPath}')">
                <div class="text-5xl mb-3 flex items-center justify-center"><svg viewBox="0 0 24 24" fill="currentColor" class="w-16 h-16 text-orange-600"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" /></svg></div>
                <div class="font-medium text-gray-800 break-words">${folder.name}</div>
            </div>
        `;
    });

    // Display files
    files.forEach(file => {
        const icon = getFileIcon(file.name);
        const fileName = currentPath ? `${currentPath}/${file.name}` : file.name;
        const isImage = isImageFile(file.name);

        if (isImage) {
            // Display image thumbnail
            html += `
                <div class="bg-gray-50 overflow-hidden rounded-xl border-2 border-gray-200 hover:border-orange-600 hover:shadow-lg transition-all text-center">
                    <div class="mb-3 h-32 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                        <img src="${API_BASE}/assets/image/${file.name}?w=200&fit=cover" alt="${file.name}" class="w-full object-cover" onerror="this.parentElement.innerHTML='<div class=text-4xl>${icon}</div>'">
                    </div>
                    <div class="font-medium px-3 text-gray-800 break-words mb-3 text-sm">${file.name}</div>
                    <div class="flex flex-wrap gap-2 px-3 pb-3 justify-center">
                        <button class="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-all flex items-center gap-1 justify-center" onclick="previewFile('${fileName}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M12.597 17.981a9.467 9.467 0 0 1 -.597 .019c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6c-.205 .342 -.415 .67 -.63 .983" /><path d="M16 22l5 -5" /><path d="M21 21.5v-4.5h-4.5" /></svg> View</button>
                        <button class="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-all flex items-center gap-1 justify-center" onclick="downloadFile('${fileName}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg> Download</button>
                        <button class="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-all" onclick="openMoveModal('${fileName}')">📤 Move</button>
                        <button class="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all" onclick="openDeleteModal('${fileName}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        } else {
            // Display file icon for non-images
            html += `
                <div class="bg-gray-50 p-5 rounded-xl border-2 border-gray-200 hover:border-orange-600 hover:shadow-lg transition-all text-center">
                    <div class="text-4xl mb-3">${icon}</div>
                    <div class="font-medium text-gray-800 break-words mb-3">${file.name}</div>
                    <div class="flex flex-wrap gap-2 justify-center">
                        <button class="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-all flex items-center gap-1 justify-center" onclick="previewFile('${fileName}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M12.597 17.981a9.467 9.467 0 0 1 -.597 .019c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6c-.205 .342 -.415 .67 -.63 .983" /><path d="M16 22l5 -5" /><path d="M21 21.5v-4.5h-4.5" /></svg> View</button>
                        <button class="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-all flex items-center gap-1 justify-center" onclick="downloadFile('${fileName}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg> Download</button>
                        <button class="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-all" onclick="openMoveModal('${fileName}')">📤 Move</button>
                        <button class="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all" onclick="openDeleteModal('${fileName}')">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }
    });

    contentDiv.innerHTML = html;
}

function isImageFile(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
    return imageExtensions.includes(ext);
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();

    const icons = {
        // Images
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️', 'svg': '🖼️',
        // Documents
        'pdf': '📄', 'doc': '📝', 'docx': '📝', 'txt': '📃',
        // Spreadsheets
        'xls': '📊', 'xlsx': '📊', 'csv': '📊',
        // Presentations
        'ppt': '📊', 'pptx': '📊',
        // Archives
        'zip': '📦', 'rar': '📦', '7z': '📦',
        // Videos
        'mp4': '🎥', 'avi': '🎥', 'mov': '🎥',
        // Audio
        'mp3': '🎵', 'wav': '🎵', 'ogg': '🎵'
    };

    return icons[ext] || '📄';
}

// File Preview
async function previewFile(filename) {
    const modal = document.getElementById('preview-modal');
    const container = document.getElementById('preview-container');

    container.innerHTML = '<div class="py-10 text-gray-500">Loading preview...</div>';
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    try {
        const ext = filename.split('.').pop().toLowerCase();
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

        if (imageExts.includes(ext)) {
            // For images, use the optimized endpoint
            container.innerHTML = `<img src="${API_BASE}/assets/image/${filename}" alt="${filename}" class="max-w-full rounded-lg">`;
        } else {
            // For other files, use preview endpoint
            container.innerHTML = `<iframe src="${API_BASE}/file/preview/${filename}" class="w-full h-[600px] border-0"></iframe>`;
        }
    } catch (error) {
        container.innerHTML = `<p class="text-red-600">Failed to load preview: ${error.message}</p>`;
    }
}

// File Download
function downloadFile(filename) {
    window.open(`${API_BASE}/file/download/${filename}`, '_blank');
}

// Move File
function openMoveModal(filename) {
    const modal = document.getElementById('move-modal');
    document.getElementById('move-filename').value = filename;
    document.getElementById('move-destination').value = '';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

document.getElementById('move-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const filename = document.getElementById('move-filename').value;
    const destination = document.getElementById('move-destination').value;

    try {
        const response = await fetch(`${API_BASE}/file/move/${filename}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ destination })
        });

        const data = await response.json();

        if (response.ok) {
            alert('File moved successfully!');
            const modal = document.getElementById('move-modal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            loadFolderStructure(currentPath);
        } else {
            alert(`Failed to move file: ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        alert(`Failed to move file: ${error.message}`);
    }
});

// Search
function setupSearch() {
    const form = document.getElementById('search-form');
    const resultsDiv = document.getElementById('search-results');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const query = document.getElementById('search-query').value;
        const type = document.getElementById('search-type').value;

        if (!query) {
            resultsDiv.innerHTML = '<p>Please enter a search query</p>';
            return;
        }

        resultsDiv.innerHTML = '<div class="loader">Searching...</div>';

        try {
            const url = `${API_BASE}/file/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (response.ok && data.data && data.data.length > 0) {
                displaySearchResults(data.data);
            } else {
                resultsDiv.innerHTML = '<p>No files found</p>';
            }
        } catch (error) {
            resultsDiv.innerHTML = `<p class="error">Search failed: ${error.message}</p>`;
        }
    });
}

function displaySearchResults(results) {
    const resultsDiv = document.getElementById('search-results');

    let html = '';
    results.forEach(file => {
        const icon = getFileIcon(file);
        html += `
            <div class="bg-gray-50 p-5 rounded-xl border-2 border-gray-200 hover:border-orange-600 hover:shadow-lg transition-all text-center">
                <div class="text-4xl mb-3">${icon}</div>
                <div class="font-medium text-gray-800 break-words mb-3">${file}</div>
                <div class="flex flex-wrap gap-2 justify-center">
                    <button class="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-all flex items-center gap-1 justify-center" onclick="previewFile('${file}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" /><path d="M12.597 17.981a9.467 9.467 0 0 1 -.597 .019c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6c-.205 .342 -.415 .67 -.63 .983" /><path d="M16 22l5 -5" /><path d="M21 21.5v-4.5h-4.5" /></svg> View</button>
                    <button class="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-all flex items-center gap-1 justify-center" onclick="downloadFile('${file}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg> Download</button>
                    <button class="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all" onclick="openDeleteModal('${file}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
}

// Dashboard
async function loadDashboard() {
    try {
        // Fetch stats and files from database
        const [statsRes, filesRes] = await Promise.all([
            fetch(`${API_BASE}/database/stats`),
            fetch(`${API_BASE}/database/files`)
        ]);

        const statsData = await statsRes.json();
        const filesData = await filesRes.json();

        const stats = statsData.data || statsData.result || {};
        const files = filesData.data || filesData.result || [];

        // Update stat cards
        document.getElementById('stat-total-files').textContent = stats.totalFiles || 0;
        document.getElementById('stat-total-size').textContent = `${stats.totalSizeMB || 0} MB`;

        // Count images and documents
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
        const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];

        const imageCount = files.filter(f => imageExtensions.includes(f.extension)).length;
        const docCount = files.filter(f => docExtensions.includes(f.extension)).length;

        document.getElementById('stat-images').textContent = imageCount;
        document.getElementById('stat-documents').textContent = docCount;

        // Display file types chart
        displayFileTypesChart(stats.fileTypes || {});

        // Display recent uploads (last 10)
        displayRecentUploads(files.slice(-10).reverse());

        // Display storage by folder
        displayStorageByFolder(files);

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function displayFileTypesChart(fileTypes) {
    const container = document.getElementById('file-types-chart');
    const total = Object.values(fileTypes).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No files uploaded yet</p>';
        return;
    }

    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500'];

    let html = '';
    Object.entries(fileTypes).forEach(([ext, count], index) => {
        const percentage = ((count / total) * 100).toFixed(1);
        const color = colors[index % colors.length];

        html += `
            <div>
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">.${ext}</span>
                    <span class="text-sm text-gray-600">${count} files (${percentage}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="${color} h-2.5 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function displayRecentUploads(files) {
    const container = document.getElementById('recent-uploads');

    if (files.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No recent uploads</p>';
        return;
    }

    let html = '';
    files.forEach(file => {
        const date = new Date(file.uploadedAt);
        const timeAgo = getTimeAgo(date);
        const sizeKB = (file.size / 1024).toFixed(2);

        html += `
            <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                <div class="text-3xl">${getFileIcon(file.filename)}</div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-800 truncate">${file.originalFilename}</p>
                    <p class="text-sm text-gray-500">${sizeKB} KB • ${timeAgo}</p>
                </div>
                <button class="px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-all" onclick="previewFile('${file.filename}')">View</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

function displayStorageByFolder(files) {
    const container = document.getElementById('folder-storage');

    // Group files by folder
    const folderStats = {};
    files.forEach(file => {
        const folder = file.folderPath || '/';
        if (!folderStats[folder]) {
            folderStats[folder] = { count: 0, size: 0 };
        }
        folderStats[folder].count++;
        folderStats[folder].size += file.size;
    });

    if (Object.keys(folderStats).length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No folders yet</p>';
        return;
    }

    const totalSize = Object.values(folderStats).reduce((sum, stats) => sum + stats.size, 0);

    let html = '';
    Object.entries(folderStats)
        .sort((a, b) => b[1].size - a[1].size)
        .forEach(([folder, stats]) => {
            const percentage = ((stats.size / totalSize) * 100).toFixed(1);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

            html += `
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <svg viewBox="0 0 24 24" fill="currentColor" class="size-5">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z" />
                            </svg>
                            <span class="pb-0.5">${folder}</span>
                        </span>
                        <span class="text-sm text-gray-600">${stats.count} files • ${sizeMB} MB (${percentage}%)</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-orange-500 h-2.5 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });

    container.innerHTML = html;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}


// Image Optimization
function setupOptimize() {
    const form = document.getElementById('optimize-form');
    const resultDiv = document.getElementById('optimize-result');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const filename = document.getElementById('image-filename').value;
        const format = document.getElementById('opt-format').value;
        const quality = document.getElementById('opt-quality').value;
        const width = document.getElementById('opt-width').value;
        const height = document.getElementById('opt-height').value;
        const fit = document.getElementById('opt-fit').value;

        // Build query parameters
        const params = new URLSearchParams();
        if (format) params.append('fm', format);
        if (quality) params.append('q', quality);
        if (width) params.append('w', width);
        if (height) params.append('h', height);
        if (fit) params.append('fit', fit);

        const queryString = params.toString();
        const url = `${API_BASE}/assets/image/${filename}${queryString ? '?' + queryString : ''}`;
        const fullUrl = window.location.origin + url;

        resultDiv.innerHTML = `
            <div class="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">✅ Optimized Image URL</h3>
                <div class="bg-white p-4 rounded-lg mb-4 break-all font-mono text-sm">${fullUrl}</div>
                <button class="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-all mb-5" onclick="copyToClipboard('${fullUrl}')">📋 Copy URL</button>
                <div>
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">Preview:</h4>
                    <img src="${url}" alt="Optimized image" class="max-w-full rounded-lg shadow-lg" onerror="this.parentElement.innerHTML='<p class=text-red-600>Failed to load image. Check if the filename is correct.</p>'">
                </div>
            </div>
        `;
        resultDiv.classList.remove('hidden');
    });
}

// Copy to Clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('URL copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy URL');
    });
}

// Modal Management
function setupModals() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.close');

        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    });
}

// Delete File
function openDeleteModal(filename) {
    const modal = document.getElementById('delete-modal');
    document.getElementById('delete-filename').value = filename;
    document.getElementById('delete-filename-display').textContent = filename;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function confirmDeleteFile() {
    const fullPath = document.getElementById('delete-filename').value;
    // Extract only the filename from the path
    const filename = fullPath.split('/').pop();

    try {
        const response = await fetch(`${API_BASE}/file/delete/${filename}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            alert('File deleted successfully!');
            closeDeleteModal();
            // Reload current view
            if (document.getElementById('browse').classList.contains('block')) {
                loadFolderStructure(currentPath);
            } else if (document.getElementById('search').classList.contains('block')) {
                // Re-trigger the last search
                document.getElementById('search-form').dispatchEvent(new Event('submit'));
            }
        } else {
            alert(`Failed to delete file: ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        alert(`Failed to delete file: ${error.message}`);
    }
}

// Status Message Helper
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = type === 'success'
        ? 'mt-4 p-3 bg-green-100 border border-green-400 text-green-800 rounded-lg'
        : 'mt-4 p-3 bg-red-100 border border-red-400 text-red-800 rounded-lg';
    element.classList.remove('hidden');

    if (type === 'success') {
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }
}

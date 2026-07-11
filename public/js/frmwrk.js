// API Configuration (Update these base URLs if necessary)
const API_FRAMEWORKS = '/framework';
const API_COMMANDS = '/command';

// State Management
let frameworks = [];
let commands = [];
let currentFrameworkId = null;
let currentFrameworkSlug = null;
let currentPage = 0;
let hasMore = true;

// ----- Toast Notification System -----
function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const bgColor = type === 'success' ? 'bg-green-600/90 border-green-400' : 'bg-red-600/90 border-red-400';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    toast.className = `${bgColor} border backdrop-blur-sm text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in transform transition-all duration-300 ease-out translate-y-0 opacity-100`;
    toast.innerHTML = `
        <i class="fas ${icon} text-lg"></i>
        <span class="text-sm font-medium">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ----- Frameworks Management -----
async function fetchFrameworks(page = 0, append = false) {
    const spinner = document.getElementById('loading-spinner');
    const loadMoreBtn = document.getElementById('load-more-container');
    
    if (!append) {
        spinner.classList.remove('hidden');
        document.getElementById('frameworks-grid').innerHTML = '';
    }
    
    try {
        // Mock API call structure for frameworks (Modify as per your real backend)
        const response = await fetch(`${API_FRAMEWORKS}/?offset=${page * 10}`);
        if (!response.ok) throw new Error('خطا در دریافت اطلاعات');
        
        const data = await response.json(); 
        
        if (data.data) {
            if (append) frameworks = [...frameworks, ...data.data];
            else frameworks = data.data;
            
            hasMore = data.data.length === (data.limit || 10);
            renderFrameworks();
        } else {
            // Fallback if data format differs
            frameworks = [];
        }
    } catch (error) {
        showToast('ارتباط با سرور برقرار نشد (لیست آزمایشی نمایش داده می‌شود)', 'error');
        // Mock Data injection on fail for visual test
        if (!append) frameworks = [
            { id: '1', name: 'Laravel', language: 'PHP', description: 'The PHP Framework for Web Artisans.', slug: 'laravel', is_featured: true },
            { id: '2', name: 'React', language: 'JavaScript', description: 'A JavaScript library for building user interfaces.', slug: 'react', is_featured: false }
        ];
        renderFrameworks();
        hasMore = false;
    } finally {
        spinner.classList.add('hidden');
        loadMoreBtn.classList.toggle('hidden', !hasMore);
    }
}

function renderFrameworks() {
    const grid = document.getElementById('frameworks-grid');
    grid.innerHTML = frameworks.map(fw => `
        <div class="glow-box p-6 rounded-2xl flex flex-col h-full relative group">
            ${fw.is_featured ? '<div class="absolute -top-3 -right-3 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-purple-600/30 border border-purple-400 z-10">ویژه</div>' : ''}
            
            <div class="flex justify-between items-start mb-4">
                <div class="flex-grow">
                    <h3 class="text-xl font-title text-white mb-1 group-hover:text-persian-cyan transition-colors">${fw.name}</h3>
                    <span class="text-xs bg-dark-bg border border-white/10 text-gray-300 px-2 py-1 rounded-md font-mono">${fw.language}</span>
                </div>
                
                <div class="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editFramework('${fw.id}')" class="w-8 h-8 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-purple-500 transition-all flex items-center justify-center">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button onclick="deleteFramework('${fw.id}')" class="w-8 h-8 rounded-lg bg-dark-bg border border-white/10 text-gray-400 hover:text-white hover:border-red-500 transition-all flex items-center justify-center">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
            
            <p class="text-gray-400 text-sm mb-6 flex-grow line-clamp-3">${fw.description || 'بدون توضیحات'}</p>
            
            <button onclick="openCommandsModal('${fw.id}', '${fw.slug}')" class="w-full bg-dark-bg border border-persian-cyan/30 text-persian-cyan hover:bg-persian-cyan hover:text-dark-bg py-2.5 rounded-xl transition-all font-bold flex items-center justify-center gap-2 group/btn">
                <i class="fas fa-terminal group-hover/btn:animate-pulse"></i>
                مدیریت دستورات
            </button>
        </div>
    `).join('');
}

function loadMore() {
    if (hasMore) {
        currentPage++;
        fetchFrameworks(currentPage, true);
    }
}

// --- Framework Form Actions ---
function openAddModal() {
    document.getElementById('framework-form').reset();
    document.getElementById('f-id').value = '';
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-plus-circle text-purple-400"></i> افزودن فریم‌ورک';
    document.getElementById('framework-modal').classList.remove('hidden');
    document.getElementById('framework-modal').classList.add('flex');
}

function closeModal() {
    document.getElementById('framework-modal').classList.add('hidden');
    document.getElementById('framework-modal').classList.remove('flex');
}

function editFramework(id) {
    const fw = frameworks.find(f => f.id == id);
    if (!fw) return;

    document.getElementById('f-id').value = fw.id;
    document.getElementById('f-name').value = fw.name;
    document.getElementById('f-language').value = fw.language;
    document.getElementById('f-desc').value = fw.description || '';
    document.getElementById('f-website').value = fw.website || '';
    document.getElementById('f-repo').value = fw.repository || '';
    document.getElementById('f-featured').checked = fw.is_featured;

    document.getElementById('modal-title').innerHTML = '<i class="fas fa-edit text-purple-400"></i> ویرایش فریم‌ورک';
    document.getElementById('framework-modal').classList.remove('hidden');
    document.getElementById('framework-modal').classList.add('flex');
}

async function saveFramework() {
    const id = document.getElementById('f-id').value;
    const payload = {
        name: document.getElementById('f-name').value,
        language: document.getElementById('f-language').value,
        description: document.getElementById('f-desc').value,
        website: document.getElementById('f-website').value,
        repository: document.getElementById('f-repo').value,
        is_featured: document.getElementById('f-featured').checked
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_FRAMEWORKS}/${id}` : API_FRAMEWORKS;

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast(`فریم‌ورک با موفقیت ${id ? 'بروزرسانی' : 'ثبت'} شد`);
            closeModal();
            currentPage = 0;
            fetchFrameworks();
        } else {
            const data = await response.json();
            showToast(data.error || 'خطا در ذخیره اطلاعات', 'error');
        }
    } catch (e) {
        showToast('خطا در برقراری ارتباط', 'error');
    }
}

async function deleteFramework(id) {
    if (!confirm('آیا از حذف این فریم‌ورک و تمامی دستورات آن اطمینان دارید؟')) return;
    try {
        const response = await fetch(`${API_FRAMEWORKS}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('فریم‌ورک با موفقیت حذف شد');
            currentPage = 0;
            fetchFrameworks();
        } else {
            showToast('خطا در حذف فریم‌ورک', 'error');
        }
    } catch (e) {
        showToast('خطا در برقراری ارتباط', 'error');
    }
}

// ----- Commands Management -----
function openCommandsModal(id, slug) {
    currentFrameworkId = id;
    currentFrameworkSlug = slug;
    document.getElementById('cmd-modal-title').innerHTML = `
        <i class="fas fa-terminal text-persian-cyan"></i>
        دستورات فریم‌ورک 
    `;
    document.getElementById('commands-modal').classList.remove('hidden');
    document.getElementById('commands-modal').classList.add('flex');
    
    resetCommandForm();
    fetchCommands();
}

function closeCommandsModal() {
    document.getElementById('commands-modal').classList.add('hidden');
    document.getElementById('commands-modal').classList.remove('flex');
    currentFrameworkId = null;
}

// Toggle UI based on action_type
function toggleFileFields() {
    const type = document.getElementById('c-action-type').value;
    const fileFields = document.getElementById('file-fields-container');
    const fileInput = document.getElementById('c-file');
    const fileNameInput = document.getElementById('c-file-name');
    const pathInput = document.getElementById('c-path');

    if (type === 'generate') {
        fileFields.classList.remove('hidden');
        fileInput.required = true;
        fileNameInput.required = true;
        pathInput.required = true;
    } else {
        fileFields.classList.add('hidden');
        fileInput.required = false;
        fileNameInput.required = false;
        pathInput.required = false;
    }
}

async function fetchCommands() {
    document.getElementById('commands-list-loading').classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_COMMANDS}/?framework=${currentFrameworkSlug}`);
        if (!response.ok) throw new Error('خطا در دریافت دستورات');
        
        const data = await response.json();
        commands = data.data || [];
        renderCommands();
    } catch (error) {
        commands = [];
        renderCommands();
        showToast('مشکل در دریافت لیست دستورات', 'error');
    } finally {
        document.getElementById('commands-list-loading').classList.add('hidden');
    }
}

function renderCommands() {
    const container = document.getElementById('commands-container');
    document.getElementById('cmd-count').innerText = `${commands.length} مورد`;
    
    if (commands.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-gray-500">
                <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                <p>هیچ دستوری ثبت نشده است.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = commands.map(cmd => `
        <div class="bg-dark-surface border border-white/5 p-4 rounded-xl hover:border-persian-cyan/30 transition-all flex flex-col gap-3 group">
            <div class="flex justify-between items-start">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <h4 class="text-white font-bold text-sm">${cmd.alias}</h4>
                        ${cmd.is_featured ? '<span class="text-[10px] bg-persian-cyan/20 text-persian-cyan px-2 py-0.5 rounded border border-persian-cyan/30">ویژه</span>' : ''}
                        ${cmd.action_type === 'generate' ? '<span class="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30">ساخت فایل</span>' : '<span class="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">اجرایی</span>'}
                    </div>
                    <p class="text-xs text-gray-400 font-mono bg-dark-bg px-2 py-1 rounded inline-block" dir="ltr">${cmd.command}</p>
                </div>
                <div class="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editCommand('${cmd.ID || cmd.id}')" class="w-7 h-7 bg-dark-bg hover:bg-white/10 text-gray-400 hover:text-white rounded flex items-center justify-center transition-colors">
                        <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button onclick="deleteCommand('${cmd.ID || cmd.id}')" class="w-7 h-7 bg-dark-bg hover:bg-white/10 text-gray-400 hover:text-red-400 rounded flex items-center justify-center transition-colors">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
            ${cmd.description ? `<p class="text-xs text-gray-500 border-t border-white/5 pt-2">${cmd.description}</p>` : ''}
        </div>
    `).join('');
}

async function saveCommand() {
    const id = document.getElementById('c-id').value;
    let optionsStr = "{}";
    
    try {
        const optionsVal = document.getElementById('c-options').value;
        const parsed = optionsVal ? JSON.parse(optionsVal) : {};
        optionsStr = JSON.stringify(parsed); // ارسال به صورت String هماهنگ با ساختار دیتابیس
    } catch (e) {
        showToast('فرمت JSON آپشن‌ها نامعتبر است', 'error');
        return;
    }

    const actionType = document.getElementById('c-action-type').value;

    const payload = {
        alias: document.getElementById('c-alias').value,
        command: document.getElementById('c-command').value,
        action_type: actionType,
        framework_id: currentFrameworkId,
        description: document.getElementById('c-desc').value,
        options: optionsStr,
        is_featured: document.getElementById('c-featured').checked
    };

    if (actionType === 'generate') {
        payload.file_name = document.getElementById('c-file-name').value;
        payload.paths = document.getElementById('c-path').value;
        payload.file = document.getElementById('c-file').value;
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_COMMANDS}/${id}` : API_COMMANDS;

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            showToast(`دستور با موفقیت ${id ? 'ویرایش' : 'ثبت'} شد`);
            resetCommandForm();
            fetchCommands();
        } else {
            const data = await response.json();
            showToast(data.error || 'خطا در ثبت دستور', 'error');
        }
    } catch (e) {
        showToast('خطا در برقراری ارتباط', 'error');
    }
}

function editCommand(id) {
    const cmd = commands.find(c => (c.ID == id || c.id == id));
    if (!cmd) return;

    document.getElementById('cmd-form-title').innerHTML = '<i class="fas fa-edit text-persian-cyan"></i> ویرایش دستور';
    document.getElementById('c-id').value = cmd.ID || cmd.id;
    document.getElementById('c-alias').value = cmd.alias;
    document.getElementById('c-command').value = cmd.command;
    document.getElementById('c-desc').value = cmd.description || '';
    document.getElementById('c-options').value = typeof cmd.options === 'string' ? cmd.options : JSON.stringify(cmd.options || {});
    document.getElementById('c-featured').checked = cmd.is_featured;
    
    const actionType = cmd.action_type || 'execute';
    document.getElementById('c-action-type').value = actionType;
    
    if (actionType === 'generate') {
        document.getElementById('c-file-name').value = cmd.file_name || '';
        document.getElementById('c-path').value = cmd.paths || '';
        document.getElementById('c-file').value = cmd.file || ''; // Note: API should return file content if possible
    }
    
    toggleFileFields();

    document.getElementById('save-cmd-btn').innerHTML = '<i class="fas fa-save"></i> بروزرسانی';
    document.getElementById('cancel-cmd-btn').classList.remove('hidden');
}

function resetCommandForm() {
    document.getElementById('command-form').reset();
    document.getElementById('c-id').value = '';
    document.getElementById('c-options').value = '{}';
    document.getElementById('cmd-form-title').innerHTML = '<i class="fas fa-plus-circle text-persian-cyan"></i> افزودن دستور جدید';
    document.getElementById('save-cmd-btn').innerHTML = '<i class="fas fa-save"></i> ثبت دستور';
    document.getElementById('cancel-cmd-btn').classList.add('hidden');
    
    // Reset action type UI
    document.getElementById('c-action-type').value = 'execute';
    toggleFileFields();
}

async function deleteCommand(id) {
    if (!confirm('آیا از حذف این دستور اطمینان دارید؟')) return;
    try {
        const response = await fetch(`${API_COMMANDS}/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('دستور با موفقیت حذف شد');
            fetchCommands();
            if(document.getElementById('c-id').value == id) resetCommandForm();
        } else {
            showToast('خطا در حذف دستور', 'error');
        }
    } catch (e) {
        showToast('خطا در برقراری ارتباط', 'error');
    }
}

// ----- Exports -----

// تابع کمکی برای ساخت و دانلود فایل JSON
function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

async function exportAllFrameworks() {
    showToast('در حال آماده‌سازی فایل JSON کل سیستم...', 'success');
    try {
        // سعی می‌کنیم همه داده‌ها را بگیریم تا خروجی کامل باشد (در صورت وجود محدودیتِ صفحه‌بندی در سرور)
        const response = await fetch(`${API_FRAMEWORKS}/?limit=1000`);
        let exportData = frameworks; 
        
        if (response.ok) {
            const data = await response.json();
            if (data.data) exportData = data.data;
        }
        
        downloadJSON(exportData, 'all_frameworks_export.json');
    } catch (error) {
        // اگر مشکلی پیش آمد، دیتای حافظه فعلی (frameworks) را دانلود می‌کنیم
        downloadJSON(frameworks, 'all_frameworks_export.json');
    }
}

function exportCurrentFramework() {
    if(!currentFrameworkId) return;
    showToast(`در حال آماده‌سازی JSON فریم‌ورک ${currentFrameworkSlug}...`, 'success');
    
    // گرفتن اطلاعات فریم‌ورک از آرایه موجود
    const fwInfo = frameworks.find(f => (f.id == currentFrameworkId || f.ID == currentFrameworkId)) || {};
    
    // ساختاردهی خروجی که شامل خود فریم‌ورک و دستورات (commands که درون مدال لود شده‌اند) است
    const exportData = {
        framework: fwInfo,
        commands: commands
    };
    
    downloadJSON(exportData, `${currentFrameworkSlug}_commands_export.json`);
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchFrameworks();
});

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchFrameworks();
});
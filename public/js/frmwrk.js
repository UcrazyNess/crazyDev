// ==========================================
// STATE & VARIABLES
// ==========================================
let frameworksList = [];
let currentOffset = 0;
const limit = 10;
let isEditMode = false;
let isFetching = false;

let commandsList = [];
let currentCmdFrameworkId = null;
let currentCmdFrameworkSlug = null;
let isCmdEditMode = false;

// API URLs - Match these with your Gin Routes
const FW_API_URL = '/framework';
const CMD_API_URL = '/command';

// ==========================================
// UI HELPERS (TOASTS)
// ==========================================
function showToast(message, type = 'success') {
    const id = 'toast-' + Math.random().toString(36).substr(2, 9);
    const container = document.getElementById('toast-container');
    
    const colors = {
        success: 'bg-green-500/20 border-green-500/50 text-green-400',
        error: 'bg-red-500/20 border-red-500/50 text-red-400',
        info: 'bg-blue-500/20 border-blue-500/50 text-blue-400'
    };
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const html = `
        <div id="${id}" class="flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg animate-slide-in ${colors[type]} transition-all duration-300">
            <i class="fas ${icons[type]} text-lg"></i>
            <span class="text-sm font-medium text-white">${message}</span>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);

    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            setTimeout(() => el.remove(), 300);
        }
    }, 5000);
}

// ==========================================
// FRAMEWORK MANAGEMENT LOGIC
// ==========================================

async function fetchFrameworks(offset = 0) {
    if (isFetching) return;
    isFetching = true;
    
    const spinner = document.getElementById('loading-spinner');
    const loadMoreBtn = document.getElementById('load-more-container');
    
    if (offset === 0) {
        spinner.classList.remove('hidden');
        document.getElementById('frameworks-grid').innerHTML = '';
    }

    try {
        // Mocking API delay for visual effect
        // await new Promise(r => setTimeout(r, 500)); 
        
        const response = await fetch(`${FW_API_URL}/?offset=${offset}`);
        
        // --- MOCK DATA FOR DEMONSTRATION IF API FAILS ---
        if(!response.ok && offset === 0) {
                showToast('اجرای حالت دمو (خطا در اتصال به API).', 'info');
                renderFrameworksMock();
                return;
        }
        
        if (!response.ok) throw new Error('خطا در دریافت اطلاعات');
        
        const resData = await response.json();
        const data = resData.Data || resData.data || resData;

        if (offset === 0) frameworksList = [];
        frameworksList = [...frameworksList, ...data];
        
        renderFrameworks(data);
        
        if (data.length === limit) {
            loadMoreBtn.classList.remove('hidden');
            currentOffset += limit;
        } else {
            loadMoreBtn.classList.add('hidden');
        }

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        spinner.classList.add('hidden');
        isFetching = false;
    }
}

function loadMore() {
    fetchFrameworks(currentOffset);
}

function renderFrameworks(items) {
    const grid = document.getElementById('frameworks-grid');
    const fragment = document.createDocumentFragment();

    items.forEach(fw => {
        // Handle different JSON casing depending on Go struct mapping
        const id = fw.id || fw.ID || fw.Id;
        const name = fw.name || fw.Name;
        const slug = fw.slug || fw.Slug;
        const lang = fw.language || fw.Language;
        const desc = fw.description || fw.Description || 'توضیحاتی ثبت نشده است.';
        const web = fw.website || fw.Website;
        const repo = fw.repository || fw.Repository;
        const isFeatured = fw.is_featured || fw.IsFeatured;

        const card = document.createElement('div');
        card.id = `fw-${slug}`;
        card.className = 'glow-box rounded-2xl p-6 group flex flex-col h-full relative overflow-hidden animate-fade-in';
        
        if (isFeatured) {
            card.innerHTML += `<div class="absolute top-0 right-0 w-20 h-20 bg-purple-600/20 blur-2xl rounded-full"></div>
                                <div class="absolute -right-6 -top-6 text-yellow-500/20 text-6xl rotate-12"><i class="fas fa-star"></i></div>`;
        }

        card.innerHTML += `
            <div class="flex justify-between items-start mb-4 relative z-10">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-dark-bg border border-white/10 rounded-xl flex items-center justify-center text-xl text-gray-300 shadow-inner">
                        ${lang.toLowerCase().includes('php') ? '<i class="fab fa-php text-indigo-400"></i>' : 
                            lang.toLowerCase().includes('js') || lang.toLowerCase().includes('node') ? '<i class="fab fa-node-js text-green-400"></i>' :
                            lang.toLowerCase().includes('go') ? '<i class="fab fa-golang text-cyan-400"></i>' :
                            lang.toLowerCase().includes('python') ? '<i class="fab fa-python text-yellow-400"></i>' :
                            '<i class="fas fa-code text-gray-400"></i>'}
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-white flex items-center gap-2">
                            ${name}
                            ${isFeatured ? '<i class="fas fa-check-circle text-persian-cyan text-xs" title="ویژه"></i>' : ''}
                        </h3>
                        <span class="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">${lang}</span>
                    </div>
                </div>
            </div>
            
            <p class="text-gray-400 text-sm leading-relaxed mb-4 flex-grow relative z-10">${desc}</p>
            
            <div class="flex items-center gap-3 mb-4 text-sm relative z-10">
                ${web ? `<a href="${web}" target="_blank" class="text-gray-500 hover:text-persian-cyan transition-colors" title="وب‌سایت"><i class="fas fa-globe"></i></a>` : ''}
                ${repo ? `<a href="${repo}" target="_blank" class="text-gray-500 hover:text-white transition-colors" title="مخزن کد"><i class="fab fa-github"></i></a>` : ''}
            </div>

            <div class="flex justify-between items-center pt-4 border-t border-white/5 gap-2 relative z-10">
                <!-- دکمه دستورات - ارسال آیدی به عنوان پارامتر اول -->
                <button onclick="openCommandsModal('${id}', '${slug}', '${name}')" class="flex-[2] bg-persian-cyan/10 hover:bg-persian-cyan/20 border border-persian-cyan/30 hover:border-persian-cyan text-persian-cyan py-2 rounded-lg text-sm transition-all flex justify-center items-center gap-2 font-bold shadow-lg shadow-persian-cyan/5">
                    <i class="fas fa-terminal text-xs"></i> دستورات
                </button>
                <button onclick="editFramework('${slug}')" class="flex-1 bg-dark-surface hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/50 text-gray-300 hover:text-white py-2 rounded-lg text-sm transition-all flex justify-center items-center gap-2">
                    <i class="fas fa-pen text-xs"></i>
                </button>
                <button onclick="confirmDelete('${slug}')" class="w-10 h-[38px] bg-dark-surface hover:bg-red-500/20 border border-white/5 hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg transition-all flex justify-center items-center shrink-0">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);
}

const modal = document.getElementById('framework-modal');
const form = document.getElementById('framework-form');

function openAddModal() {
    isEditMode = false;
    form.reset();
    document.getElementById('f-slug').value = '';
    document.getElementById('f-id').value = '';
    document.getElementById('modal-title').innerHTML = '<i class="fas fa-plus-circle text-purple-400"></i> افزودن فریم‌ورک';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function saveFramework() {
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const payload = {
        name: document.getElementById('f-name').value,
        language: document.getElementById('f-language').value,
        description: document.getElementById('f-desc').value,
        website: document.getElementById('f-website').value,
        repository: document.getElementById('f-repo').value,
        is_featured: document.getElementById('f-featured').checked
    };

    const btn = document.getElementById('save-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ذخیره...';
    btn.disabled = true;

    try {
        let url = FW_API_URL + '/';
        let method = 'POST';

        if (isEditMode) {
            const slug = document.getElementById('f-slug').value;
            url = `${FW_API_URL}/${slug}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'خطا در ذخیره‌سازی داده');
        }

        showToast(isEditMode ? 'فریم‌ورک با موفقیت بروزرسانی شد' : 'فریم‌ورک جدید با موفقیت اضافه شد', 'success');
        closeModal();
        
        // Refresh list
        currentOffset = 0;
        fetchFrameworks(0);

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> ذخیره اطلاعات';
    }
}

function editFramework(slug) {
    const fw = frameworksList.find(f => (f.slug || f.Slug) === slug);
    if (!fw) return;

    isEditMode = true;
    document.getElementById('f-slug').value = slug;
    document.getElementById('f-id').value = fw.id || fw.ID || fw.Id;
    document.getElementById('f-name').value = fw.name || fw.Name;
    document.getElementById('f-language').value = fw.language || fw.Language;
    document.getElementById('f-desc').value = fw.description || fw.Description || '';
    document.getElementById('f-website').value = fw.website || fw.Website || '';
    document.getElementById('f-repo').value = fw.repository || fw.Repository || '';
    document.getElementById('f-featured').checked = fw.is_featured || fw.IsFeatured;

    document.getElementById('modal-title').innerHTML = '<i class="fas fa-pen text-purple-400"></i> ویرایش فریم‌ورک';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function confirmDelete(slug) {
    const toastHtml = `
        <div id="confirm-${slug}" class="bg-dark-surface border border-red-500/50 shadow-2xl shadow-red-900/20 rounded-xl p-4 w-80 animate-slide-in relative overflow-hidden z-[100]">
            <div class="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div class="flex items-start gap-3">
                <i class="fas fa-exclamation-triangle text-red-400 text-xl mt-0.5"></i>
                <div>
                    <h4 class="text-white font-bold text-sm mb-1">تایید حذف</h4>
                    <p class="text-gray-400 text-xs mb-3">آیا از حذف این فریم‌ورک و تمامی اطلاعات آن مطمئن هستید؟</p>
                    <div class="flex gap-2">
                        <button onclick="executeDelete('${slug}')" class="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">بله، حذف کن</button>
                        <button onclick="document.getElementById('confirm-${slug}').remove()" class="bg-dark-bg border border-white/10 hover:bg-white/5 text-gray-300 px-3 py-1.5 rounded text-xs transition-colors">انصراف</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('toast-container').insertAdjacentHTML('beforeend', toastHtml);
}

async function executeDelete(slug) {
    const confirmBox = document.getElementById(`confirm-${slug}`);
    if(confirmBox) confirmBox.remove();

    try {
        const response = await fetch(`${FW_API_URL}/${slug}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'خطا در حذف رکورد');
        }

        showToast('فریم‌ورک با موفقیت حذف شد.', 'success');
        
        // Remove from UI
        const card = document.getElementById(`fw-${slug}`);
        if(card) {
            card.style.transform = 'scale(0.9)';
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 300);
        }

    } catch (error) {
        showToast(error.message, 'error');
    }
}


// ==========================================
// COMMANDS MANAGEMENT LOGIC
// ==========================================

const cmdModal = document.getElementById('commands-modal');
const cmdForm = document.getElementById('command-form');
const cId = document.getElementById('c-id');
const cAlias = document.getElementById('c-alias');
const cCommand = document.getElementById('c-command');
const cDesc = document.getElementById('c-desc');
const cOptions = document.getElementById('c-options');
const cFeatured = document.getElementById('c-featured');
const cmdsContainer = document.getElementById('commands-container');
const cancelCmdBtn = document.getElementById('cancel-cmd-btn');
const formTitle = document.getElementById('cmd-form-title');
const saveCmdBtn = document.getElementById('save-cmd-btn');

async function openCommandsModal(fId, fSlug, fName) {
    if(!fId) {
        showToast('خطا در دریافت شناسه فریم‌ورک. لطفاً صفحه را رفرش کنید.', 'error');
        return;
    }
    
    // ذخیره آیدی فریم‌ورک برای ساخت کامند
    currentCmdFrameworkId = String(fId);
    currentCmdFrameworkSlug = fSlug;
    
    document.getElementById('cmd-modal-title').innerHTML = `<i class="fas fa-terminal text-persian-cyan"></i> دستورات فریم‌ورک: <span class="text-white">${fName}</span>`;
    cmdModal.classList.remove('hidden');
    cmdModal.classList.add('flex');
    
    resetCommandForm();
    await fetchCommands();
}

function closeCommandsModal() {
    cmdModal.classList.add('hidden');
    cmdModal.classList.remove('flex');
    currentCmdFrameworkId = null;
    commandsList = [];
}

function resetCommandForm() {
    cmdForm.reset();
    cId.value = '';
    cOptions.value = '{}';
    isCmdEditMode = false;
    cancelCmdBtn.classList.add('hidden');
    formTitle.innerHTML = '<i class="fas fa-plus-circle text-persian-cyan"></i> افزودن دستور جدید';
    saveCmdBtn.innerHTML = '<i class="fas fa-save"></i> ثبت دستور';
}

async function fetchCommands() {
    const loader = document.getElementById('commands-list-loading');
    loader.classList.remove('hidden');
    
    try {
        // ارسال درخواست بر اساس slug به بک‌اند
        const response = await fetch(`${CMD_API_URL}/?framework=${currentCmdFrameworkSlug}&offset=0`);
        
        // MOCK DEMO
        if(!response.ok) {
            showToast('حالت دمو: قادر به دریافت دستورات از API نیست.', 'info');
            commandsList = [];
            renderCommands();
            return;
        }
        
        const res = await response.json();
        commandsList = res.Data || res.data || res.Items || res.items || (Array.isArray(res) ? res : []);
        
        renderCommands();
    } catch (error) {
        showToast(error.message, 'error');
        cmdsContainer.innerHTML = `<div class="text-center text-red-400 p-4 border border-red-500/20 bg-red-900/10 rounded-xl font-mono text-sm">خطا در برقراری ارتباط با سرویس Command</div>`;
    } finally {
        loader.classList.add('hidden');
    }
}

function renderCommands() {
    document.getElementById('cmd-count').innerText = `${commandsList.length} مورد`;
    cmdsContainer.innerHTML = '';

    if (commandsList.length === 0) {
        cmdsContainer.innerHTML = `
            <div class="text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-xl bg-dark-surface/20 flex flex-col items-center gap-3">
                <i class="fas fa-ghost text-4xl opacity-50"></i>
                <p class="font-mono text-sm">دستوری برای این فریم‌ورک یافت نشد.</p>
            </div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    commandsList.forEach(cmd => {
        const id = cmd.ID || cmd.Id || cmd.id;
        const alias = cmd.Alias || cmd.alias;
        const commandStr = cmd.Command || cmd.command;
        const desc = cmd.Description || cmd.description || 'بدون توضیح';
        const isFeatured = cmd.IsFeatured || cmd.is_featured;

        const item = document.createElement('div');
        item.className = 'bg-dark-surface border border-white/5 rounded-xl p-4 hover:border-persian-cyan/30 transition-all flex flex-col gap-3 group relative overflow-hidden';
        
        if (isFeatured) {
            item.innerHTML += `<div class="absolute top-0 right-0 w-1 h-full bg-persian-cyan shadow-[0_0_10px_#00E5FF]"></div>`;
        }

        item.innerHTML += `
            <div class="flex justify-between items-start gap-2 relative z-10">
                <div>
                    <h4 class="text-white font-bold text-sm flex items-center gap-2">
                        ${alias}
                        ${isFeatured ? '<i class="fas fa-bolt text-persian-cyan text-xs" title="دستور ویژه"></i>' : ''}
                    </h4>
                    <p class="text-gray-400 text-xs mt-1.5">${desc}</p>
                </div>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-bg border border-white/5 rounded-lg p-1 shrink-0">
                    <button onclick="editCommand('${id}')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors" title="ویرایش">
                        <i class="fas fa-pen text-xs"></i>
                    </button>
                    <button onclick="confirmDeleteCommand('${id}', '${alias}')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="حذف">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                </div>
            </div>
            <div class="bg-[#0B0F19] rounded-lg p-3 font-mono text-[13px] text-persian-cyan border border-white/5 flex justify-between items-center group/code relative z-10">
                <code class="break-all font-semibold" dir="ltr">${commandStr}</code>
                <button onclick="navigator.clipboard.writeText('${commandStr.replace(/'/g, "\\'")}').then(() => showToast('دستور کپی شد', 'info'))" class="text-gray-500 hover:text-white opacity-0 group-hover/code:opacity-100 transition-opacity mr-2">
                    <i class="far fa-copy"></i>
                </button>
            </div>
        `;
        fragment.appendChild(item);
    });
    cmdsContainer.appendChild(fragment);
}

async function saveCommand() {
    if (!cmdForm.checkValidity()) {
        cmdForm.reportValidity();
        return;
    }

    // اعتبارسنجی Options برای دیتاتایپ json.RawMessage
    let optionsObj = {};
    const optionsRaw = cOptions.value.trim();
    if (optionsRaw) {
        try {
            optionsObj = JSON.parse(optionsRaw);
        } catch (e) {
            showToast('فرمت JSON در بخش تنظیمات نامعتبر است.', 'error');
            cOptions.focus();
            return;
        }
    }

    // توجه: فیلد framework_id برای Go به صورت string ارسال میشود
    const payload = {
        alias: cAlias.value.trim(),
        command: cCommand.value.trim(),
        framework_id: String(currentCmdFrameworkId), 
        description: cDesc.value.trim(),
        options: optionsObj, // ارسال به صورت آبجکت جیسون (json.RawMessage هندل می‌کند)
        is_featured: cFeatured.checked
    };

    saveCmdBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> پردازش...';
    saveCmdBtn.disabled = true;

    try {
        let response;
        if (isCmdEditMode) {
            // Update Request
            response = await fetch(`${CMD_API_URL}/${cId.value}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Create Request
            response = await fetch(`${CMD_API_URL}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'خطا در ذخیره‌سازی دستور');
        }

        showToast(isCmdEditMode ? 'تغییرات دستور ثبت شد.' : 'دستور جدید اضافه شد.', 'success');
        resetCommandForm();
        await fetchCommands();

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        saveCmdBtn.disabled = false;
        saveCmdBtn.innerHTML = '<i class="fas fa-save"></i> ' + (isCmdEditMode ? 'ویرایش دستور' : 'ثبت دستور');
    }
}

function editCommand(id) {
    const cmd = commandsList.find(c => String(c.ID || c.Id || c.id) === String(id));
    if (!cmd) return;

    isCmdEditMode = true;
    cId.value = id;
    cAlias.value = cmd.Alias || cmd.alias;
    cCommand.value = cmd.Command || cmd.command;
    cDesc.value = cmd.Description || cmd.description || '';
    cFeatured.checked = cmd.IsFeatured || cmd.is_featured;
    
    // تبدیل باینری/آبجکت Options به رشته زیبا (Pretty JSON)
    const opts = cmd.Options || cmd.options;
    try {
        cOptions.value = (typeof opts === 'string' && opts.trim() !== '') ? JSON.stringify(JSON.parse(opts), null, 2) : (typeof opts === 'object' ? JSON.stringify(opts, null, 2) : '{}');
    } catch {
        cOptions.value = opts || '{}';
    }

    formTitle.innerHTML = '<i class="fas fa-pen text-persian-cyan"></i> ویرایش دستور';
    saveCmdBtn.innerHTML = '<i class="fas fa-save"></i> اعمال ویرایش';
    cancelCmdBtn.classList.remove('hidden');
}

function confirmDeleteCommand(id, alias) {
    const toastHtml = `
        <div id="confirm-cmd-${id}" class="bg-dark-surface border border-red-500/50 shadow-2xl shadow-red-900/20 rounded-xl p-4 w-80 animate-slide-in relative overflow-hidden z-[100]">
            <div class="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div class="flex items-start gap-3">
                <i class="fas fa-exclamation-triangle text-red-400 text-xl mt-0.5"></i>
                <div>
                    <h4 class="text-white font-bold text-sm mb-1">تایید حذف دستور</h4>
                    <p class="text-gray-400 text-xs mb-3">آیا از حذف دستور "<span class="text-gray-200">${alias}</span>" مطمئن هستید؟</p>
                    <div class="flex gap-2">
                        <button onclick="executeDeleteCommand('${id}')" class="bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">بله</button>
                        <button onclick="document.getElementById('confirm-cmd-${id}').remove()" class="bg-dark-bg border border-white/10 hover:bg-white/5 text-gray-300 px-3 py-1.5 rounded text-xs transition-colors">انصراف</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('toast-container').insertAdjacentHTML('beforeend', toastHtml);
}

async function executeDeleteCommand(id) {
    const confirmBox = document.getElementById(`confirm-cmd-${id}`);
    if(confirmBox) confirmBox.remove();

    try {
        const response = await fetch(`${CMD_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'خطا در حذف دستور');
        }

        showToast('دستور حذف شد.', 'success');
        await fetchCommands();
        
        // ریست فرم اگر در حال ویرایش همان دستور بودیم
        if (isCmdEditMode && cId.value === String(id)) {
            resetCommandForm();
        }

    } catch (error) {
        showToast(error.message, 'error');
    }
}


// ==========================================
// JSON EXPORT LOGIC
// ==========================================

function downloadJSON(data, filename) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 4));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast(`فایل ${filename} با موفقیت دانلود شد.`, 'success');
}

function exportAllFrameworks() {
    if (!frameworksList || frameworksList.length === 0) {
        showToast('هیچ فریم‌ورکی برای خروجی گرفتن وجود ندارد.', 'error');
        return;
    }

    const exportData = {
        type: "crazyDev_Frameworks_Export",
        exported_at: new Date().toISOString(),
        total_frameworks: frameworksList.length,
        frameworks: frameworksList
    };

    downloadJSON(exportData, 'all_frameworks.json');
}

function exportCurrentFramework() {
    if (!commandsList || commandsList.length === 0) {
        showToast('هیچ دستوری برای این فریم‌ورک ثبت نشده است.', 'error');
        return;
    }
    
    const frameworkName = currentCmdFrameworkSlug || 'unknown';
    const exportData = {
        framework_slug: frameworkName,
        exported_at: new Date().toISOString(),
        total_commands: commandsList.length,
        commands: commandsList
    };

    const filename = `${frameworkName}_commands.json`;
    downloadJSON(exportData, filename);
}

// ==========================================
// INITIALIZATION
// ==========================================
// MOCK DATA GENERATOR (Only for UI Testing if API is offline)
function renderFrameworksMock() {
    const mockData = [
        { id: "1", name: "Laravel", slug: "laravel", language: "PHP", description: "فریم‌ورک قدرتمند زبان PHP", is_featured: true },
        { id: "2", name: "Gin", slug: "gin", language: "Go", description: "وب فریم‌ورک سریع برای Go", is_featured: false }
    ];
    frameworksList = mockData;
    renderFrameworks(mockData);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchFrameworks();
});
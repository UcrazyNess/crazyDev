// State Management
let microservicesData = [];
let currentEditId = null;
let currentDeleteId = null;

// Base API Route
const API_BASE = '/microservice';

// Load Data on Initialization
document.addEventListener('DOMContentLoaded', loadData);

async function loadData() {
    const grid = document.getElementById('microservices-grid');
    try {
        const res = await fetch(API_BASE);
        if (res.ok) {
            const responseData = await res.json();
            // کنترل ساختار بازگشتی بک‌اند (آرایه یا آبجکت دارای pagination)
            microservicesData = Array.isArray(responseData) ? responseData : (responseData.items || responseData.data || []);
            renderGrid();
        } else {
            throw new Error('مشکل در دریافت داده‌ها');
        }
    } catch (error) {
        console.warn('API connection failed. Loading dummy data for UI preview.');
        // Dummy data for visual presentation if Go backend is offline
        microservicesData = [
            { slug: 'api-gateway', name: 'API Gateway', source_type: 'build', build: './gateway', restart: 'always', environment: 'PORT=8000\nNODE_ENV=prod' },
            { slug: 'redis-cache', name: 'Redis Cache', source_type: 'pull', image: 'redis:alpine', restart: 'unless-stopped' },
            { slug: 'postgres-db', name: 'PostgreSQL', source_type: 'pull', image: 'postgres:15', restart: 'on-failure', environment: 'POSTGRES_USER=admin' }
        ];
        renderGrid();
        showToast('حالت آفلاین: در حال نمایش داده‌های نمونه', 'info');
    }
}

function renderGrid() {
    const grid = document.getElementById('microservices-grid');
    
    if (microservicesData.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center bg-dark-surface/30 rounded-2xl border border-white/5 border-dashed">
                <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-500 text-2xl mb-4">
                    <i class="fas fa-box-open"></i>
                </div>
                <h3 class="text-white font-title text-xl mb-1">لیست سرویس‌ها خالی است</h3>
                <p class="text-gray-500 text-sm max-w-sm">برای شروع، روی دکمه "افزودن میکروسرویس جدید" در بالای صفحه کلیک کنید.</p>
            </div>`;
        return;
    }

    grid.innerHTML = microservicesData.map(item => {
        const identifier = item.slug || item.id || item.ID;
        const isPull = item.source_type === 'pull';
        
        return `
        <div class="glow-box rounded-2xl p-6 relative overflow-hidden group flex flex-col h-full bg-[#111827]/60" style="border-color: rgba(212, 175, 55, 0.1);">
            <!-- Header -->
            <div class="flex justify-between items-start mb-5">
                <div class="w-12 h-12 bg-dark-bg border border-white/5 rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                    ${isPull 
                        ? '<i class="fab fa-docker text-persian-cyan drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]"></i>' 
                        : '<i class="fas fa-code-branch text-persian-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"></i>'}
                </div>
                
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-[-10px] group-hover:translate-y-0">
                    <button onclick="openModal('${identifier}')" class="text-gray-400 hover:text-persian-gold bg-dark-bg border border-white/5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" title="ویرایش">
                        <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button onclick="openDeleteModal('${identifier}')" class="text-gray-400 hover:text-red-500 bg-dark-bg border border-white/5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors" title="حذف">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <h3 class="text-xl font-bold text-white mb-1 truncate" dir="ltr">${item.name}</h3>
            
            <div class="flex gap-2 mb-5">
                <span class="text-[10px] uppercase tracking-wider font-mono px-2 py-1 rounded bg-white/5 border border-white/10 ${isPull ? 'text-persian-cyan' : 'text-persian-gold'} flex items-center gap-1">
                    ${isPull ? '<i class="fas fa-cloud-download-alt"></i>' : '<i class="fas fa-hammer"></i>'} ${item.source_type}
                </span>
                <span class="text-[10px] uppercase tracking-wider font-mono px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400">
                    <i class="fas fa-sync-alt mr-1"></i> ${item.restart && item.restart !== 'no' ? item.restart : 'No Restart'}
                </span>
            </div>

            <!-- Details Area -->
            <div class="mt-auto bg-dark-bg/80 p-3 rounded-xl border border-white/5 font-mono text-xs text-gray-400 flex flex-col gap-2">
                <div class="flex items-center gap-2 truncate" dir="ltr" title="${isPull ? item.image : item.build}">
                    <span class="text-gray-500 shrink-0">${isPull ? 'IMAGE:' : 'BUILD:'}</span>
                    <span class="${isPull ? 'text-persian-cyan' : 'text-persian-gold'} truncate">
                        ${isPull ? (item.image || 'N/A') : (item.build || 'N/A')}
                    </span>
                </div>
                
                ${item.environment ? `
                <div class="w-full h-px bg-white/5"></div>
                <div class="flex items-center gap-2 truncate" dir="ltr">
                    <span class="text-gray-500 shrink-0">ENV:</span>
                    <span class="text-purple-400 truncate">${item.environment.split('\\n')[0]} ${item.environment.includes('\\n') ? '...' : ''}</span>
                </div>` : ''}
            </div>
        </div>
        `;
    }).join('');
}

// فرم و مدیریت Modal
function toggleSourceFields() {
    const sourceType = document.querySelector('input[name="source_type"]:checked').value;
    const buildSection = document.getElementById('build_section');
    const pullSection = document.getElementById('pull_section');
    
    if (sourceType === 'pull') {
        buildSection.classList.add('hidden', 'opacity-0');
        pullSection.classList.remove('hidden');
        setTimeout(() => pullSection.classList.remove('opacity-0'), 10);
    } else {
        pullSection.classList.add('hidden', 'opacity-0');
        buildSection.classList.remove('hidden');
        setTimeout(() => buildSection.classList.remove('opacity-0'), 10);
    }
}

function openModal(id = null) {
    currentEditId = id;
    const modal = document.getElementById('form-modal');
    const modalContent = document.getElementById('form-modal-content');
    const form = document.getElementById('microservice-form');
    const modalTitle = document.getElementById('modal-title');
    
    form.reset();
    
    if (id) {
        modalTitle.innerHTML = '<i class="fas fa-edit text-persian-gold text-lg"></i> ویرایش پیکربندی';
        const item = microservicesData.find(m => (m.slug || m.id || m.ID).toString() === id.toString());
        
        if (item) {
            form.name.value = item.name || '';
            
            const radios = form.elements['source_type'];
            if (radios) {
                Array.from(radios).forEach(r => r.checked = (r.value === (item.source_type || 'pull')));
            }
            
            form.image.value = item.image || '';
            form.build.value = item.build || '';
            form.dockerfile.value = item.dockerfile || '';
            form.restart.value = item.restart || 'no';
            form.command.value = item.command || '';
            form.environment.value = item.environment || '';
            form.healthcheck.value = item.healthcheck || '';
        }
    } else {
        modalTitle.innerHTML = '<i class="fas fa-plus-circle text-persian-gold text-lg"></i> ایجاد میکروسرویس جدید';
    }
    
    toggleSourceFields();
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    // Animation Trigger
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('form-modal');
    const modalContent = document.getElementById('form-modal-content');
    
    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validation based on backend rules
    if (data.source_type === 'pull') {
        data.build = '';
        data.dockerfile = '';
        if (!data.image.trim()) return showToast('وقتی وضعیت pull است، نام Image اجباری است.', 'error');
    } else {
        data.image = '';
        if (!data.build.trim()) return showToast('وقتی وضعیت build است، مسیر Build اجباری است.', 'error');
    }

    const url = currentEditId ? `${API_BASE}/${currentEditId}` : `${API_BASE}/`;
    const method = currentEditId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast(`سرویس با موفقیت ${currentEditId ? 'بروزرسانی' : 'ایجاد'} شد`);
            closeModal();
            loadData();
        } else {
            const err = await res.json().catch(() => ({error: 'خطای ارتباط با سرور'}));
            showToast(err.error, 'error');
        }
    } catch (err) {
        // Fallback for Preview
        if(currentEditId) {
            const idx = microservicesData.findIndex(m => (m.slug || m.id || m.ID).toString() === currentEditId.toString());
            if (idx > -1) microservicesData[idx] = { ...microservicesData[idx], ...data };
        } else {
            data.slug = data.name.toLowerCase().replace(/\\s+/g, '-');
            microservicesData.push(data);
        }
        showToast('[آفلاین] عملیات با موفقیت شبیه‌سازی شد', 'success');
        closeModal();
        renderGrid();
    }
}

// Delete Modal Management
function openDeleteModal(id) {
    currentDeleteId = id;
    const modal = document.getElementById('delete-modal');
    const modalContent = document.getElementById('delete-modal-content');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modalContent.classList.remove('scale-95');
        modalContent.classList.add('scale-100');
    }, 10);
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    const modalContent = document.getElementById('delete-modal-content');
    
    modal.classList.add('opacity-0');
    modalContent.classList.remove('scale-100');
    modalContent.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        currentDeleteId = null;
    }, 300);
}

async function confirmDelete() {
    if (!currentDeleteId) return;
    
    try {
        const res = await fetch(`${API_BASE}/${currentDeleteId}`, { method: 'DELETE' });
        
        if (res.ok) {
            showToast('میکروسرویس با موفقیت حذف شد');
            closeDeleteModal();
            loadData();
        } else {
            const err = await res.json().catch(() => ({error: 'خطا در حذف'}));
            showToast(err.error, 'error');
        }
    } catch (err) {
        // Fallback for preview
        microservicesData = microservicesData.filter(m => (m.slug || m.id || m.ID).toString() !== currentDeleteId.toString());
        showToast('[آفلاین] میکروسرویس حذف شد', 'info');
        closeDeleteModal();
        renderGrid();
    }
}

// Toast Notification System
function showToast(msg, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-6 right-6 z-[100] flex flex-col gap-3 overflow-hidden px-2 pointer-events-none';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const isSuccess = type === 'success' || type === 'info';
    const bgColor = isSuccess ? 'bg-dark-surface' : 'bg-red-900/20';
    const borderColor = isSuccess ? (type==='info' ? 'border-persian-cyan' : 'border-green-500') : 'border-red-500';
    const icon = isSuccess ? (type==='info' ? 'fa-info-circle text-persian-cyan' : 'fa-check-circle text-green-400') : 'fa-exclamation-circle text-red-400';
    
    toast.className = `flex items-center gap-4 ${bgColor} border ${borderColor} p-4 rounded-xl shadow-lg transform transition-all duration-300 translate-x-[120%] opacity-0 pointer-events-auto backdrop-blur-md`;
    toast.innerHTML = `
        <i class="fas ${icon} text-xl"></i>
        <span class="font-sans text-sm text-white">${msg}</span>
        <button onclick="this.parentElement.remove()" class="mr-auto text-gray-400 hover:text-white transition-colors ml-[-8px]"><i class="fas fa-times text-xs"></i></button>
    `;
    
    container.appendChild(toast);
    
    // Animate In
    setTimeout(() => {
        toast.classList.remove('translate-x-[120%]', 'opacity-0');
    }, 10);
    
    // Auto Remove
    setTimeout(() => {
        if(toast.parentElement) {
            toast.classList.add('translate-x-[120%]', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}
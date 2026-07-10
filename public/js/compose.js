
// DOM Elements
const form = document.getElementById('compose-form');
const formMsg = document.getElementById('form-message');
const btnSubmit = document.getElementById('btn-submit');
const projectsList = document.getElementById('projects-list');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const syncIcon = document.getElementById('sync-icon');

// URL های API بر اساس روت‌هایی که ارسال کردید
// توجه: در روت‌های شما املای genrate به این شکل بوده است
const API_GENERATE = '/compose/genrate'; 
const API_GET_ALL = '/compose/';
const API_DELETE = (id) => `/compose/${id}`;

// دکمه لود سمپل جیسون
function loadSampleJson() {
    const sample = {
        "version": "3.8",
        "services": [
            {
                "name": "web",
                "container_name": "nginx_proxy",
                "image": "nginx:alpine",
                "restart": "unless-stopped",
                "ports": ["80:80", "443:443"],
                "networks": [
                    {"name": "frontend_net"}
                ]
            }
        ],
        "networks": [
            {"name": "frontend_net", "driver": "bridge"}
        ]
    };
    document.getElementById('compose_json').value = JSON.stringify(sample, null, 2);
}

// نمایش پیام در زیر فرم
function showMessage(text, isError = false) {
    formMsg.textContent = text;
    formMsg.className = `text-sm p-3 rounded-lg mt-4 text-center ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`;
    formMsg.classList.remove('hidden');
    setTimeout(() => {
        formMsg.classList.add('hidden');
    }, 5000);
}

// مدیریت سابمیت فرم
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const projectName = document.getElementById('project_name').value;
    const pathe = document.getElementById('pathe').value;
    const ipsRaw = document.getElementById('ips').value;
    const composeJsonStr = document.getElementById('compose_json').value;

    // پردازش آی‌پی‌ها
    const ips = ipsRaw.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    
    // پردازش جیسون
    let composeObj = null;
    try {
        if(composeJsonStr.trim() !== '') {
            composeObj = JSON.parse(composeJsonStr);
        }
    } catch (err) {
        showMessage('فرمت JSON وارد شده نامعتبر است.', true);
        return;
    }

    // آماده سازی ریکوئست
    // بر اساس استراکت Go شما: ProjectName, Pathe, Ips و احتمالا داخل بدنه است
    const payload = {
        project_name: projectName,
        pathe: pathe,
        ips: ips,
        // اگر API شما نیازمند این است که آبجکت کامپوز درون فیلدی به نام compose باشد:
        compose: composeObj || {} 
        // اگر API شما آبجکت ها را مستقیم میگیرد (version, services) باید این را با payload مرج کنید
    };
    // *نکته*: بر اساس کدهای Go شما، استراکت GenerateComposeRequest شامل Version, Services است. 
    // در آپدیت شما CreateAndGenerateRequest ساختید که شامل ProjectName, Path, IPs و Compose است. 
    // فرض می‌کنیم طبق بک‌اند جدید شما، کلید compose استفاده می‌شود. (با فرض رفع نام Pathe به Path)
    
    // به دلیل وجود Pathe در استراکت اصلی شما:
    payload.pathe = pathe; 
    payload.path = pathe; 

    try {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner animate-spin"></i> در حال پردازش...';

        const response = await fetch(API_GENERATE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('پروژه با موفقیت ساخته شد.');
            form.reset();
            fetchProjects(); // بروزرسانی لیست
        } else {
            showMessage(result.error || 'خطا در برقراری ارتباط با سرور', true);
            if(result.duplicated_ips) {
                showMessage(`آی‌پی‌های تکراری: ${result.duplicated_ips.join(', ')}`, true);
            }
        }
    } catch (err) {
        showMessage('خطای شبکه. سرور در دسترس نیست.', true);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-magic"></i><span>تولید و ذخیره (Generate)</span>';
    }
});

// دریافت لیست پروژه‌ها
async function fetchProjects() {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    projectsList.classList.add('hidden');
    syncIcon.classList.add('animate-spin');

    try {
        const response = await fetch(API_GET_ALL);
        if (response.ok) {
            const data = await response.json();
            renderProjects(data);
        } else {
            throw new Error('Failed to fetch');
        }
    } catch (err) {
        console.error("Error fetching projects", err);
        // برای تست زمانی که بک‌اند نیست
        // renderProjects([]); 
    } finally {
        loadingState.classList.add('hidden');
        syncIcon.classList.remove('animate-spin');
    }
}

// رندر کردن پروژه‌ها در DOM
function renderProjects(projects) {
    // فرض میکنیم Gorm صفحه بندی داده یا آرایه را برمیگرداند.
    const list = Array.isArray(projects) ? projects : (projects.data || []);
    
    projectsList.innerHTML = '';

    if (list.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    projectsList.classList.remove('hidden');

    list.forEach(item => {
        // کارت پروژه
        const card = document.createElement('div');
        card.className = 'bg-dark-surface/50 border border-white/5 p-4 rounded-xl hover:border-persian-cyan/30 transition-all flex flex-col justify-between group';
        
        // لیست آی‌پی ها
        let ipsHtml = '';
        if(item.IPs && item.IPs.length > 0) {
            ipsHtml = item.IPs.map(ipObj => `<span class="bg-persian-blue/20 text-persian-cyan border border-persian-blue/30 px-2 py-0.5 rounded text-[10px] font-mono">${ipObj.IPAddress || ipObj}</span>`).join('');
        } else {
            ipsHtml = '<span class="text-[10px] text-gray-600 font-mono">No IPs</span>';
        }

        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-white font-title text-lg flex items-center gap-2">
                        <i class="fab fa-docker text-gray-500 group-hover:text-persian-cyan transition-colors"></i>
                        ${item.ProjectName || item.project_name || 'نامشخص'}
                    </h3>
                    <button onclick="deleteProject(${item.ID || item.id})" class="text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 p-2 rounded-lg transition-all" title="حذف پروژه">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                </div>
                
                <div class="space-y-2 mt-3">
                    <div class="flex flex-col">
                        <span class="text-[10px] text-gray-500 uppercase">Path</span>
                        <span class="text-xs text-gray-300 font-mono bg-[#0B0F19] p-1.5 rounded border border-white/5 truncate" title="${item.Path || item.pathe || '-'}">${item.Path || item.pathe || '-'}</span>
                    </div>
                    
                    <div class="flex flex-col">
                        <span class="text-[10px] text-gray-500 uppercase mb-1">Assigned IPs</span>
                        <div class="flex flex-wrap gap-1">
                            ${ipsHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        projectsList.appendChild(card);
    });
}

// حذف پروژه
async function deleteProject(id) {
    if(!confirm('آیا از حذف این پروژه و تمام سرویس‌ها و شبکه‌های مرتبط مطمئن هستید؟')) return;

    try {
        const response = await fetch(API_DELETE(id), {
            method: 'DELETE',
        });

        if (response.ok) {
            fetchProjects(); // ریلود لیست
        } else {
            const res = await response.json();
            alert(res.error || 'خطا در حذف پروژه');
        }
    } catch(err) {
        alert('خطا در برقراری ارتباط با سرور');
    }
}

// اجرا هنگام لود صفحه
document.addEventListener('DOMContentLoaded', fetchProjects);
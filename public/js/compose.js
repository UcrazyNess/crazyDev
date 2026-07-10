let currentOffset = 0;
const limit = 10;
let totalRows = 0;
let cachedComposes = {}; 
let cachedMicroservices = [];
let currentConfirmCallback = null;

// --- Custom Toast Notifications system ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '<i class="fas fa-check-circle text-xl"></i>';
    if (type === 'error') {
        icon = '<i class="fas fa-exclamation-triangle text-xl"></i>';
    } else if (type === 'info') {
        icon = '<i class="fas fa-info-circle text-xl"></i>';
    }
    
    toast.innerHTML = `${icon} <span class="text-sm font-sans">${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- Custom Confirm Modal dialog ---
function showConfirm(msg, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;
    document.getElementById('confirm-modal-msg').innerText = msg;
    modal.classList.remove('hidden');
    
    setTimeout(() => {
        modal.classList.add('opacity-100');
    }, 50);

    currentConfirmCallback = onConfirm;
}

function hideConfirm() {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;
    modal.classList.remove('opacity-100');
    setTimeout(() => {
        modal.classList.add('hidden');
        currentConfirmCallback = null;
    }, 300);
}

const cancelBtn = document.getElementById('confirm-btn-cancel');
if (cancelBtn) cancelBtn.addEventListener('click', hideConfirm);

const actionBtn = document.getElementById('confirm-btn-action');
if (actionBtn) {
    actionBtn.addEventListener('click', () => {
        if (currentConfirmCallback) {
            currentConfirmCallback();
        }
        hideConfirm();
    });
}

// --- STREAMING_CHUNK:Fetching organization Microservices... ---
// --- Microservices Integration System ---
async function fetchMicroservices() {
    try {
        const response = await fetch('/microservice/');
        if (!response.ok) throw new Error('Could not fetch microservices list');
        
        const resData = await response.json();
        cachedMicroservices = resData.data || [];
        
        const totalMsEl = document.getElementById('stat-total-microservices');
        if (totalMsEl) totalMsEl.innerText = cachedMicroservices.length;
        
        const countEl = document.getElementById('microservice-count');
        if (countEl) countEl.innerText = cachedMicroservices.length;
        
        renderMicroserviceList();
    } catch (err) {
        console.error(err);
        const container = document.getElementById('microservice-list-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4 text-red-400 text-xs">
                    <i class="fas fa-exclamation-circle mb-1"></i> خطا در اتصال به کاتالوگ میکروسرویس‌ها
                </div>
            `;
        }
    }
}

// --- STREAMING_CHUNK:Rendering Microservices inside Sidebar... ---
function renderMicroserviceList() {
    const container = document.getElementById('microservice-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (cachedMicroservices.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-gray-500 text-xs">هیچ میکروسرویسی تعریف نشده است</div>';
        return;
    }

    cachedMicroservices.forEach(item => {
        const card = document.createElement('div');
        card.className = "p-3 rounded-lg bg-dark-surface/40 border border-white/5 hover:border-purple-500/30 transition-all flex justify-between items-center group/card ms-item";
        card.setAttribute('data-name', item.name.toLowerCase());
        card.innerHTML = `
            <div class="flex flex-col gap-1 text-right">
                <div class="text-xs font-bold text-white flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                    ${item.name}
                </div>
                <div class="text-[10px] text-gray-400 font-mono" dir="ltr">${item.image || '(No image)'}</div>
            </div>
            <button onclick="injectMicroservice(${item.id})" class="text-[10px] bg-purple-500/10 text-purple-300 hover:bg-purple-500 hover:text-white px-2 py-1 rounded border border-purple-500/20 transition flex items-center gap-1">
                <i class="fas fa-file-import"></i> درج سریع
            </button>
        `;
        container.appendChild(card);
    });
}

function filterMicroservices() {
    const query = document.getElementById('search-microservice').value.toLowerCase().trim();
    document.querySelectorAll('.ms-item').forEach(el => {
        const name = el.getAttribute('data-name');
        if (name.includes(query)) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}

// --- STREAMING_CHUNK:Injecting selected microservice... ---
function injectMicroservice(id) {
    const ms = cachedMicroservices.find(item => item.id === id);
    if (!ms) {
        showToast('میکروسرویس یافت نشد', 'error');
        return;
    }

    const block = addServiceBlock();
    if (!block) return;
    
    const nameField = block.querySelector('[data-field="name"]');
    if (nameField) nameField.value = ms.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    const imgField = block.querySelector('[data-field="image"]');
    if (imgField) imgField.value = (ms.image || '').trim();
    
    const restartField = block.querySelector('[data-field="restart"]');
    if (restartField) restartField.value = ms.restart || 'always';

    if (ms.environment && ms.environment.trim()) {
        const listContainer = block.querySelector('.envs-list');
        if (listContainer) {
            const rawEnvs = ms.environment.split(',');
            rawEnvs.forEach(pair => {
                const parts = pair.split('=');
                const key = parts[0]?.trim();
                const val = parts[1]?.trim() || '';
                if (key) {
                    const envTpl = document.getElementById('tpl-env').content.cloneNode(true);
                    const inputs = envTpl.querySelectorAll('input');
                    if (inputs.length >= 2) {
                        inputs[0].value = key;
                        inputs[1].value = val;
                        listContainer.appendChild(envTpl);
                    }
                }
            });
        }
    }

    showToast(`میکروسرویس "${ms.name}" با موفقیت درج شد`, 'success');
    handleInputChanged();
}

// --- STREAMING_CHUNK:Collecting Visual Form Data to JSON... ---
function collectFormData(silentMode = false) {
    const projectNameEl = document.getElementById('inp-project-name');
    const projectName = projectNameEl ? projectNameEl.value.trim() : '';
    if (!projectName) {
        if (!silentMode) showToast('نام پروژه الزامی است', 'error');
        return null;
    }

    const rawIpsEl = document.getElementById('inp-ips');
    const rawIps = rawIpsEl ? rawIpsEl.value : '';
    const ipsArray = rawIps.split(',')
                            .map(ip => ip.trim())
                            .filter(ip => ip !== '');

    const versionEl = document.getElementById('inp-version');
    const payload = {
        project_name: projectName,
        ips: ipsArray,
        compose: {
            version: versionEl ? versionEl.value.trim() : '3.8',
            services: [],
            networks: [],
            volumes: []
        }
    };

    let hasValidService = false;
    let blocks = document.querySelectorAll('.service-block');
    
    for (let block of blocks) {
        const sNameInp = block.querySelector('[data-field="name"]');
        const sName = sNameInp ? sNameInp.value.trim() : '';
        
        const imageInp = block.querySelector('[data-field="image"]');
        const image = imageInp ? imageInp.value.trim() : '';

        if (!sName || !image) {
            if (!silentMode && !sName) showToast('یکی از سرویس‌ها فاقد شناسه است', 'error');
            if (!silentMode && !image) showToast('تصویر داکر الزامی است', 'error');
            return null;
        }
        
        hasValidService = true;

        const cNameInp = block.querySelector('[data-field="container_name"]');
        const restartInp = block.querySelector('[data-field="restart"]');
        const userInp = block.querySelector('[data-field="user"]');

        let serviceObj = {
            name: sName,
            image: image,
            container_name: cNameInp ? cNameInp.value.trim() : '',
            restart: restartInp ? restartInp.value : '',
            user: userInp ? userInp.value.trim() : ''
        };

        // Command and Entrypoint parser
        const cmdInp = block.querySelector('[data-field="command"]');
        const cmdVal = cmdInp ? cmdInp.value.trim() : '';
        if (cmdVal) serviceObj.command = cmdVal.split(/\s+/);
        
        const entryInp = block.querySelector('[data-field="entrypoint"]');
        const entrypointVal = entryInp ? entryInp.value.trim() : '';
        if (entrypointVal) serviceObj.entrypoint = entrypointVal.split(/\s+/);

        // Collect Ports array
        const ports = [];
        block.querySelectorAll('.ports-list input').forEach(inp => {
            if (inp.value.trim()) ports.push(inp.value.trim());
        });
        if (ports.length > 0) serviceObj.ports = ports;

        // Collect Environments map
        const envs = {};
        let hasEnv = false;
        block.querySelectorAll('.envs-list > div').forEach(envRow => {
            const inputs = envRow.querySelectorAll('input');
            if (inputs.length >= 2) {
                const k = inputs[0].value.trim();
                const v = inputs[1].value.trim();
                if (k) {
                    envs[k] = v;
                    hasEnv = true;
                }
            }
        });
        if (hasEnv) serviceObj.environment = envs;

        // Collect Service-level Volumes array
        const volumes = [];
        block.querySelectorAll('.service-volumes-list input').forEach(inp => {
            if (inp.value.trim()) volumes.push(inp.value.trim());
        });
        if (volumes.length > 0) serviceObj.volumes = volumes;

        // Collect Service Networks
        const serviceNets = [];
        block.querySelectorAll('.service-networks-list .service-network-row').forEach(netRow => {
            const netNameInp = netRow.querySelector('[data-field="net-name"]');
            const netName = netNameInp ? netNameInp.value.trim() : '';
            if (netName) {
                const netMapObj = { name: netName };
                const netIpInp = netRow.querySelector('[data-field="net-ip"]');
                const netIp = netIpInp ? netIpInp.value.trim() : '';
                if (netIp) netMapObj.ipv4_address = netIp;
                
                const netAliasesInp = netRow.querySelector('[data-field="net-aliases"]');
                const netAliases = netAliasesInp ? netAliasesInp.value.trim() : '';
                if (netAliases) {
                    netMapObj.aliases = netAliases.split(',').map(a => a.trim()).filter(Boolean);
                }
                serviceNets.push(netMapObj);
            }
        });
        if (serviceNets.length > 0) serviceObj.networks = serviceNets;

        // Collect Service Dependencies
        const depends = [];
        block.querySelectorAll('.service-depends-list input').forEach(inp => {
            if (inp.value.trim()) depends.push(inp.value.trim());
        });
        if (depends.length > 0) serviceObj.depends_on = depends;

        // Merge RAW Custom Configuration JSON (from custom YAML config box)
        const extraYamlEl = block.querySelector('[data-field="extra_config"]');
        const extraYamlStr = extraYamlEl ? extraYamlEl.value.trim() : '';
        if (extraYamlStr) {
            try {
                const extraParsed = jsyaml.load(extraYamlStr);
                if (extraParsed && typeof extraParsed === 'object') {
                    Object.assign(serviceObj, extraParsed);
                }
            } catch (e) {
                if (!silentMode) showToast(`خطا در فرمت کدهای YAML کانتینر ${sName}`, 'error');
                console.error('YAML error inside service block:', e);
            }
        }

        // Clean empty keys
        Object.keys(serviceObj).forEach(k => serviceObj[k] === '' && delete serviceObj[k]);

        payload.compose.services.push(serviceObj);
    }

    if (!hasValidService) {
        if (!silentMode) showToast('حداقل یک سرویس با ساختار معتبر باید وجود داشته باشد', 'error');
        return null;
    }

    // Collect Global Networks with optional advanced configuration inside YAML textareas
    document.querySelectorAll('.network-block').forEach(block => {
        const nNameInp = block.querySelector('[data-field="name"]');
        const nName = nNameInp ? nNameInp.value.trim() : '';
        if (nName) {
            const driverSel = block.querySelector('[data-field="driver"]');
            const netObj = {
                name: nName,
                driver: driverSel ? driverSel.value : 'bridge'
            };
            const extraNetEl = block.querySelector('[data-field="extra"]');
            const extraNetYaml = extraNetEl ? extraNetEl.value.trim() : '';
            if (extraNetYaml) {
                try {
                    const extraNetParsed = jsyaml.load(extraNetYaml);
                    if (extraNetParsed && typeof extraNetParsed === 'object') {
                        Object.assign(netObj, extraNetParsed);
                    }
                } catch(e){}
            }
            payload.compose.networks.push(netObj);
        }
    });

    // Collect Global Volumes with optional advanced config
    document.querySelectorAll('.volume-block').forEach(block => {
        const vNameInp = block.querySelector('[data-field="name"]');
        const vName = vNameInp ? vNameInp.value.trim() : '';
        if (vName) {
            const volObj = { name: vName };
            const extraVolEl = block.querySelector('[data-field="extra"]');
            const extraVolYaml = extraVolEl ? extraVolEl.value.trim() : '';
            if (extraVolYaml) {
                try {
                    const extraVolParsed = jsyaml.load(extraVolYaml);
                    if (extraVolParsed && typeof extraVolParsed === 'object') {
                        Object.assign(volObj, extraVolParsed);
                    }
                } catch(e){}
            }
            payload.compose.volumes.push(volObj);
        }
    });

    return payload;
}

// --- STREAMING_CHUNK:Live YAML Code Generation & Rendering... ---
// --- Live Preview Rendering ---
function handleInputChanged() {
    const payload = collectFormData(true);
    const container = document.getElementById('yaml-live-preview');
    if (!container) return;
    
    if (!payload || !payload.compose || payload.compose.services.length === 0) {
        container.innerText = "# هیچ سرویس پشته‌ای برای شبیه‌سازی پیکربندی وجود ندارد.";
        return;
    }

    try {
        const spec = {
            version: payload.compose.version || "3.8",
            services: {}
        };

        payload.compose.services.forEach(srv => {
            const srvSpec = {};
            Object.keys(srv).forEach(key => {
                if (key !== 'name') {
                    srvSpec[key] = srv[key];
                }
            });
            
            // Format networks to standard docker map format if they are structured as arrays
            if (srv.networks && Array.isArray(srv.networks)) {
                srvSpec.networks = {};
                srv.networks.forEach(net => {
                    const mapVal = {};
                    if (net.ipv4_address) mapVal.ipv4_address = net.ipv4_address;
                    if (net.aliases) mapVal.aliases = net.aliases;
                    srvSpec.networks[net.name] = Object.keys(mapVal).length > 0 ? mapVal : {};
                });
            }

            spec.services[srv.name] = srvSpec;
        });

        if (payload.compose.networks && payload.compose.networks.length > 0) {
            spec.networks = {};
            payload.compose.networks.forEach(net => {
                const netSpec = {};
                Object.keys(net).forEach(key => {
                    if (key !== 'name') netSpec[key] = net[key];
                });
                spec.networks[net.name] = Object.keys(netSpec).length > 0 ? netSpec : {};
            });
        }

        if (payload.compose.volumes && payload.compose.volumes.length > 0) {
            spec.volumes = {};
            payload.compose.volumes.forEach(vol => {
                const volSpec = {};
                Object.keys(vol).forEach(key => {
                    if (key !== 'name') volSpec[key] = vol[key];
                });
                spec.volumes[vol.name] = Object.keys(volSpec).length > 0 ? volSpec : {};
            });
        }

        const yamlStr = jsyaml.dump(spec, { indent: 2, lineWidth: -1 });
        container.innerText = yamlStr;
    } catch (err) {
        container.innerText = `# خطای فرمت‌بندی YAML: ${err.message}`;
    }
}

function copyYamlToClipboard() {
    const pre = document.getElementById('yaml-live-preview');
    if (!pre) return;
    const textarea = document.createElement('textarea');
    textarea.value = pre.innerText;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) showToast('کد YAML با موفقیت در کلیپ‌بورد کپی شد', 'success');
        else showToast('کپی کردن ناموفق بود', 'error');
    } catch (err) {
        showToast('مرورگر از کپی پشتیبانی نمی‌کند', 'error');
    }
    document.body.removeChild(textarea);
}

// --- STREAMING_CHUNK:Toggling Workspace Views... ---
// --- UI View Switching ---
function openEditor(editId = null) {
    const listPanel = document.getElementById('view-list');
    const editorPanel = document.getElementById('view-editor');
    if (!listPanel || !editorPanel) return;

    listPanel.classList.add('hidden', 'opacity-0');
    editorPanel.classList.remove('hidden');
    setTimeout(() => editorPanel.classList.remove('opacity-0'), 50);

    resetForm();
    
    if (editId) {
        const editorTitle = document.getElementById('editor-title');
        if (editorTitle) editorTitle.innerText = 'ویرایش ارکستراسیون موجود';
        
        const editIdInp = document.getElementById('edit-id');
        if (editIdInp) editIdInp.value = editId;
        
        populateFormForEdit(editId);
    } else {
        const editorTitle = document.getElementById('editor-title');
        if (editorTitle) editorTitle.innerText = 'ایجاد ارکستراسیون جدید';
        addServiceBlock(); 
    }
    handleInputChanged();
}

function closeEditor() {
    const editorPanel = document.getElementById('view-editor');
    if (editorPanel) editorPanel.classList.add('opacity-0');
    
    setTimeout(() => {
        if (editorPanel) editorPanel.classList.add('hidden');
        const listView = document.getElementById('view-list');
        if (listView) {
            listView.classList.remove('hidden');
            setTimeout(() => listView.classList.remove('opacity-0'), 50);
        }
    }, 300);
    loadComposes(); 
}

// --- STREAMING_CHUNK:Managing Visual DOM Elements dynamically... ---
// --- Visual Form Element Management ---
function addServiceBlock() {
    const templateEl = document.getElementById('tpl-service');
    const container = document.getElementById('services-container');
    if (!templateEl || !container) return null;

    const tpl = templateEl.content.cloneNode(true);
    container.appendChild(tpl);
    
    const blocks = container.querySelectorAll('.service-block');
    const lastBlock = blocks[blocks.length - 1];
    
    checkEmptyServices();
    handleInputChanged();
    return lastBlock;
}

function checkEmptyServices() {
    const container = document.getElementById('services-container');
    const msg = document.getElementById('no-services-msg');
    if (!container || !msg) return;

    if (container.querySelectorAll('.service-block').length === 0) {
        msg.style.display = 'block';
    } else {
        msg.style.display = 'none';
    }
}

function addNetworkBlock() {
    const templateEl = document.getElementById('tpl-network');
    const container = document.getElementById('networks-container');
    if (!templateEl || !container) return;

    const tpl = templateEl.content.cloneNode(true);
    container.appendChild(tpl);
    handleInputChanged();
}

function addVolumeBlock() {
    const templateEl = document.getElementById('tpl-volume');
    const container = document.getElementById('volumes-container');
    if (!templateEl || !container) return;

    const tpl = templateEl.content.cloneNode(true);
    container.appendChild(tpl);
    handleInputChanged();
}

function addPort(btnElement) {
    const templateEl = document.getElementById('tpl-port');
    if (!templateEl) return;
    const tpl = templateEl.content.cloneNode(true);
    btnElement.closest('div').nextElementSibling.appendChild(tpl);
    handleInputChanged();
}

function addEnv(btnElement) {
    const templateEl = document.getElementById('tpl-env');
    if (!templateEl) return;
    const tpl = templateEl.content.cloneNode(true);
    btnElement.closest('div').nextElementSibling.appendChild(tpl);
    handleInputChanged();
}

function addServiceVolume(btnElement) {
    const templateEl = document.getElementById('tpl-service-volume');
    if (!templateEl) return;
    const tpl = templateEl.content.cloneNode(true);
    btnElement.closest('div').nextElementSibling.appendChild(tpl);
    handleInputChanged();
}

function addServiceDepend(btnElement) {
    const templateEl = document.getElementById('tpl-service-depend');
    if (!templateEl) return;
    const tpl = templateEl.content.cloneNode(true);
    btnElement.closest('div').nextElementSibling.appendChild(tpl);
    handleInputChanged();
}

function addServiceNetwork(btnElement) {
    const templateEl = document.getElementById('tpl-service-network');
    if (!templateEl) return;
    const tpl = templateEl.content.cloneNode(true);
    btnElement.closest('div').nextElementSibling.appendChild(tpl);
    handleInputChanged();
}

// --- STREAMING_CHUNK:Resetting Workspace Form to Defaults... ---
function resetForm() {
    const editIdInp = document.getElementById('edit-id');
    if (editIdInp) editIdInp.value = '';
    
    const projNameInp = document.getElementById('inp-project-name');
    if (projNameInp) projNameInp.value = '';
    
    const ipsInp = document.getElementById('inp-ips');
    if (ipsInp) ipsInp.value = '';
    
    const versionInp = document.getElementById('inp-version');
    if (versionInp) versionInp.value = '3.8';
    
    const servicesContainer = document.getElementById('services-container');
    if (servicesContainer) servicesContainer.innerHTML = '';
    
    checkEmptyServices();
    
    const netsContainer = document.getElementById('networks-container');
    if (netsContainer) netsContainer.innerHTML = '';
    
    const volsContainer = document.getElementById('volumes-container');
    if (volsContainer) volsContainer.innerHTML = '';
}

// --- STREAMING_CHUNK:Parsing Complex YAML back to Visual Elements... ---
// --- Full Robust Rebuilder / Reverse-parser from YAML content to Visual UI ---
function populateFormForEdit(id) {
    const item = cachedComposes[id];
    if (!item) {
        showToast('پروژه مورد نظر در کش مرورگر یافت نشد', 'error');
        return;
    }

    const pName = item.ProjectName || item.project_name || '';
    const yContent = item.YAMLContent || item.yaml_content || '';
    const ips = item.IPs || item.ips || [];

    const projNameInp = document.getElementById('inp-project-name');
    if (projNameInp) projNameInp.value = pName;
    
    if (ips && ips.length > 0) {
        const ipsInp = document.getElementById('inp-ips');
        if (ipsInp) {
            ipsInp.value = ips.map(ip => ip.ip_address || ip.IPAddress || '').filter(Boolean).join(', ');
        }
    }

    if (!yContent) {
        addServiceBlock();
        return;
    }

    // Verify JS-YAML library is loaded successfully (CDN filtering guard)
    if (typeof jsyaml === 'undefined') {
        console.error('JS-YAML library is not loaded!');
        showToast('خطا: کتابخانه پردازشگر YAML لود نشده است. احتمالاً به دلیل فیلترینگ اینترنت یا عدم دسترسی به CDN.', 'error');
        addServiceBlock();
        return;
    }

    try {
        const doc = jsyaml.load(yContent);
        if (!doc) {
            addServiceBlock();
            return;
        }

        const servicesContainer = document.getElementById('services-container');
        if (servicesContainer) servicesContainer.innerHTML = '';

        // Populate Version
        const versionInput = document.getElementById('inp-version');
        if (versionInput) versionInput.value = doc.version || '3.8';

        // Populate Services
        if (doc.services) {
            Object.keys(doc.services).forEach(srvKey => {
                const srvVal = doc.services[srvKey] || {};
                const block = addServiceBlock();
                if (!block) return;
                
                const nameInp = block.querySelector('[data-field="name"]');
                if (nameInp) nameInp.value = srvKey;

                const imgInp = block.querySelector('[data-field="image"]');
                if (imgInp) imgInp.value = srvVal.image || '';

                const containerInp = block.querySelector('[data-field="container_name"]');
                if (containerInp) containerInp.value = srvVal.container_name || '';

                const restartInp = block.querySelector('[data-field="restart"]');
                if (restartInp) restartInp.value = srvVal.restart || '';

                const userInp = block.querySelector('[data-field="user"]');
                if (userInp) userInp.value = srvVal.user || '';

                // Rebuild command & entrypoint safely
                if (srvVal.command) {
                    const cmdInp = block.querySelector('[data-field="command"]');
                    if (cmdInp) {
                        cmdInp.value = Array.isArray(srvVal.command) ? srvVal.command.join(' ') : srvVal.command.toString();
                    }
                }
                if (srvVal.entrypoint) {
                    const entryInp = block.querySelector('[data-field="entrypoint"]');
                    if (entryInp) {
                        entryInp.value = Array.isArray(srvVal.entrypoint) ? srvVal.entrypoint.join(' ') : srvVal.entrypoint.toString();
                    }
                }

                // Rebuild Ports
                if (srvVal.ports && Array.isArray(srvVal.ports)) {
                    const portsList = block.querySelector('.ports-list');
                    if (portsList) {
                        srvVal.ports.forEach(portStr => {
                            const portTpl = document.getElementById('tpl-port').content.cloneNode(true);
                            const portInp = portTpl.querySelector('input');
                            if (portInp) portInp.value = portStr.toString();
                            portsList.appendChild(portTpl);
                        });
                    }
                }

                // Rebuild Environments (supports Map and Array strings)
                if (srvVal.environment) {
                    const envsList = block.querySelector('.envs-list');
                    if (envsList) {
                        if (Array.isArray(srvVal.environment)) {
                            srvVal.environment.forEach(envStr => {
                                if (typeof envStr === 'string') {
                                    const parts = envStr.split('=');
                                    const envTpl = document.getElementById('tpl-env').content.cloneNode(true);
                                    const inputs = envTpl.querySelectorAll('input');
                                    if (inputs.length >= 2) {
                                        inputs[0].value = parts[0]?.trim() || '';
                                        inputs[1].value = parts[1]?.trim() || '';
                                        envsList.appendChild(envTpl);
                                    }
                                }
                            });
                        } else if (typeof srvVal.environment === 'object' && srvVal.environment !== null) {
                            Object.keys(srvVal.environment).forEach(key => {
                                const envTpl = document.getElementById('tpl-env').content.cloneNode(true);
                                const inputs = envTpl.querySelectorAll('input');
                                if (inputs.length >= 2) {
                                    inputs[0].value = key;
                                    inputs[1].value = srvVal.environment[key] !== null ? srvVal.environment[key].toString() : '';
                                    envsList.appendChild(envTpl);
                                }
                            });
                        }
                    }
                }

                // Rebuild Service Volumes
                if (srvVal.volumes && Array.isArray(srvVal.volumes)) {
                    const srvVolsList = block.querySelector('.service-volumes-list');
                    if (srvVolsList) {
                        srvVal.volumes.forEach(volStr => {
                            const volTpl = document.getElementById('tpl-service-volume').content.cloneNode(true);
                            const volInp = volTpl.querySelector('input');
                            if (volInp) volInp.value = volStr.toString();
                            srvVolsList.appendChild(volTpl);
                        });
                    }
                }

                // Rebuild Service Networks mapping (Super Robust normalizer)
                let normalizedNets = [];
                if (srvVal.networks) {
                    if (Array.isArray(srvVal.networks)) {
                        srvVal.networks.forEach(netItem => {
                            if (typeof netItem === 'string') {
                                normalizedNets.push({ name: netItem });
                            } else if (typeof netItem === 'object' && netItem !== null) {
                                const keys = Object.keys(netItem);
                                if (keys.length > 0) {
                                    const netName = keys[0];
                                    const netDetails = netItem[netName] || {};
                                    normalizedNets.push({
                                        name: netName,
                                        ipv4_address: netDetails.ipv4_address || netDetails.ipv4 || '',
                                        aliases: Array.isArray(netDetails.aliases) ? netDetails.aliases : []
                                    });
                                }
                            }
                        });
                    } else if (typeof srvVal.networks === 'object' && srvVal.networks !== null) {
                        Object.keys(srvVal.networks).forEach(netName => {
                            const netDetails = srvVal.networks[netName] || {};
                            normalizedNets.push({
                                name: netName,
                                ipv4_address: netDetails.ipv4_address || netDetails.ipv4 || '',
                                aliases: Array.isArray(netDetails.aliases) ? netDetails.aliases : []
                            });
                        });
                    }
                }
                if (normalizedNets.length > 0) {
                    const netsList = block.querySelector('.service-networks-list');
                    if (netsList) {
                        normalizedNets.forEach(netObj => {
                            const netTpl = document.getElementById('tpl-service-network').content.cloneNode(true);
                            const nameInp = netTpl.querySelector('[data-field="net-name"]');
                            const ipInp = netTpl.querySelector('[data-field="net-ip"]');
                            const aliasInp = netTpl.querySelector('[data-field="net-aliases"]');
                            if (nameInp) nameInp.value = netObj.name || '';
                            if (ipInp) ipInp.value = netObj.ipv4_address || '';
                            if (aliasInp) aliasInp.value = Array.isArray(netObj.aliases) ? netObj.aliases.join(', ') : '';
                            netsList.appendChild(netTpl);
                        });
                    }
                }

                // Rebuild Dependencies
                if (srvVal.depends_on && Array.isArray(srvVal.depends_on)) {
                    const dependsList = block.querySelector('.service-depends-list');
                    if (dependsList) {
                        srvVal.depends_on.forEach(depStr => {
                            const depTpl = document.getElementById('tpl-service-depend').content.cloneNode(true);
                            const depInp = depTpl.querySelector('input');
                            if (depInp) depInp.value = depStr.toString();
                            dependsList.appendChild(depTpl);
                        });
                    }
                }

                // Parse Unrecognized items to RAW YAML configurations
                const standardMappedKeys = [
                    'image', 'container_name', 'restart', 'user', 'ports', 'environment',
                    'volumes', 'networks', 'depends_on', 'command', 'entrypoint'
                ];
                const extraObj = {};
                Object.keys(srvVal).forEach(key => {
                    if (!standardMappedKeys.includes(key)) {
                        extraObj[key] = srvVal[key];
                    }
                });
                if (Object.keys(extraObj).length > 0) {
                    try {
                        const extraConfigInp = block.querySelector('[data-field="extra_config"]');
                        if (extraConfigInp) {
                            extraConfigInp.value = jsyaml.dump(extraObj, { indent: 2 });
                        }
                    } catch (e) {
                        console.error('Extra yaml config builder error:', e);
                    }
                }
            });
        } else {
            addServiceBlock();
        }

        // Rebuild Global Networks
        if (doc.networks) {
            const netContainer = document.getElementById('networks-container');
            if (netContainer) {
                Object.keys(doc.networks).forEach(netName => {
                    const netVal = doc.networks[netName] || {};
                    const netTpl = document.getElementById('tpl-network').content.cloneNode(true);
                    
                    const nameInp = netTpl.querySelector('[data-field="name"]');
                    const driverInp = netTpl.querySelector('[data-field="driver"]');
                    if (nameInp) nameInp.value = netName;
                    if (driverInp) driverInp.value = netVal.driver || 'bridge';
                    
                    // Remaining keys
                    const netExtra = {};
                    Object.keys(netVal).forEach(k => {
                        if (k !== 'driver') netExtra[k] = netVal[k];
                    });
                    if (Object.keys(netExtra).length > 0) {
                        try {
                            const extraInp = netTpl.querySelector('[data-field="extra"]');
                            if (extraInp) extraInp.value = jsyaml.dump(netExtra, { indent: 2 });
                        } catch(e){}
                    }
                    
                    netContainer.appendChild(netTpl);
                });
            }
        }

        // Rebuild Global Volumes
        if (doc.volumes) {
            const volContainer = document.getElementById('volumes-container');
            if (volContainer) {
                Object.keys(doc.volumes).forEach(volName => {
                    const volTpl = document.getElementById('tpl-volume').content.cloneNode(true);
                    const nameInp = volTpl.querySelector('[data-field="name"]');
                    if (nameInp) nameInp.value = volName;

                    const volVal = doc.volumes[volName] || {};
                    if (volVal && Object.keys(volVal).length > 0) {
                        try {
                            const extraInp = volTpl.querySelector('[data-field="extra"]');
                            if (extraInp) extraInp.value = jsyaml.dump(volVal, { indent: 2 });
                        } catch(e){}
                    }
                    volContainer.appendChild(volTpl);
                });
            }
        }

        checkEmptyServices();
        handleInputChanged();
        showToast('پیکربندی داکر کامپوز با موفقیت بازسازی بصری شد', 'info');
    } catch (err) {
        console.error('YAML Reconstruct error:', err);
        showToast('خطا در تجزیه کدهای YAML: ' + err.message, 'error');
        addServiceBlock();
    }
}

// --- STREAMING_CHUNK:Interacting with REST APIs... ---
// --- API Integration Operations ---
async function loadComposes() {
    const tbody = document.getElementById('compose-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" class="py-8 text-center"><i class="fas fa-spinner fa-spin text-persian-cyan"></i> در حال دریافت ارکسترها...</td></tr>';
    
    try {
        const response = await fetch(`/compose/?offset=${currentOffset}`);
        if (!response.ok) throw new Error('API query failed');
        
        const resData = await response.json();
        const data = resData.data || [];
        totalRows = resData.total_rows || 0;
        
        const totalProjEl = document.getElementById('stat-total-projects');
        if (totalProjEl) totalProjEl.innerText = totalRows;
        let reservedIps = 0;
        
        tbody.innerHTML = '';
        cachedComposes = {};
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-gray-500 text-sm">هیچ پشته داکر کامپوزی یافت نشد.</td></tr>';
        } else {
            data.forEach(item => {
                const id = item.ID || item.id;
                const pName = item.ProjectName || item.project_name || 'نامشخص';
                const ips = item.IPs || item.ips || [];

                cachedComposes[id] = item; 
                
                const ipListStr = ips.map(ip => {
                    reservedIps++;
                    return ip.ip_address || ip.IPAddress || '';
                }).filter(Boolean).join(', ');
                
                const tr = document.createElement('tr');
                tr.className = "border-b border-white/5 hover:bg-white/5 transition-colors";
                tr.innerHTML = `
                    <td class="py-3.5 px-6 font-mono text-gray-400">#${id}</td>
                    <td class="py-3.5 px-6 font-bold text-white flex items-center gap-2">
                        <i class="fab fa-docker text-blue-400"></i> ${pName}
                    </td>
                    <td class="py-3.5 px-6 font-mono text-xs text-persian-cyan">${ipListStr || '-'}</td>
                    <td class="py-3.5 px-6 text-center">
                        <div class="flex justify-center gap-3">
                            <button onclick="downloadCompose(${id})" class="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-all flex items-center justify-center" title="دانلود YAML">
                                <i class="fas fa-download"></i>
                            </button>
                            <button onclick="openEditor(${id})" class="w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all flex items-center justify-center" title="ویرایش بصری">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteCompose(${id})" class="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all flex items-center justify-center" title="حذف پشته">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        const totalIpsEl = document.getElementById('stat-total-ips');
        if (totalIpsEl) totalIpsEl.innerText = reservedIps;
        updatePaginationControls();
        
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4" class="py-8 text-center text-red-400 text-sm">خطا در دریافت اطلاعات از سرور GIN. لطفاً دوباره تلاش کنید.</td></tr>';
    }
}

function updatePaginationControls() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const info = document.getElementById('pagination-info');
    
    if (btnPrev) btnPrev.disabled = currentOffset === 0;
    if (btnNext) btnNext.disabled = (currentOffset + limit) >= totalRows;
    
    if (info) {
        const start = totalRows === 0 ? 0 : currentOffset + 1;
        const end = Math.min(currentOffset + limit, totalRows);
        info.innerText = `نمایش ${start} تا ${end} از مجموع ${totalRows} پشته ارکستری`;
    }
}

function changePage(direction) {
    currentOffset += direction * limit;
    if (currentOffset < 0) currentOffset = 0;
    loadComposes();
}

// --- STREAMING_CHUNK:Compiling and Sending save/update requests... ---
// --- Save Request ---
async function saveCompose() {
    const payload = collectFormData(false);
    if (!payload) return; 

    const editIdInp = document.getElementById('edit-id');
    const editId = editIdInp ? editIdInp.value : '';
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/compose/${editId}` : '/compose/genrate'; 

    try {
        const btn = document.getElementById('btn-save-orchestration');
        if (!btn) return;
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال کامپایل روی دیتابیس...';
        btn.disabled = true;

        if (editId) {
            const targetPath = "./storage/docker-Compose/";
            payload.Path = targetPath;
            payload.path = targetPath;
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok) {
            showToast(data.message || 'عملیات پشته‌بندی با موفقیت اعمال شد');
            closeEditor(); 
        } else {
            let errMsg = data.error || 'خطا در ثبت کامپوز';
            if (data.duplicated_ips) {
                errMsg += ` (IPهای متخاصم: ${data.duplicated_ips.join(', ')})`;
            }
            showToast(errMsg, 'error');
        }
        
        btn.innerHTML = oldHtml;
        btn.disabled = false;

    } catch (error) {
        showToast('خطا در ارتباط شبکه با سرور', 'error');
        console.error(error);
        const btn = document.getElementById('btn-save-orchestration');
        if (btn) btn.disabled = false;
    }
}

// --- Delete Operation ---
function deleteCompose(id) {
    const item = cachedComposes[id];
    const pName = item ? (item.ProjectName || item.project_name) : `#${id}`;
    
    showConfirm(`آیا از حذف دائم پشته داکر کامپوز "${pName}" و آزادسازی تمام IPهای رزرو شده اطمینان کامل دارید؟`, async () => {
        try {
            const response = await fetch(`/compose/${id}`, { method: 'DELETE' });
            const data = await response.json();
            
            if (response.ok) {
                showToast(data.message || 'پروژه حذف شد', 'success');
                loadComposes();
            } else {
                showToast(data.error || 'خطا در حذف پروژه', 'error');
            }
        } catch (error) {
            showToast('خطا در ارتباط با سرور', 'error');
        }
    });
}

// --- STREAMING_CHUNK:Downloading Orchestration YAML... ---
// --- Download YAML file ---
async function downloadCompose(id) {
    try {
        const response = await fetch(`/compose/download/${id}`);
        const data = await response.json();
        
        if (response.ok && data.url) {
            const a = document.createElement('a');
            a.href = data.url;
            a.target = '_blank';
            a.download = data.url.split('/').pop() || 'docker-compose.yml'; 
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('بارگیری فایل داکر کامپوز آغاز شد', 'success');
        } else {
            showToast(data.error || 'فایل تولیدی یافت نشد', 'error');
        }
    } catch (error) {
        showToast('خطای زیرساختی در دریافت لینک بارگیری', 'error');
    }
}

// --- On Application Startup ---
window.onload = function() {
    loadComposes();
    fetchMicroservices();
};

const SUPABASE_URL = 'https://onktkbnsvrjotxfdqpai.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ua3RrYm5zdnJqb3R4ZmRxcGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTQyMjQsImV4cCI6MjA3ODc3MDIyNH0.-5k7sgBW42BaY1-7aep6P1BeWZT6XBXq5GbCrK8bWek';
const TABLE_NAME = 'numbers';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let data = [];
let filteredData = [];
let selectedColumns = [];
let editingRowId = null;

const SHOW_COLUMNS = [
    "WhatsApp Status",
    "Review Status",
    "Blocked Date",
    "No of Days",
    "Unblocked Date",
    "Recharge Date"
];

const DATE_COLUMNS = ["Blocked Date", "Unblocked Date", "Recharge Date"];

function isDateColumn(col) {
    return DATE_COLUMNS.includes(col);
}

function calculateDays(blockedDateStr) {
    if (!blockedDateStr || blockedDateStr === "NA" || blockedDateStr === "") {
        return "NA";
    }
    try {
        const today = new Date();
        const blockedDate = new Date(blockedDateStr);
        if (isNaN(blockedDate.getTime())) return "NA";
        today.setHours(0, 0, 0, 0);
        blockedDate.setHours(0, 0, 0, 0);
        const diffMs = today.getTime() - blockedDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 3600 * 24)) + 1;
        return diffDays > 0 ? diffDays.toString() : "1";
    } catch (error) {
        return "NA";
    }
}

function showMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = 'message ' + type;
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

async function loadData() {
    try {
        console.log('📡 Fetching data from Supabase...');
        const { data: fetchedData, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*');

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        console.log('✅ Data fetched:', fetchedData);
        return fetchedData;
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// ============================================
// FILTER/SEARCH FUNCTIONALITY
// ============================================

function createSearchBox() {
    const controlsSection = document.querySelector('.header');
    if (!controlsSection) return;

    const searchContainer = document.createElement('div');
    searchContainer.style.display = 'flex';
    searchContainer.style.alignItems = 'center';
    searchContainer.style.gap = '10px';
    searchContainer.style.justifyContent = 'flex-end';

    searchContainer.innerHTML = `
        <label for="searchInput" style="font-weight: 600; color: #333; font-size: 14px; white-space: nowrap;">
            🔍 Search:
        </label>
        <input 
            type="text" 
            id="searchInput" 
            placeholder="Search by name, number, status..."
            style="
                width: 300px;
                padding: 8px 12px;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                font-size: 14px;
            "
        />
    `;
    controlsSection.appendChild(searchContainer);

    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterTable(e.target.value);
    });
}


function createSearchBoxDashboard() {
    const header = document.querySelector('.header');
    if (!header) return;

    const searchContainer = document.createElement('div');
    searchContainer.style.display = 'flex';
    searchContainer.style.alignItems = 'center';
    searchContainer.style.gap = '10px';
    searchContainer.style.justifyContent = 'flex-end';

    searchContainer.innerHTML = `
        <label for="searchInputDash" style="font-weight: 600; color: #333; font-size: 14px; white-space: nowrap;">
            🔍 Search:
        </label>
        <input 
            type="text" 
            id="searchInputDash" 
            placeholder="Search by name, number, status..."
            style="
                width: 300px;
                padding: 8px 12px;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                font-size: 14px;
            "
        />
    `;
    header.appendChild(searchContainer);

    document.getElementById('searchInputDash').addEventListener('input', (e) => {
        filterTableDashboard(e.target.value);
    });
}


function filterTable(searchTerm) {
    const searchLower = searchTerm.toLowerCase();

    if (!searchTerm || searchTerm.trim() === '') {
        filteredData = [...data];
    } else {
        filteredData = data.filter(row => {
            return Object.values(row).some(value =>
                String(value || '').toLowerCase().includes(searchLower)
            );
        });
    }

    renderUpdateDateTable();
}

function filterTableDashboard(searchTerm) {
    const searchLower = searchTerm.toLowerCase();

    if (!searchTerm || searchTerm.trim() === '') {
        filteredData = [...data];
    } else {
        filteredData = data.filter(row => {
            return Object.values(row).some(value =>
                String(value || '').toLowerCase().includes(searchLower)
            );
        });
    }

    renderDashboardTable();
}

// ============================================
// UPDATE DATE PAGE FUNCTIONS
// ============================================

async function initUpdateDatePage() {
    console.log('🚀 Initializing Update Date page...');

    try {
        const fetchedData = await loadData();

        data = fetchedData.map(item => {
            const filtered = {
                id: item.id,
                Number: item.Number || ''
            };
            SHOW_COLUMNS.forEach(col => {
                filtered[col] = item[col] || '';
            });
            return filtered;
        });

        filteredData = [...data];
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dataTable').style.display = 'table';

        createSearchBox();
        createColumnSelector();
        renderUpdateDateTable();
        updateSelectedCount();
    } catch (error) {
        document.getElementById('loading').innerHTML =
            `<div style="color: red;">❌ Error loading data: ${error.message}<br><br>
            Check console for details.</div>`;
        showMessage('❌ Error loading data: ' + error.message, 'error');
    }
}

function createColumnSelector() {
    const selector = document.getElementById('columnSelector');
    if (!selector) return;

    SHOW_COLUMNS.forEach(col => {
        if (col === "No of Days") return;

        const label = document.createElement('label');
        label.className = 'column-checkbox';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = col;
        const span = document.createElement('span');
        span.textContent = col;

        label.appendChild(checkbox);
        label.appendChild(span);

        label.addEventListener('click', (e) => {
            if (e.target === checkbox) return;
            checkbox.checked = !checkbox.checked;
            toggleColumn(checkbox);
        });

        checkbox.addEventListener('change', () => toggleColumn(checkbox));
        selector.appendChild(label);
    });
}

function toggleColumn(checkbox) {
    const col = checkbox.value;
    const label = checkbox.closest('.column-checkbox');

    if (checkbox.checked) {
        if (!selectedColumns.includes(col)) {
            selectedColumns.push(col);
            label.classList.add('checked');
        }
    } else {
        selectedColumns = selectedColumns.filter(c => c !== col);
        label.classList.remove('checked');
    }

    updateSelectedCount();
    renderUpdateDateTable();
}

function updateSelectedCount() {
    const countEl = document.getElementById('selectedCount');
    if (!countEl) return;

    const count = selectedColumns.length;
    countEl.textContent = count + ' selected';
    countEl.style.display = count > 0 ? 'inline-block' : 'none';
}

function renderUpdateDateTable() {
    const displayData = filteredData.length > 0 && filteredData.length < data.length
        ? filteredData
        : data;

    if (displayData.length === 0) {
        const tbody = document.getElementById('tableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px; color: #999;">No results found</td></tr>';
        return;
    }

    const columns = Object.keys(displayData[0]);

    const header = document.getElementById('tableHeader');
    header.innerHTML = '<tr>' +
        columns.map(col => '<th>' + col + '</th>').join('') +
        '<th>Actions</th></tr>';

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    displayData.forEach(row => {
        const tr = document.createElement('tr');
        const isEditing = editingRowId === row.id;

        if (isEditing) tr.className = 'editing';

        columns.forEach(col => {
            const td = document.createElement('td');
            let displayValue = row[col] || '';

            if (col === "No of Days") {
                displayValue = calculateDays(row["Blocked Date"]);
            }

            const isEditable = isEditing && selectedColumns.includes(col) && col !== "No of Days";

            if (isEditable) {
                const input = document.createElement('input');
                if (isDateColumn(col)) {
                    input.type = 'date';
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    input.max = `${yyyy}-${mm}-${dd}`;
                } else {
                    input.type = 'text';
                }
                input.className = 'edit-input';
                input.value = row[col] || '';
                input.setAttribute('data-column', col);
                input.setAttribute('data-row-id', row.id);
                td.appendChild(input);
            } else {
                td.textContent = displayValue;
            }

            tr.appendChild(td);
        });

        const actionTd = document.createElement('td');

        if (isEditing) {
            const updateBtn = document.createElement('button');
            updateBtn.className = 'btn btn-update';
            updateBtn.textContent = '💾 Update';
            updateBtn.onclick = () => updateRow(row.id);

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-cancel';
            cancelBtn.textContent = '❌ Cancel';
            cancelBtn.onclick = cancelEdit;

            actionTd.appendChild(updateBtn);
            actionTd.appendChild(cancelBtn);
        } else {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-edit';
            editBtn.textContent = '✏️ Edit';
            editBtn.disabled = selectedColumns.length === 0;
            editBtn.onclick = () => editRow(row.id);

            actionTd.appendChild(editBtn);
        }

        tr.appendChild(actionTd);
        tbody.appendChild(tr);
    });
}

function editRow(rowId) {
    if (selectedColumns.length === 0) {
        showMessage('⚠️ Please select at least one column to edit', 'error');
        return;
    }
    editingRowId = rowId;
    renderUpdateDateTable();
}

function cancelEdit() {
    editingRowId = null;
    renderUpdateDateTable();
}

async function updateRow(rowId) {
    const inputs = document.querySelectorAll(`input[data-row-id="${rowId}"]`);
    const updatedData = {};

    inputs.forEach(input => {
        const colName = input.getAttribute('data-column');
        updatedData[colName] = input.value;
    });

    if ("Blocked Date" in updatedData) {
        updatedData["No of Days"] = calculateDays(updatedData["Blocked Date"]);
        if (
            updatedData["Blocked Date"] &&
            updatedData["Blocked Date"] !== "NA"
        ) {
            updatedData["Unblocked Date"] = "NA";
        }
    }

    if ("Unblocked Date" in updatedData && updatedData["Unblocked Date"] && updatedData["Unblocked Date"] !== "NA") {
        updatedData["Blocked Date"] = "NA";
        updatedData["No of Days"] = "NA";
    }

    try {
        console.log('💾 Updating row:', rowId, updatedData);

        const { data: result, error } = await supabaseClient
            .from(TABLE_NAME)
            .update(updatedData)
            .eq('id', rowId)
            .select();

        if (error) {
            console.error('❌ Update error:', error);
            throw error;
        }

        console.log('✅ Update successful:', result);

        const rowIndex = data.findIndex(r => r.id === rowId);
        data[rowIndex] = { ...data[rowIndex], ...updatedData };

        showMessage('✅ Updated successfully!', 'success');
        editingRowId = null;
        renderUpdateDateTable();
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('❌ Update failed: ' + error.message, 'error');
    }
}

// ============================================
// DASHBOARD PAGE FUNCTIONS
// ============================================

async function initDashboardPage() {
    console.log('🚀 Initializing Dashboard page...');

    try {
        const fetchedData = await loadData();
        data = fetchedData;

        filteredData = [...data];
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dataTable').style.display = 'table';

        createSearchBoxDashboard();
        renderDashboardTable();
    } catch (error) {
        document.getElementById('loading').innerHTML =
            `<div style="color: red;">❌ Error loading data: ${error.message}<br><br>
            Check console for details.</div>`;
    }
}

function renderDashboardTable() {
    const displayData = filteredData.length > 0 && filteredData.length < data.length
        ? filteredData
        : data;

    if (displayData.length === 0) {
        const tbody = document.getElementById('tableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px; color: #999;">No results found</td></tr>';
        return;
    }

    const columns = Object.keys(displayData[0]);

    const header = document.getElementById('tableHeader');
    header.innerHTML = '<tr>' + columns.map(col => '<th>' + col + '</th>').join('') + '</tr>';

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    displayData.forEach(row => {
        const tr = document.createElement('tr');

        const whatsappStatus = row['WhatsApp Status'] || row['whatsapp_status'] || '';
        if (whatsappStatus.toString().toLowerCase().trim() === 'blocked') {
            tr.className = 'blocked';
        }

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] || '';
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function downloadCSV() {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    let csv = columns.join(',') + '\n';

    data.forEach(row => {
        const values = columns.map(col => {
            const val = row[col] || '';
            return `"${val}"`;
        });
        csv += values.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// ============================================
// PAGE DETECTION & INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();

    console.log('📄 Current page:', currentPage);

    if (currentPage === 'update_data.html' || currentPage === '') {
        if (document.getElementById('columnSelector')) {
            initUpdateDatePage();
        }
    } else if (currentPage === 'index.html' || currentPage === 'index.html') {
        initDashboardPage();
    }
});

// Import button click se hidden file input open
function triggerImport() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput) {
        showMessage('❌ Import file input not found', 'error');
        return;
    }
    fileInput.value = '';
    fileInput.click();
}

// File select hone ke baad handle karo
document.addEventListener('change', async (e) => {
    if (e.target && e.target.id === 'importFile') {
        const file = e.target.files[0];
        if (!file) return;

        const importBtn = document.getElementById('importBtn');
        const originalText = importBtn ? importBtn.innerHTML : '';

        // Loading state ON
        if (importBtn) {
            importBtn.disabled = true;
            importBtn.innerHTML = '⏳ Importing...';
        }

        try {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                showMessage('❌ Please select a CSV file', 'error');
                return;
            }

            const text = await file.text();
            const rows = text.split('\n').map(r => r.trim()).filter(r => r.length > 0);
            if (rows.length < 2) {
                showMessage('❌ CSV file has no data', 'error');
                return;
            }

            const headers = rows[0].split(',').map(h => h.replace(/(^"|"$)/g, '').trim());

            const newRecords = rows.slice(1).map(line => {
                const cols = line.split(',');
                const obj = {};
                headers.forEach((h, idx) => {
                    const raw = cols[idx] !== undefined ? cols[idx] : '';
                    obj[h] = raw.replace(/(^"|"$)/g, '').trim();
                });
                return obj;
            });

            if (newRecords.length === 0) {
                showMessage('❌ No valid rows found in CSV', 'error');
                return;
            }

            const recordsWithId = newRecords.filter(r => r.id);
            const recordsWithoutId = newRecords.filter(r => !r.id);

            if (recordsWithId.length > 0) {
                for (const rec of recordsWithId) {
                    const id = rec.id;
                    delete rec.id;

                    const { error } = await supabaseClient
                        .from(TABLE_NAME)
                        .update(rec)
                        .eq('id', id);

                    if (error) {
                        console.error('Update error for id', id, error);
                    }
                }
            }

            if (recordsWithoutId.length > 0) {
                const { error } = await supabaseClient
                    .from(TABLE_NAME)
                    .insert(recordsWithoutId);

                if (error) {
                    console.error('Insert error:', error);
                    showMessage('❌ Error inserting some rows: ' + error.message, 'error');
                }
            }

            showMessage('✅ Import completed. Refreshing data...', 'success');
            const fetchedData = await loadData();
            data = fetchedData;
            filteredData = [...data];
            renderDashboardTable();
        } catch (err) {
            console.error('Import error:', err);
            showMessage('❌ Import failed: ' + err.message, 'error');
        } finally {
            // Loading state OFF
            if (importBtn) {
                importBtn.disabled = false;
                importBtn.innerHTML = originalText || '📤 Import CSV';
            }
        }
    }
});



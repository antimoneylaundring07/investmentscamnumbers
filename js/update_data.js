const SHOW_COLUMNS = [
    "Login User",
    "Whatsapp Login Device",
    "WhatsApp Status",
    "Review Status",
    "Blocked Date",
    "Unblocked Date"
];

let currentPlatform = 'whatsapp';
const PLATFORM_TABLES = {
    'whatsapp': 'numbers',           // Adjust to your actual table names
    'facebook': 'facebook',
    'instagram': 'instagram',
    'amazon': 'amazon_accounts',
    'telegram': 'telegram'
};

const DATE_COLUMNS = ["Blocked Date", "Unblocked Date", "Recharge Date"];
const WHATSAPP_STATUS_OPTIONS = ['Active', 'Blocked', 'Restricted', 'Permanent'];

let data = [];
let filteredData = [];
let selectedColumns = [];
let editingRowId = null;
let isFiltering = false;

// ============================================
// SEARCH & FILTER FUNCTIONS - DASHBOARD PAGE
// ============================================

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

function filterTableDashboard(searchTerm) {
    const searchLower = searchTerm.toLowerCase();

    // Set isFiltering flag
    isFiltering = searchTerm.trim() !== '';

    if (!isFiltering) {
        // No search term - don't filter
        filteredData = [];
    } else {
        // Has search term - filter the data
        filteredData = data.filter(row => {
            return Object.values(row).some(value =>
                String(value || '').toLowerCase().includes(searchLower)
            );
        });
    }

    renderDashboardTable();
}

// ============================================
// SEARCH & FILTER FUNCTIONS - UPDATE DATA PAGE
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

function filterTable(searchTerm) {
    const searchLower = searchTerm.toLowerCase();

    // Set isFiltering flag
    isFiltering = searchTerm.trim() !== '';

    if (!isFiltering) {
        // No search term - don't filter
        filteredData = [];
    } else {
        // Has search term - filter the data
        filteredData = data.filter(row => {
            return Object.values(row).some(value =>
                String(value || '').toLowerCase().includes(searchLower)
            );
        });
    }

    renderUpdateDateTable();
}

// ============================================
// COLUMN SELECTOR - UPDATE DATA PAGE
// ============================================

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

let selectedRows = new Set();

// Override renderDashboardTable to add checkboxes (NO delete button in rows)
function renderDashboardTable() {
    let displayData;
    if (isFiltering) {
        displayData = filteredData;
    } else {
        displayData = data;
    }

    const tbody = document.getElementById('tableBody');

    if (!displayData || displayData.length === 0) {
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px; color: #999;">No results found</td></tr>';
        }
        return;
    }

    const columns = Object.keys(displayData[0]);

    const header = document.getElementById('tableHeader');

    // Add checkbox column header
    header.innerHTML = '<tr>' +
        '<th class="checkbox-cell"><input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll(this)"></th>' +
        columns.map(col => '<th>' + col + '</th>').join('') +
        '</tr>';

    tbody.innerHTML = '';

    displayData.forEach(row => {
        const tr = document.createElement('tr');

        const whatsappStatus = row['WhatsApp Status'] || row['whatsapp_status'] || row['Account Status'] || row['Current Status'] || row['Status'] || '';
        if (whatsappStatus.toString().toLowerCase().trim() === 'blocked' || whatsappStatus.toString().toLowerCase().trim() === 'video verification') {
            tr.className = 'blocked';
        } else if (whatsappStatus.toString().toLowerCase().trim() === 'active') {
            tr.className = 'active';
        } else if (whatsappStatus.toString().toLowerCase().trim() === 'restricted' || whatsappStatus.toString().toLowerCase().trim() === 'frozen') {
            tr.className = 'restricted';
        } else if (whatsappStatus.toString().toLowerCase().trim() === 'permanent' || whatsappStatus.toString().toLowerCase().trim() === 'permanent blocked') {
            tr.className = 'permanent';
        }

        // Add checkbox cell
        const checkboxTd = document.createElement('td');
        checkboxTd.className = 'checkbox-cell';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'row-checkbox';
        checkbox.setAttribute('data-row-id', row.id);
        checkbox.onchange = () => {
            if (checkbox.checked) {
                selectedRows.add(row.id);
            } else {
                selectedRows.delete(row.id);
            }
            updateDeleteButton();
        };
        checkboxTd.appendChild(checkbox);
        tr.appendChild(checkboxTd);

        // Add data columns
        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] || '';
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    selectedRows.clear();

    checkboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        if (checkbox.checked) {
            selectedRows.add(parseInt(cb.getAttribute('data-row-id')));
        }
    });

    updateDeleteButton();
}

function updateDeleteButton() {
    const deleteBtn = document.getElementById('deleteBulkBtn');
    if (deleteBtn) {
        if (selectedRows.size > 0) {
            deleteBtn.style.display = 'inline-block';
            deleteBtn.textContent = `Delete rows (${selectedRows.size})`;
        } else {
            deleteBtn.textContent = 'Delete rows';
        }
    }
}

async function bulkDeleteSelected() {
    if (selectedRows.size === 0) {
        alert('⚠️ Please select rows to delete');
        return;
    }

    const count = selectedRows.size;
    const confirmDelete = confirm(`🗑️ Delete ${count} row(s)? This action cannot be undone!`);
    const platform = document.getElementById('platformDropdown')?.value;
    const tableName = PLATFORM_TABLES[platform];

    if (!confirmDelete) return;

    const deleteBtn = document.getElementById('deleteBulkBtn');
    deleteBtn.disabled = true;
    deleteBtn.textContent = '⏳ Deleting...';

    try {
        for (const rowId of selectedRows) {
            await deleteRowFromDB(rowId, tableName);
            data = data.filter(r => r.id !== rowId);
            filteredData = filteredData.filter(r => r.id !== rowId);
        }

        alert(`✅ Successfully deleted ${count} row(s)!`);
        selectedRows.clear();
        updateDeleteButton();
        document.getElementById('selectAllCheckbox').checked = false;
        renderDashboardTable();

    } catch (error) {
        alert(`❌ Error: ${error.message}`);
        console.error('Delete error:', error);
    } finally {
        deleteBtn.disabled = false;
        updateDeleteButton();
    }
}

// ============================================
// TABLE RENDERING - UPDATE DATA PAGE
// ============================================

function renderUpdateDateTable() {
    // Decide what to display based on filtering state
    let displayData;
    if (isFiltering) {
        // User is searching - show filtered results (may be empty)
        displayData = filteredData;
    } else {
        // No search active - show all data
        displayData = data;
    }

    const tbody = document.getElementById('tableBody');

    // Check if no results
    if (!displayData || displayData.length === 0) {
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px; color: #999;">No results found</td></tr>';
        }
        return;
    }

    const columns = Object.keys(displayData[0]);

    const header = document.getElementById('tableHeader');
    header.innerHTML = '<tr>' +
        columns.map(col => '<th>' + col + '</th>').join('') +
        '<th>Actions</th></tr>';

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
                if (col === "WhatsApp Status") {
                    const select = document.createElement('select');
                    select.className = 'edit-select';
                    select.setAttribute('data-column', col);
                    select.setAttribute('data-row-id', row.id);

                    const emptyOption = document.createElement('option');
                    emptyOption.value = '';
                    emptyOption.textContent = '-- Select Status --';
                    select.appendChild(emptyOption);

                    WHATSAPP_STATUS_OPTIONS.forEach(option => {
                        const opt = document.createElement('option');
                        opt.value = option;
                        opt.textContent = option;
                        if (row[col] === option) {
                            opt.selected = true;
                        }
                        select.appendChild(opt);
                    });

                    td.appendChild(select);
                } else {
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
                }
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

// ============================================
// EDIT & UPDATE FUNCTIONS
// ============================================

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

// Helpers (place these above or reuse your existing helpers)
function cleanObject(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
}
function isDifferent(oldVal, newVal) {
    const a = oldVal === undefined ? null : oldVal;
    const b = newVal === undefined ? null : newVal;
    return String(a) !== String(b);
}

// Revised updateRow
async function updateRow(rowId) {
    try {
        // 1) Collect UI inputs
        const inputs = document.querySelectorAll(`input[data-row-id="${rowId}"]`);
        const selects = document.querySelectorAll(`select[data-row-id="${rowId}"]`);
        const updatedData = {};

        inputs.forEach(input => {
            const colName = input.getAttribute('data-column');
            updatedData[colName] = input.value;
        });
        selects.forEach(select => {
            const colName = select.getAttribute('data-column');
            updatedData[colName] = select.value;
        });

        // 2) Auto-calc logic (your existing rules)
        if ("Blocked Date" in updatedData) {
            updatedData["No of Days"] = calculateDays(updatedData["Blocked Date"]);
            if (updatedData["Blocked Date"] && updatedData["Blocked Date"] !== "NA") {
                updatedData["Unblocked Date"] = "NA";
            }
        }
        if ("Unblocked Date" in updatedData && updatedData["Unblocked Date"] && updatedData["Unblocked Date"] !== "NA") {
            updatedData["Blocked Date"] = "NA";
            updatedData["No of Days"] = "NA";
        }

        // 3) Get original row from client cache (data)
        const originalRow = data.find(r => r.id === rowId);
        if (!originalRow) {
            showMessage('Row not found locally. Please refresh and try again.', 'error');
            return;
        }

        // 4) Build changes (only fields that actually changed)
        const changes = {};
        for (const [k, v] of Object.entries(updatedData)) {
            if (isDifferent(originalRow[k], v)) {
                changes[k] = v;
            }
        }

        if (Object.keys(changes).length === 0) {
            showMessage('No changes detected.', 'info');
            editingRowId = null;
            renderUpdateDateTable();
            return;
        }

        // 5) Determine status change to Permanent
        const oldStatus = String(originalRow['WhatsApp Status'] ?? '').toLowerCase().trim();
        const newStatus = String(changes['WhatsApp Status'] ?? originalRow['WhatsApp Status'] ?? '').toLowerCase().trim();
        const isChangingToPermanent = newStatus === 'permanent' && oldStatus !== 'permanent';

        // 6) If changing to permanent, check blocked and ask confirmation BEFORE update
        let userConfirmedMove = false;
        if (isChangingToPermanent) {
            const alreadyBlocked = await isNumberAlreadyBlocked(originalRow.Number);
            if (alreadyBlocked) {
                // If already blocked, inform user and continue with update only
                const proceed = confirm(`This number (${originalRow.Number}) is already in Permanent Blocked Numbers table. Do you still want to save the changes to the numbers table?`);
                if (!proceed) {
                    showMessage('Operation cancelled.', 'info');
                    editingRowId = null;
                    renderUpdateDateTable();
                    return;
                }
            } else {
                userConfirmedMove = confirm(
                    `🔒 WhatsApp Status is being set to "Permanent".\n\n` +
                    `This will move ${originalRow.Number} to Permanent Blocked Numbers table AFTER update.\n\n` +
                    `Continue?`
                );
                if (!userConfirmedMove) {
                    showMessage('Operation cancelled. Status was not updated.', 'info');
                    editingRowId = null;
                    renderUpdateDateTable();
                    return;
                }
            }
        }

        // 7) Update the numbers table (server)
        // Ensure we send only keys that changed
        const safeChanges = cleanObject(changes);
        try {
            await updateRowInDB(rowId, safeChanges); // adapt if your function returns {error}
        } catch (updErr) {
            console.error('Update failed:', updErr);
            showMessage('Update failed: ' + (updErr.message || updErr), 'error');
            return;
        }

        // 8) Log the changes (pass old value for context if your function supports)
        for (const [colName, newValue] of Object.entries(safeChanges)) {
            try {
                await logActivityChange(colName, newValue, rowId, originalRow[colName]); // remove 4th arg if your func doesn't accept it
            } catch (logErr) {
                console.warn('Logging failed for', colName, logErr);
            }
        }

        // 9) If confirmed to move to Permanent and not already blocked -> move from DB by id
        if (isChangingToPermanent && userConfirmedMove) {
            try {
                // moveToBlockedNumbersById will fetch row from DB and insert into blocked table
                await moveToBlockedNumbers(rowId);
                alert('✅ Number moved to Permanent Blocked Numbers!');
            } catch (moveErr) {
                console.error('Move failed:', moveErr);
                showMessage('Move failed: ' + (moveErr.message || moveErr), 'error');
                // Note: numbers table is already updated. For true atomicity use server-side transaction.
            }
        }

        // 10) Update client-side cache & UI
        const rowIndex = data.findIndex(r => r.id === rowId);
        if (rowIndex > -1) {
            data[rowIndex] = { ...data[rowIndex], ...safeChanges };
        }

        showMessage('✅ Updated successfully!', 'success');
        editingRowId = null;
        renderUpdateDateTable();

        // Optional: reload if required elsewhere
        // setTimeout(() => location.reload(), 1200);

    } catch (error) {
        console.error('❌ Error in updateRow:', error);
        showMessage('❌ Update failed: ' + (error.message || error), 'error');
    }
}

// ============================================
// DELETE FUNCTIONS
// ============================================

async function deleteRowFromDashboard(rowId, rowElem, btnElem) {
    if (!confirm('Really delete this row?')) return;
    btnElem.disabled = true;
    btnElem.textContent = 'Deleting...';
    const platform = document.getElementById('platformDropdown')?.value;
    const tableName = PLATFORM_TABLES[platform];

    try {
        await deleteRowFromDB(rowId, tableName);
        showMessage('✅ Row deleted', 'success');
        data = data.filter(r => r.id !== rowId);
        filteredData = filteredData.filter(r => r.id !== rowId);
        renderDashboardTable();
    } catch (e) {
        showMessage('❌ Delete error: ' + e.message, 'error');
        btnElem.disabled = false;
        btnElem.textContent = 'Delete';
    }
}

// ============================================
// PAGE INITIALIZATION FUNCTIONS
// ============================================

async function initDashboardPage() {
    try {
        // const fetchedData = await loadData();
        const fetchedData = await loadData(PLATFORM_TABLES['whatsapp']);
        data = fetchedData;
        filteredData = [];
        isFiltering = false;
        
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

async function handlePlatformChange(platform) {
    currentPlatform = platform;
    const tableName = PLATFORM_TABLES[platform];
    
    try {
        const fetchedData = await loadData(tableName);
        console.log('Data for', platform, ':', fetchedData);
        data = fetchedData;
        filteredData = [];
        isFiltering = false;
        renderDashboardTable();
    } catch (error) {
        alert('Error loading data: ' + error.message);
    }
}

async function initUpdateDatePage() {
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

        filteredData = [];
        isFiltering = false;
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

console.log('Activity Summary script loaded successfully');
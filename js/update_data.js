// update_data.js
// Update page functionality - editing and updating records

let data = [];
let filteredData = [];
let selectedColumns = [];
let editingRowId = null;

const SHOW_COLUMNS = [
    "Login User",
    "Whatsapp Login Device",
    "WhatsApp Status",
    "Review Status",
    "Blocked Date",
    "Unblocked Date"
];

const DATE_COLUMNS = ["Blocked Date", "Unblocked Date", "Recharge Date"];
const WHATSAPP_STATUS_OPTIONS = ['Active', 'Blocked', 'Restricted', 'Parmanent'];

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

    try {
        await updateRowInDB(rowId, updatedData);

        const rowIndex = data.findIndex(r => r.id === rowId);
        data[rowIndex] = { ...data[rowIndex], ...updatedData };

        alert('✅ Updated successfully!');
        showMessage('✅ Updated successfully!', 'success');
        editingRowId = null;
        renderUpdateDateTable();

        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (error) {
        console.error('❌ Error:', error);
        showMessage('❌ Update failed: ' + error.message, 'error');
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

console.log('Update Data script loaded successfully');
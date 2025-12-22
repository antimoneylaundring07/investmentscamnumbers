// Display permanent blocked numbers with full functionality

let blockedData_arr = [];
let filteredData = [];
let selectedColumns = [];
let isFiltering = false;
let selectedRows = new Set();
let editingRowId = null;

const PAGE_SIZE = 10;
let currentPage = 1;

// Fetch blocked numbers from database
async function fetchBlockedData() {
    try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('dataTable').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';

        const fetchedData = await blockedData();
        blockedData_arr = fetchedData || [];

        console.log('✅ Blocked data loaded:', blockedData_arr.length, 'records');

        document.getElementById('loading').style.display = 'none';
        renderBlockedTable();

    } catch (error) {
        document.getElementById('loading').innerHTML =
            `<div style="color: red; padding: 20px;">
                ❌ Error loading data: ${error.message}<br><br>
                Check console for details.
            </div>`;
        console.error('Error:', error);
    }
}

// Render permanent blocked numbers table
function renderBlockedTable() {
    let displayData;

    if (isFiltering) {
        displayData = filteredData;
    } else {
        displayData = blockedData_arr;
    }

    const tbody = document.getElementById('tableBody');
    const tableHeader = document.getElementById('tableHeader');
    const dataTable = document.getElementById('dataTable');
    const emptyState = document.getElementById('emptyState');

    // Check if data is empty
    if (!displayData || displayData.length === 0) {
        dataTable.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    dataTable.style.display = 'table';
    emptyState.style.display = 'none';

    // Get all column names dynamically from first row
    const columns = Object.keys(displayData[0]);

    // Filter out unnecessary columns
    const excludeColumns = ['created_at', 'updated_at'];
    const displayColumns = columns.filter(col => !excludeColumns.includes(col));

    // Build table header dynamically
    let headerHTML = '<tr>';
    headerHTML += '<th class="checkbox-cell"><input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll(this)"></th>';

    displayColumns.forEach(col => {
        const formattedCol = col
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        headerHTML += `<th>${formattedCol}</th>`;
    });

    // Actions LAST
    headerHTML += '<th>Actions</th></tr>';
    tableHeader.innerHTML = headerHTML;

    // Clear existing rows
    tbody.innerHTML = '';

    // Decide the actual key name for Current Status (e.g. "Current Status" or "current_status")
    // We’ll infer from the first row
    const firstRow = displayData[0];
    const currentStatusKey =
        Object.keys(firstRow).find(
            k => k.toLowerCase().replace(/\s+/g, '_') === 'current_status'
        ) || 'Current Status'; // fallback if you know exact name

    // Add data rows
    displayData.forEach(row => {
        const tr = document.createElement('tr');
        const isEditing = editingRowId === row.id;

        if (isEditing) tr.className = 'editing';

        // Checkbox cell
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

        // Data columns
        displayColumns.forEach(col => {
            const td = document.createElement('td');
            let value = row[col];

            // Normal display value
            const displayValue = value == null ? '' : value;

            const isCurrentStatusCol =
                col.toLowerCase().replace(/\s+/g, '_') === 'current_status' ||
                col === currentStatusKey;

            // Only "Current Status" becomes editable when row is in edit mode
            if (isEditing && isCurrentStatusCol) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'edit-input';
                input.value = displayValue;
                input.setAttribute('data-column', col);
                input.setAttribute('data-row-id', row.id);
                td.appendChild(input);
            } else {
                if (col === 'Number') {
                    td.innerHTML = `<strong>${displayValue}</strong>`;
                } else {
                    td.textContent = displayValue;
                }
            }

            tr.appendChild(td);
        });

        // Actions cell (LAST)
        const actionTd = document.createElement('td');

        if (isEditing) {
            const updateBtn = document.createElement('button');
            updateBtn.className = 'btn btn-update';
            updateBtn.textContent = '💾 Update';
            updateBtn.onclick = () => updateRow(row.id, currentStatusKey);

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

            // Enable edit always, or you can add conditions
            editBtn.onclick = () => editRow(row.id);

            actionTd.appendChild(editBtn);
        }

        tr.appendChild(actionTd);
        tbody.appendChild(tr);
    });
}

function editRow(rowId) {
    editingRowId = rowId;
    renderBlockedTable();
}

function cancelEdit() {
    editingRowId = null;
    renderBlockedTable();
}

async function updateRow(rowId, currentStatusKey = 'Current Status') {
    const tbody = document.getElementById('tableBody');

    // Find the input for Current Status in this row
    const input = tbody.querySelector(
        `input.edit-input[data-row-id="${rowId}"][data-column="${currentStatusKey}"]`
    );

    if (!input) {
        console.warn('No Current Status input found for row:', rowId);
        return;
    }

    const newValue = input.value.trim();

    // Find in main array
    const arr = isFiltering ? filteredData : blockedData_arr;
    const idx = arr.findIndex(r => r.id === rowId);
    if (idx === -1) {
        alert('Row not found');
        return;
    }

    try {
        // Call your DB function from database.js
        const success = await updateBlockedStatusInDB(rowId, newValue, currentStatusKey);

        if (!success) {
            alert('❌ Failed to update Current Status in DB');
            return;
        }

        // Update both arrays (blockedData_arr + filteredData)
        const updateInArr = array => {
            const i = array.findIndex(r => r.id === rowId);
            if (i !== -1) {
                array[i][currentStatusKey] = newValue;
            }
        };
        updateInArr(blockedData_arr);
        updateInArr(filteredData);

        alert('✅ Current Status updated');
        editingRowId = null;
        renderBlockedTable();
    } catch (err) {
        console.error(err);
        alert('❌ Error updating Current Status: ' + err.message);
    }
}


// Toggle select all checkboxes
function toggleSelectAll(checkbox) {
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    allCheckboxes.forEach(cb => {
        cb.checked = checkbox.checked;
        if (checkbox.checked) {
            selectedRows.add(cb.getAttribute('data-row-id'));
        } else {
            selectedRows.delete(cb.getAttribute('data-row-id'));
        }
    });
    updateDeleteButton();
}

// Update delete button visibility
function updateDeleteButton() {
    const deleteBtn = document.getElementById('deleteSelectedBtn');
    if (deleteBtn) {
        if (selectedRows.size > 0) {
            deleteBtn.style.display = 'inline-block';
            deleteBtn.textContent = `Delete rows (${selectedRows.size})`;
        } else {
            deleteBtn.textContent = 'Delete rows';
        }
    }
}

// Delete single row
async function deleteSingleRow(id, phoneNumber) {
    if (!confirm(`Are you sure you want to delete ${phoneNumber}?`)) return;

    try {
        const success = await deleteBlockedRow(id);
        if (success) {
            blockedData_arr = blockedData_arr.filter(row => row.id !== id);
            filteredData = filteredData.filter(row => row.id !== id);
            selectedRows.delete(id);

            alert('✅ Number deleted successfully!');
            renderBlockedTable();
        }
    } catch (error) {
        alert('❌ Error deleting row: ' + error.message);
        console.error('Error:', error);
    }
}

// Delete multiple selected rows
async function deleteSelectedRows() {
    if (selectedRows.size === 0) {
        alert('⚠️ No rows selected');
        return;
    }

    if (!confirm(`Delete ${selectedRows.size} selected numbers?`)) return;

    try {
        const idsToDelete = Array.from(selectedRows);
        const success = await deleteMultipleBlockedRows(idsToDelete);

        if (success) {
            blockedData_arr = blockedData_arr.filter(row => !selectedRows.has(row.id));
            filteredData = filteredData.filter(row => !selectedRows.has(row.id));
            selectedRows.clear();

            alert(`✅ ${idsToDelete.length} numbers deleted successfully!`);
            renderBlockedTable();
        }
    } catch (error) {
        alert('❌ Error deleting rows: ' + error.message);
        console.error('Error:', error);
    }
}

// Search/Filter functionality
function filterBlockedData(searchTerm) {
    if (!searchTerm.trim()) {
        isFiltering = false;
        filteredData = [];
        currentPage = 1;
        renderBlockedTable();
        return;
    }

    isFiltering = true;
    const term = searchTerm.toLowerCase();

    filteredData = blockedData_arr.filter(row => {
        return Object.values(row).some(value =>
            String(value || '').toLowerCase().includes(term)
        );
    });

    currentPage = 1;
    renderBlockedTable();
}

// Export to CSV
function exportBlockedToCSV() {
    const displayData = isFiltering ? filteredData : blockedData_arr;

    if (displayData.length === 0) {
        alert('No data to export');
        return;
    }

    let csv = 'Phone Number,Reason,Blocked Date,Blocked By\n';

    displayData.forEach(row => {
        const blockedDate = new Date(row.created_at).toLocaleDateString();
        csv += `"${row.phone_number}","${row.reason || 'N/A'}","${blockedDate}","${row.blocked_by || 'System'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'permanent_blocked_numbers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Page loaded, fetching blocked data...');
    fetchBlockedData();
});

console.log('✅ Permanent blocked script loaded');

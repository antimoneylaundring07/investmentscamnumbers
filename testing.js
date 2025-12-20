let blockedData_arr = [];
let filteredData = [];
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
    const excludeColumns = ['created_at', 'updated_at', 'id'];
    const displayColumns = columns.filter(col => !excludeColumns.includes(col));

    // Build table header dynamically
    let headerHTML = '<tr>';
    headerHTML += '<th class="checkbox-cell"><input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll(this)"></th>';

    // Add dynamic columns
    displayColumns.forEach(col => {
        const formattedCol = col
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        headerHTML += `<th>${formattedCol}</th>`;
    });

    headerHTML += '<th style="width: 200px; text-align: center;">Actions</th>';
    headerHTML += '</tr>';
    tableHeader.innerHTML = headerHTML;

    // Clear existing rows
    tbody.innerHTML = '';

    // Add data rows
    displayData.forEach(row => {
        const tr = document.createElement('tr');
        const isEditing = editingRowId === row.id;

        if (isEditing) {
            tr.className = 'blocked-row editing';
        } else {
            tr.className = 'blocked-row';
        }

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

        // Add dynamic data columns
        displayColumns.forEach(col => {
            const td = document.createElement('td');
            let value = row[col] || '';

            if (isEditing) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'edit-input';
                input.value = value;
                input.setAttribute('data-column', col);
                input.setAttribute('data-row-id', row.id);
                td.appendChild(input);
            } else {
                if (col === 'phone_number') {
                    td.innerHTML = `<strong>${value}</strong>`;
                } else {
                    td.textContent = value;
                }
            }

            tr.appendChild(td);
        });

        // Actions cell
        const actionTd = document.createElement('td');
        actionTd.style.textAlign = 'center';

        if (isEditing) {
            const updateBtn = document.createElement('button');
            updateBtn.className = 'btn btn-update';
            updateBtn.innerHTML = '<i class="fas fa-save"></i> Update';
            updateBtn.onclick = () => updateBlockedRow(row.id);

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-cancel';
            cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
            cancelBtn.onclick = cancelEdit;

            actionTd.appendChild(updateBtn);
            actionTd.appendChild(cancelBtn);
        } else {
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-edit';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editBtn.onclick = () => editRow(row.id);

            actionTd.appendChild(editBtn);
            actionTd.appendChild(deleteBtn);
        }

        tr.appendChild(actionTd);
        tbody.appendChild(tr);
    });

    dataTable.style.display = 'table';
}

// ============================================
// EDIT & UPDATE FUNCTIONS
// ============================================

function editRow(rowId) {
    editingRowId = rowId;
    renderBlockedTable();
}

function cancelEdit() {
    editingRowId = null;
    renderBlockedTable();
}

async function updateBlockedRow(rowId) {
    try {
        const inputs = document.querySelectorAll(`input[data-row-id="${rowId}"]`);
        const updatedData = {};

        inputs.forEach(input => {
            const colName = input.getAttribute('data-column');
            updatedData[colName] = input.value.trim();
        });

        // Find original row
        const originalRow = blockedData_arr.find(r => r.id === rowId);
        if (!originalRow) {
            alert('❌ Row not found');
            return;
        }

        // Build changes
        const changes = {};
        for (const [k, v] of Object.entries(updatedData)) {
            if (String(originalRow[k] || '') !== String(v)) {
                changes[k] = v;
            }
        }

        if (Object.keys(changes).length === 0) {
            alert('⚠️ No changes made');
            editingRowId = null;
            renderBlockedTable();
            return;
        }

        // Update in DB
        const success = await updateBlockedRowInDB(rowId, changes);

        if (success) {
            // Update local data
            const rowIndex = blockedData_arr.findIndex(r => r.id === rowId);
            if (rowIndex > -1) {
                blockedData_arr[rowIndex] = { ...blockedData_arr[rowIndex], ...changes };
            }

            // Update filtered data if filtering
            if (isFiltering) {
                const filteredIndex = filteredData.findIndex(r => r.id === rowId);
                if (filteredIndex > -1) {
                    filteredData[filteredIndex] = { ...filteredData[filteredIndex], ...changes };
                }
            }

            alert('✅ Updated successfully!');
            editingRowId = null;
            renderBlockedTable();

            // Log activity
            for (const [col, newVal] of Object.entries(changes)) {
                try {
                    await logActivityChange(col, newVal, rowId);
                } catch (e) {
                    console.warn('Log failed:', e);
                }
            }
        } else {
            alert('❌ Failed to update');
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
        console.error('Error:', error);
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
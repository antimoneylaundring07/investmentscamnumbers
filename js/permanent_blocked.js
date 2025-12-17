// permanent_blocked.js
// Display permanent blocked numbers with full functionality

let blockedData_arr = [];
let filteredData = [];
let isFiltering = false;
let selectedRows = new Set();

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
    const pagination = document.getElementById('pagination');

    // Check if data is empty
    if (!displayData || displayData.length === 0) {
        dataTable.style.display = 'none';
        emptyState.style.display = 'block';
        pagination.style.display = 'none';
        return;
    }

    dataTable.style.display = 'table';
    emptyState.style.display = 'none';

    // Get all column names dynamically from first row
    const columns = Object.keys(displayData[0]);
    
    // Filter out unnecessary columns
    const excludeColumns = ['id', 'created_at', 'updated_at'];
    const displayColumns = columns.filter(col => !excludeColumns.includes(col));

    // Build table header dynamically
    let headerHTML = '<tr>';
    headerHTML += '<th class="checkbox-cell"><input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll(this)"></th>';
    
    // Add dynamic columns
    displayColumns.forEach(col => {
        // Format column name (convert snake_case to Title Case)
        const formattedCol = col
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        headerHTML += `<th>${formattedCol}</th>`;
    });
    
    headerHTML += '<th>Action</th>';
    headerHTML += '</tr>';
    
    tableHeader.innerHTML = headerHTML;

    // Clear existing rows
    tbody.innerHTML = '';

    // Add data rows
    displayData.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = 'blocked-row';

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
            
            let value = row[col];
            
            // Format special columns
            if (col === 'phone_number') {
                td.innerHTML = `<strong>${value}</strong>`;
            } else if (col === 'created_at' || col === 'updated_at') {
                td.textContent = new Date(value).toLocaleDateString();
            } else {
                td.textContent = value || 'N/A';
            }
            
            tr.appendChild(td);
        });

        // Actions cell
        const actionTd = document.createElement('td');
        actionTd.innerHTML = `
            <button class="btn-delete" onclick="deleteSingleRow('${row.id}', '${row.phone_number}')">
                🗑️ Delete
            </button>
        `;
        tr.appendChild(actionTd);

        tbody.appendChild(tr);
    });

    dataTable.style.display = 'table';
    renderPagination();
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
            deleteBtn.textContent = `🗑️ Delete Selected (${selectedRows.size})`;
        } else {
            deleteBtn.style.display = 'none';
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

    filteredData = blockedData_arr.filter(row =>
        row.phone_number.toLowerCase().includes(term) ||
        (row.reason && row.reason.toLowerCase().includes(term)) ||
        (row.blocked_by && row.blocked_by.toLowerCase().includes(term))
    );

    currentPage = 1;
    renderBlockedTable();
}

// Pagination render
function renderPagination() {
    const displayData = isFiltering ? filteredData : blockedData_arr;
    const totalPages = Math.ceil(displayData.length / PAGE_SIZE);
    const paginationBox = document.getElementById('pagination');

    if (totalPages <= 1) {
        paginationBox.style.display = 'none';
        return;
    }

    paginationBox.innerHTML = '';
    paginationBox.style.display = 'flex';

    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Previous';
        prevBtn.className = 'pagination-btn';
        prevBtn.onclick = () => {
            currentPage--;
            renderBlockedTable();
            window.scrollTo(0, 0);
        };
        paginationBox.appendChild(prevBtn);
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'pagination-btn';
        if (i === currentPage) btn.classList.add('active');
        btn.onclick = () => {
            currentPage = i;
            renderBlockedTable();
            window.scrollTo(0, 0);
        };
        paginationBox.appendChild(btn);
    }

    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next →';
        nextBtn.className = 'pagination-btn';
        nextBtn.onclick = () => {
            currentPage++;
            renderBlockedTable();
            window.scrollTo(0, 0);
        };
        paginationBox.appendChild(nextBtn);
    }
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

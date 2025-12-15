// Dashboard page functionality - statistics and table rendering
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

let data = [];
let filteredData = [];

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
    header.innerHTML = '<tr>' +
        columns.map(col => '<th>' + col + '</th>').join('') +
        '<th>Actions</th></tr>';

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    displayData.forEach(row => {
        const tr = document.createElement('tr');

        const whatsappStatus = row['WhatsApp Status'] || row['whatsapp_status'] || '';
        if (whatsappStatus.toString().toLowerCase().trim() === 'blocked') {
            tr.className = 'blocked';
        } else if (whatsappStatus.toString().toLowerCase().trim() === 'active') {
            tr.className = 'active';
        } else if (whatsappStatus.toString().toLowerCase().trim() === 'restricted') {
            tr.className = 'restricted';
        }

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] || '';
            tr.appendChild(td);
        });

        const deleteTd = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn btn-cancel';
        deleteBtn.onclick = () => deleteRowFromDashboard(row.id, tr, deleteBtn);
        deleteTd.appendChild(deleteBtn);
        tr.appendChild(deleteTd);

        tbody.appendChild(tr);
    });
}

async function deleteRowFromDashboard(rowId, rowElem, btnElem) {
    if (!confirm('Really delete this row?')) return;
    btnElem.disabled = true;
    btnElem.textContent = 'Deleting...';
    try {
        await deleteRowFromDB(rowId);
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

async function initDashboardPage() {
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

console.log('Activity Summary script loaded successfully');
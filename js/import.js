const PLATFORM = {
    'whatsapp': 'numbers',
    'facebook': 'facebook',
    'instagram': 'instagram',
    'amazon': 'amazon_accounts',
    'telegram': 'telegram'
};

function triggerImport() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput) {
        showMessage('❌ Import file input not found', 'error');
        return;
    }
    fileInput.value = '';
    fileInput.click();
}

document.addEventListener('change', async (e) => {
    if (e.target && e.target.id === 'importFile') {
        const file = e.target.files[0];
        if (!file) return;

        const importBtn = document.querySelector('[onclick="triggerImport()"]') || 
                         document.getElementById('importBtn');
        const originalText = importBtn ? importBtn.textContent : '';

        const platform = document.getElementById('platformDropdown')?.value;
        console.log('Selected platform for import:', platform);
        const tableName = PLATFORM[platform];

        // Loading state ON
        if (importBtn) {
            importBtn.disabled = true;
            importBtn.textContent = '⏳ Importing...';
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

            // Import the data using database function
            // await importCSVData(newRecords);
            await importCSVData(newRecords, tableName);

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
                importBtn.textContent = originalText || '📤 Import CSV';
            }
        }
    }
});

console.log('Import script loaded successfully');
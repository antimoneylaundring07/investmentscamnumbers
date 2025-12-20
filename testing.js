
// Store current platform
let currentPlatform = 'whatsapp';
const PLATFORM_TABLES = {
    'whatsapp': 'whatsapp',           // Adjust to your actual table names
    'facebook': 'facebook',
    'instagram': 'instagram',
    'amazon': 'amazon'
};

// Handle platform dropdown change
async function handlePlatformChange(selectElement) {
    const newPlatform = selectElement.value;
    currentPlatform = newPlatform;

    // Reset search and filters
    isFiltering = false;
    filteredData = [];
    selectedRows.clear();

    // Hide table and show loading
    document.getElementById('dataTable').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loading').textContent = `Loading ${newPlatform} data...`;

    try {
        // Load data from the selected platform's table
        const fetchedData = await loadDataFromPlatform(newPlatform);
        data = fetchedData;

        // Reset UI elements
        document.getElementById('selectAllCheckbox').checked = false;
        updateDeleteButton();

        // Clear and recreate search box
        const existingSearch = document.querySelector('[id*="searchInputDash"]');
        if (existingSearch) {
            existingSearch.parentElement.remove();
        }

        document.getElementById('loading').style.display = 'none';
        document.getElementById('dataTable').style.display = 'table';

        createSearchBoxDashboard();
        renderDashboardTable();

        showMessage(`✅ Switched to ${newPlatform}`, 'success');
    } catch (error) {
        console.error('Platform change error:', error);
        document.getElementById('loading').innerHTML =
            `<div style="color: red;">❌ Error loading ${newPlatform} data: ${error.message}</div>`;
        showMessage(`❌ Error loading ${newPlatform} data`, 'error');
    }
}

// Function to load data from a specific platform table
async function loadDataFromPlatform(platform) {
    const tableName = PLATFORM_TABLES[platform];
    if (!tableName) {
        throw new Error(`Unknown platform: ${platform}`);
    }

    // Call your existing loadData function but with platform parameter
    // You'll need to modify your database.js to support this
    // For now, this is a wrapper that you can adapt
    return await loadDataByTable(tableName);
}

// Initialize dashboard with Whatsapp data
async function initDashboardPageWithPlatform() {
    try {
        document.getElementById('loading').textContent = 'Loading Whatsapp data...';
        const fetchedData = await loadDataFromPlatform('whatsapp');
        data = fetchedData;
        filteredData = [];
        isFiltering = false;

        document.getElementById('loading').style.display = 'none';
        document.getElementById('dataTable').style.display = 'table';

        createSearchBoxDashboard();
        renderDashboardTable();
    } catch (error) {
        console.error('Init error:', error);
        document.getElementById('loading').innerHTML =
            `<div style="color: red;">❌ Error loading data: ${error.message}<br><br>
                    Check console for details.</div>`;
    }
}

// Override the original initDashboardPage
// Call this instead of initDashboardPage()
window.initDashboardPage = initDashboardPageWithPlatform;
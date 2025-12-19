// Page routing and initialization logic
function getPageType() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage === 'update_data.html') {
        return 'update_data';
    } else if (currentPage === 'index.html') {
        return 'dashboard';
    } else if (currentPage === 'login.html') {
        return 'login';
    } else if (currentPage === 'tracker.html') {
        return 'tracker';
    } else if (currentPage === 'all_numbers.html') {
        return 'all_numbers';
    } else if (currentPage === 'permanent_blocked.html') {
        return 'permanent_blocked';
    }
    return 'unknown';
}

document.addEventListener('DOMContentLoaded', () => {
    const pageType = getPageType();
    
    console.log(`🚀 Initializing page: ${pageType}`);
    
    switch(pageType) {
        case 'update_data':
            if (typeof initUpdateDatePage === 'function') {
                protectPage();
                initUpdateDatePage();
            }
            break;
        case 'dashboard':
            if (typeof initDashboardPage === 'function') {
                protectPage();
                initDashboardPage();
            }
            break;
        case 'tracker':
            if (typeof initTrackerPage === 'function') {
                protectPage();
                initTrackerPage();
            }
            break;
        case 'permanent_blocked':
            if (typeof initAllNumbersPage === 'function') {
                protectPage();
                fetchBlockedData();
            }
        case 'login':
            // Login page doesn't need protection
            break;
        default:
            console.warn('Unknown page type:', pageType);
    }
});

console.log('Router script loaded successfully');
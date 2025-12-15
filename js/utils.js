// Utility functions for common operations
function showMessage(text, type) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = text;
        messageBox.className = `message ${type}`;
        setTimeout(() => {
            messageBox.className = 'message';
        }, 4000);
    } else {
        const msg = document.createElement('div');
        msg.className = 'message ' + type;
        msg.textContent = text;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
    }
}

function clearMessage() {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.className = 'message';
    }
}

function isDateColumn(col) {
    const DATE_COLUMNS = ["Blocked Date", "Unblocked Date", "Recharge Date"];
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
        console.error('Date calculation error:', error);
        return "NA";
    }
}

function downloadCSV(data, filename = 'all_data.csv') {
    if (!data || data.length === 0) return;

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
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function downloadHeadersCSV(data) {
    if (!data || data.length === 0) {
        alert('No data loaded yet');
        return;
    }

    const columns = Object.keys(data[0]).filter(col => col !== 'id');
    const csv = columns.join(',') + '\n';

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'headers_only.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

console.log('Utils script loaded successfully');
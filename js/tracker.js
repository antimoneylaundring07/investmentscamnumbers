// tracker.js
// Tracker/Analytics page - statistics and dashboard metrics

let data = [];

function calculateStatistics(data) {
    const totalCount = data.length;

    const simTypeStats = {
        PREPAID: 0,
        POSTPAID: 0,
        Disposable_numbers: 0
    };

    const whatsappStatusStats = {
        Active: 0,
        Blocked: 0,
        Restricted: 0
    };

    const accountTypeStats = {
        Business: 0,
        Normal: 0
    };

    const whatsappLoginDeviceStats = {};

    data.forEach((row, index) => {
        const simType = row['Sim Type'];

        if (simType) {
            const simTypeUpper = simType.trim();
            if (simTypeUpper === 'Prepaid') {
                simTypeStats.PREPAID++;
            } else if (simTypeUpper === 'Postpaid') {
                simTypeStats.POSTPAID++;
            } else if (simTypeUpper === 'Disposable Number') {
                simTypeStats.Disposable_numbers++;
            }
        }

        const whatsappStatus = row['WhatsApp Status'];

        if (whatsappStatus) {
            const statusLower = whatsappStatus.toString().toLowerCase().trim();
            if (statusLower === 'active') {
                whatsappStatusStats.Active++;
            } else if (statusLower === 'blocked') {
                whatsappStatusStats.Blocked++;
            } else if (statusLower === 'restricted') {
                whatsappStatusStats.Restricted++;
            }
        }

        const accountType = row['WA Acc Type'];

        if (accountType) {
            const accountLower = accountType.trim();

            if (accountLower === 'Bussiness Account') {
                accountTypeStats.Business++;
            } else {
                accountTypeStats.Normal++;
            }
        }

        const whatsappLoginDevice = row['Whatsapp Login Device'];
        if (whatsappLoginDevice) {
            const deviceName = whatsappLoginDevice.trim();
            if (deviceName !== '') {
                whatsappLoginDeviceStats[deviceName] = (whatsappLoginDeviceStats[deviceName] || 0) + 1;
            }
        }
    });

    return {
        totalCount,
        simTypeStats,
        whatsappStatusStats,
        accountTypeStats,
        whatsappLoginDeviceStats
    };
}

function updateUI(stats) {
    document.getElementById('totalCount').textContent = stats.totalCount.toLocaleString();
    document.getElementById('prepaidCount').textContent = stats.simTypeStats.PREPAID;
    document.getElementById('postpaidCount').textContent = stats.simTypeStats.POSTPAID;
    document.getElementById('disposable_number').textContent = stats.simTypeStats.Disposable_numbers;
    document.getElementById('business_acc').textContent = stats.accountTypeStats.Business;
    document.getElementById('normal_acc').textContent = stats.accountTypeStats.Normal;
    document.getElementById('activeCount').textContent = stats.whatsappStatusStats.Active;
    document.getElementById('blockedCount').textContent = stats.whatsappStatusStats.Blocked;
    document.getElementById('restrictedCount').textContent = stats.whatsappStatusStats.Restricted;

    const deviceContainer = document.getElementById('whatsappLoginDeviceContainer');
    if (deviceContainer && stats.whatsappLoginDeviceStats) {
        deviceContainer.innerHTML = '';

        const sortedDevices = Object.entries(stats.whatsappLoginDeviceStats)
            .sort((a, b) => b[1] - a[1]);

        sortedDevices.forEach(([device, count]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding-left: 12px;">${device}</td>
                <td style="text-align: right;">${count}</td>
            `;
            deviceContainer.appendChild(row);
        });
    }
}

async function initTrackerPage() {
    try {
        const fetchedData = await loadData();
        const stats = calculateStatistics(fetchedData);

        document.getElementById('loading').style.display = 'none';
        document.getElementById('summaryContainer').style.display = 'block';

        updateUI(stats);
    } catch (error) {
        document.getElementById('loading').innerHTML =
            `<div style="color: red;">❌ Error loading data: ${error.message}<br><br>
            Check console for details.</div>`;
    }
}

console.log('Tracker script loaded successfully');
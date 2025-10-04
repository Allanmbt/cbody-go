/**
 * CBODY Partner App - Homepage Interactions
 * Handles robot switch, modal dialogs, countdowns, and fake data rendering
 */

// ==================== DOM Elements ====================
const robotSwitch = document.getElementById('robotSwitch');
const statusText = document.getElementById('statusText');
const offlineBanner = document.getElementById('offlineBanner');
const robotOfflineCard = document.getElementById('robotOfflineCard');
const earlyLeaveModal = document.getElementById('earlyLeaveModal');
const leaveTimeInput = document.getElementById('leaveTime');
const cancelLeaveBtn = document.getElementById('cancelLeaveBtn');
const confirmLeaveBtn = document.getElementById('confirmLeaveBtn');
const turnOnRobotBtn = document.getElementById('turnOnRobotBtn');
const toast = document.getElementById('toast');

// ==================== State Management ====================
let isRobotOnline = true;

// ==================== Robot Switch Handler ====================
if (robotSwitch) {
    robotSwitch.addEventListener('change', function () {
        if (this.checked) {
            // Robot is turning ON (no modal needed)
            isRobotOnline = true;
            updateStatus('online');
        } else {
            // Robot is turning OFF - show early leave modal
            openEarlyLeaveModal();
        }
    });
}

// ==================== Modal Functions ====================
function openEarlyLeaveModal() {
    // Set current time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    leaveTimeInput.value = `${hours}:${minutes}`;

    // Show modal
    earlyLeaveModal.classList.remove('hidden');
}

function closeEarlyLeaveModal() {
    earlyLeaveModal.classList.add('hidden');
    // Reset switch to ON if user cancels
    if (robotSwitch) {
        robotSwitch.checked = true;
    }
}

// Cancel early leave
if (cancelLeaveBtn) {
    cancelLeaveBtn.addEventListener('click', closeEarlyLeaveModal);
}

// Confirm early leave
if (confirmLeaveBtn) {
    confirmLeaveBtn.addEventListener('click', function () {
        const reason = document.getElementById('leaveReason').value;

        if (!reason) {
            showToast('Please select a reason', 'error');
            return;
        }

        // Submit early leave
        isRobotOnline = false;
        updateStatus('offline');
        closeEarlyLeaveModal();
        showToast('Early leave recorded', 'success');
    });
}

// ==================== Turn On Robot from Card ====================
if (turnOnRobotBtn) {
    turnOnRobotBtn.addEventListener('click', function () {
        isRobotOnline = true;
        updateStatus('online');

        // Hide the offline card
        if (robotOfflineCard) {
            robotOfflineCard.classList.add('hidden');
        }

        // Update switch
        if (robotSwitch) {
            robotSwitch.checked = true;
        }

        showToast('Robot turned on successfully', 'success');
    });
}

// ==================== Status Update ====================
function updateStatus(status) {
    const statusBadge = statusText.parentElement;

    if (status === 'online') {
        // Online status
        statusBadge.className = 'bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center space-x-1';
        statusBadge.innerHTML = '<span class="w-2 h-2 bg-green-500 rounded-full"></span><span id="statusText">Online</span>';

        // Hide offline banner and card
        if (offlineBanner) offlineBanner.classList.add('hidden');
        if (robotOfflineCard) robotOfflineCard.classList.add('hidden');

    } else if (status === 'offline') {
        // Offline status
        statusBadge.className = 'bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center space-x-1';
        statusBadge.innerHTML = '<span class="w-2 h-2 bg-gray-500 rounded-full"></span><span id="statusText">Offline</span>';

        // Show offline banner and card
        if (offlineBanner) {
            offlineBanner.classList.remove('hidden');
            offlineBanner.classList.add('offline-banner');
        }
        if (robotOfflineCard) robotOfflineCard.classList.remove('hidden');
    }
}

// ==================== Toast Notification ====================
function showToast(message, type = 'success') {
    if (!toast) return;

    const icon = toast.querySelector('i');
    const text = toast.querySelector('span');

    // Update content
    text.textContent = message;

    // Update icon based on type
    icon.className = type === 'success' ? 'fas fa-check-circle' :
        type === 'warning' ? 'fas fa-exclamation-triangle' :
            type === 'error' ? 'fas fa-times-circle' :
                'fas fa-info-circle';

    // Update colors
    toast.className = `absolute top-20 left-4 right-4 p-4 rounded-xl shadow-lg transform transition-all duration-300 z-50 ${type === 'success' ? 'bg-green-500' :
            type === 'warning' ? 'bg-yellow-500' :
                type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
        } text-white translate-y-0 opacity-100`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.className = toast.className.replace('translate-y-0 opacity-100', '-translate-y-full opacity-0');
    }, 3000);
}

// ==================== Countdown Timer for Pending Orders ====================
function startCountdown(element, minutes, seconds) {
    let totalSeconds = minutes * 60 + seconds;

    const interval = setInterval(() => {
        if (totalSeconds <= 0) {
            clearInterval(interval);
            element.textContent = '00:00';
            element.parentElement.parentElement.innerHTML = '<span class="text-sm text-red-600 font-semibold">Expired</span>';
            return;
        }

        totalSeconds--;
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        element.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
}

// Initialize countdowns on page load
document.addEventListener('DOMContentLoaded', function () {
    // Find all countdown elements (if any)
    const countdownElements = document.querySelectorAll('[data-countdown]');

    countdownElements.forEach(element => {
        const [mins, secs] = element.textContent.split(':').map(Number);
        if (!isNaN(mins) && !isNaN(secs)) {
            startCountdown(element, mins, secs);
        }
    });
});

// ==================== URL Parameter Handling ====================
// Handle URL parameters for tab switching (e.g., orders.html?tab=pending)
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Auto-switch tabs based on URL parameter
document.addEventListener('DOMContentLoaded', function () {
    const tabParam = getUrlParameter('tab');

    if (tabParam === 'ongoing' && document.getElementById('ongoing-tab')) {
        document.getElementById('ongoing-tab').click();
    } else if (tabParam === 'pending' && document.getElementById('pending-tab')) {
        document.getElementById('pending-tab').click();
    }

    const filterParam = getUrlParameter('filter');
    if (filterParam === 'unsettled') {
        // Handle income filter if on income page
        console.log('Filtering unsettled items');
    }
});

// ==================== Close modal on backdrop click ====================
if (earlyLeaveModal) {
    earlyLeaveModal.addEventListener('click', function (e) {
        if (e.target === earlyLeaveModal) {
            closeEarlyLeaveModal();
        }
    });
}

// ==================== Export for use in other pages ====================
if (typeof window !== 'undefined') {
    window.showToast = showToast;
    window.getUrlParameter = getUrlParameter;
}

// ==================== Debug ====================
console.log('CBODY Partner App initialized');

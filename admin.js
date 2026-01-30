// 📊 SECURITY SENTINEL - ADMIN DASHBOARD WITH REAL-TIME UPDATES
// Hackathon Problem 2: Unauthorized Entry & Tailgating

const BACKEND_URL = 'http://127.0.0.1:8000';
let autoRefreshInterval = null;

// Load incidents when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Admin Dashboard Loaded - Real-time Mode');
    loadIncidents();
    startAutoRefresh();
});

// ==================== AUTO REFRESH ====================
function startAutoRefresh() {
    // Refresh every 5 seconds
    autoRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refreshing data...');
        loadIncidents();
    }, 5000);
    
    console.log('✅ Auto-refresh enabled (every 5 seconds)');
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('⏸️ Auto-refresh disabled');
    }
}

// ==================== LOAD INCIDENTS ====================
async function loadIncidents() {
    let incidents = [];
    let fromBackend = false;
    
    // Try to fetch from backend first
    try {
        const response = await fetch(`${BACKEND_URL}/api/incidents`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            incidents = data.incidents || [];
            fromBackend = true;
            console.log('✅ Loaded from backend:', incidents.length, 'incidents');
            
            // Update last refresh time
            updateLastRefreshTime();
        } else {
            throw new Error(`Backend returned ${response.status}`);
        }
    } catch (error) {
        console.log('⚠️ Backend unavailable:', error.message);
        // Fallback to localStorage
        const stored = localStorage.getItem('incidents');
        incidents = stored ? JSON.parse(stored) : [];
        console.log('📱 Loaded from localStorage:', incidents.length, 'incidents');
    }
    
    // Update statistics
    updateStatistics(incidents);
    
    // Display incidents in table
    displayIncidents(incidents);
    
    const source = fromBackend ? 'backend database 🎯' : 'local storage 📱';
    const statusElement = document.getElementById('backendStatus');
    if (statusElement) {
        statusElement.textContent = fromBackend ? 'Connected' : 'Local Mode';
        statusElement.style.color = fromBackend ? '#4CAF50' : '#FF9800';
    }
}

// Update last refresh timestamp
function updateLastRefreshTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const element = document.getElementById('lastRefresh');
    if (element) {
        element.textContent = `Last updated: ${timeString}`;
    } else {
        // Create element if doesn't exist
        const header = document.querySelector('.dashboard-header');
        if (header) {
            const refreshDiv = document.createElement('div');
            refreshDiv.id = 'lastRefresh';
            refreshDiv.style.cssText = 'font-size: 0.85rem; opacity: 0.7; margin-top: 5px;';
            refreshDiv.textContent = `Last updated: ${timeString}`;
            header.querySelector('div').appendChild(refreshDiv);
        }
    }
}

// ==================== UPDATE STATISTICS ====================
function updateStatistics(incidents) {
    const total = incidents.length;
    
    // Count today's incidents
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const today = incidents.filter(inc => {
        try {
            const incDate = new Date(inc.timestamp);
            return incDate > oneDayAgo;
        } catch (e) {
            return false;
        }
    }).length;
    
    // Count tailgating incidents
    const tailgating = incidents.filter(inc => 
        inc.type === 'TAILGATING' || inc.type === 'TAILGATING_YOLO'
    ).length;
    
    // Count evidence captures
    const evidence = incidents.filter(inc => inc.type === 'EVIDENCE').length;
    
    // Animate count updates
    animateCount('totalIncidents', total);
    animateCount('tailgatingIncidents', tailgating);
    animateCount('todayIncidents', today);
    animateCount('evidenceCount', evidence);
}

// Animate number changes
function animateCount(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent) || 0;
    if (currentValue === targetValue) return;
    
    // Smooth animation
    const duration = 500; // ms
    const steps = 20;
    const increment = (targetValue - currentValue) / steps;
    let current = currentValue;
    let step = 0;
    
    const timer = setInterval(() => {
        step++;
        current += increment;
        element.textContent = Math.round(current);
        
        if (step >= steps) {
            element.textContent = targetValue;
            clearInterval(timer);
            
            // Flash effect on change
            if (currentValue !== targetValue) {
                element.style.color = '#4CAF50';
                setTimeout(() => {
                    element.style.color = '';
                }, 500);
            }
        }
    }, duration / steps);
}

// ==================== DISPLAY INCIDENTS IN TABLE ====================
function displayIncidents(incidents) {
    const tbody = document.getElementById('incidentsBody');
    
    if (incidents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No incidents recorded yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    // Show most recent first
    const sortedIncidents = [...incidents].sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA; // Newest first
    });
    
    sortedIncidents.forEach((incident, index) => {
        const row = document.createElement('tr');
        
        // Format timestamp
        let formattedDate = '--';
        try {
            const date = new Date(incident.timestamp);
            formattedDate = date.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            console.error('Date parse error:', e);
        }
        
        // Format location
        let location = 'Unknown';
        if (incident.location) {
            if (incident.location.name) {
                location = incident.location.name;
            } else if (incident.location.lat && incident.location.lon) {
                if (typeof incident.location.lat === 'number') {
                    location = `${incident.location.lat.toFixed(4)}, ${incident.location.lon.toFixed(4)}`;
                }
            } else if (incident.location.city) {
                location = incident.location.city;
            }
        }
        
        // Format type
        let displayType = incident.type || 'SOS';
        if (displayType === 'TAILGATING_YOLO') {
            displayType = 'TAILGATING 🎯';
        }
        
        // Status badge
        const status = incident.status || 'DETECTED';
        const statusClass = status === 'ACTIVE' || status === 'DETECTED' ? 'status-active' : 'status-resolved';
        
        // Row styling based on type
        const rowStyle = incident.type === 'TAILGATING' || incident.type === 'TAILGATING_YOLO' 
            ? 'background: rgba(244, 67, 54, 0.05);' 
            : '';
        
        row.style.cssText = rowStyle;
        row.innerHTML = `
            <td><strong>#${incident.id || index + 1}</strong></td>
            <td>${formattedDate}</td>
            <td><strong>${displayType}</strong></td>
            <td>${location}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td>
                <button onclick="viewDetails(${incident.id || index})" 
                    style="padding: 5px 12px; background: rgba(33, 150, 243, 0.3); border: 1px solid rgba(33, 150, 243, 0.5); border-radius: 5px; color: white; cursor: pointer; font-size: 0.9rem;">
                    👁️ View
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// ==================== VIEW INCIDENT DETAILS ====================
async function viewDetails(incidentId) {
    try {
        // Try to fetch from backend first
        const response = await fetch(`${BACKEND_URL}/api/incidents/${incidentId}`);
        if (response.ok) {
            const data = await response.json();
            const incident = data.incident;
            showIncidentModal(incident);
        } else {
            // Fallback to localStorage
            const stored = localStorage.getItem('incidents');
            const incidents = stored ? JSON.parse(stored) : [];
            const incident = incidents.find(inc => inc.id === incidentId);
            if (incident) {
                showIncidentModal(incident);
            } else {
                showToast('❌ Incident not found', 'error');
            }
        }
    } catch (error) {
        console.error('Error fetching incident:', error);
        showToast('❌ Failed to load incident details', 'error');
    }
}

function showIncidentModal(incident) {
    const details = `
📋 INCIDENT DETAILS

ID: #${incident.id}
Timestamp: ${new Date(incident.timestamp).toLocaleString()}
Type: ${incident.type || 'SOS'}
Status: ${incident.status || 'N/A'}
Persons: ${incident.persons || 1}

Location:
${JSON.stringify(incident.location, null, 2)}

${incident.detection_method ? `Detection Method: ${incident.detection_method}` : ''}
${incident.confidence_scores ? `Confidence Scores: ${incident.confidence_scores.map(s => (s * 100).toFixed(1) + '%').join(', ')}` : ''}

${incident.size ? `Video Size: ${(incident.size / 1024 / 1024).toFixed(2)} MB` : ''}

    ${incident.evidence_url ? `Evidence: ${incident.evidence_url}` : ''}
    `;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; color: white; position: relative;">
            <button onclick="this.closest('div[style*=fixed]').remove()" 
                style="position: absolute; top: 10px; right: 10px; background: rgba(255, 255, 255, 0.2); border: none; color: white; font-size: 24px; cursor: pointer; width: 35px; height: 35px; border-radius: 50%;">
                ×
            </button>
            <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6;">${details}</pre>
            <div id="evidenceLink" style="margin-top:10px"></div>
            <button onclick="this.closest('div[style*=fixed]').remove()" 
                style="margin-top: 20px; padding: 10px 20px; background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 8px; color: white; cursor: pointer; width: 100%;">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);

    // If evidence url exists, add a clickable link
    if (incident.evidence_url) {
        const linkContainer = document.getElementById('evidenceLink');
        if (linkContainer) {
            const a = document.createElement('a');
            a.href = `${BACKEND_URL}${incident.evidence_url}`;
            a.target = '_blank';
            a.textContent = '🔗 View Evidence';
            a.style.cssText = 'display:inline-block;padding:8px 12px;background:#3f51b5;border-radius:8px;color:white;text-decoration:none;';
            linkContainer.appendChild(a);
        }
    }

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

// ==================== MANUAL REFRESH BUTTON ====================
window.loadIncidents = loadIncidents; // Make available globally

// ==================== CLEANUP ====================
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});

// ==================== STARTUP ====================
console.log(`
╔════════════════════════════════════════════════════╗
║   📊 ADMIN DASHBOARD - SECURITY SENTINEL          ║
║   Real-time Auto-Refresh Every 5 Seconds          ║
║   Backend API Integration Active                  ║
╚════════════════════════════════════════════════════╝
`);
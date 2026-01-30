// 🔹 SECURITY SENTINEL - CAMERA PAGE WITH REAL YOLO BACKEND INTEGRATION
// Software-based AI detection - NO HARDWARE REQUIRED

// ==================== CONFIGURATION ====================
const BACKEND_URL = 'http://127.0.0.1:8000';
let detectionInterval = null;
let isDetecting = false;
let videoElement = null;
let statsUpdateInterval = null;

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔹 Camera page initialized - SOFTWARE DEMO MODE');
    videoElement = document.getElementById('videoPreview');
    initializeCamera();
    setupEventListeners();
    checkBackendConnection();
});

// ==================== CHECK BACKEND CONNECTION ====================
async function checkBackendConnection() {
    try {
        const response = await fetch(`${BACKEND_URL}/`);
        const data = await response.json();
        if (data.status === 'active') {
            showToast('✅ Backend connected - YOLO AI Ready!', 'success');
            console.log('✅ Backend:', data);
        }
    } catch (error) {
        showToast('⚠️ Backend offline - Starting anyway (demo mode)', 'warning');
        console.log('Backend unavailable, will retry on detection');
    }
}

// ==================== CAMERA INITIALIZATION ====================
async function initializeCamera() {
    try {
        updateStatus('detectionStatus', '⏳ Initializing Camera...', 'inactive');

        if (videoElement) {
            try {
                // REQUEST REAL CAMERA ACCESS (for SOFTWARE demo)
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640, min: 320 },
                        height: { ideal: 480, min: 240 },
                        facingMode: 'user',
                        frameRate: { ideal: 15, min: 10 }
                    },
                    audio: false
                });

                // CONNECT REAL CAMERA TO VIDEO ELEMENT
                videoElement.srcObject = stream;
                await videoElement.play();

                updateStatus('detectionStatus', '✅ Camera Ready - Click "Start Detection" for AI', 'inactive');
                showToast('✅ Camera initialized successfully!', 'success');
                console.log('🔹 Camera ready:', stream.getVideoTracks()[0].getSettings());

                // Store stream for cleanup
                window.cameraStream = stream;

            } catch (cameraError) {
                console.error('Camera access denied:', cameraError);
                updateStatus('detectionStatus', '⚠️ No Camera - Using Test Image', 'inactive');

                // Show friendly error
                if (cameraError.name === 'NotAllowedError') {
                    showToast('📸 Please allow camera access in browser settings', 'warning');
                } else {
                    showToast('📸 No camera found - will use test images', 'warning');
                }

                // Load test image instead
                loadTestImage();
            }
        }
    } catch (error) {
        console.error('Initialization error:', error);
        updateStatus('detectionStatus', '❌ Error - Check console', 'inactive');
    }
}

// Load test image if no camera available
function loadTestImage() {
    // Create a canvas with a test pattern
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Draw test pattern
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#16213e';
    ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('📸 TEST IMAGE MODE', canvas.width / 2, canvas.height / 2 - 30);
    
    ctx.font = '16px Arial';
    ctx.fillText('(Software Demo - No Camera Required)', canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('Click "Start Detection" to test YOLO AI', canvas.width / 2, canvas.height / 2 + 40);

    // Set as video source
    videoElement.srcObject = canvas.captureStream(15);
    videoElement.play();
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    document.getElementById('startDetection').addEventListener('click', startDetection);
    document.getElementById('stopDetection').addEventListener('click', stopDetection);
    document.getElementById('captureEvidence').addEventListener('click', captureEvidence);
}

// ==================== DETECTION CONTROLS ====================
async function startDetection() {
    if (detectionInterval) return;

    document.getElementById('startDetection').disabled = true;
    document.getElementById('stopDetection').disabled = false;

    updateStatus('detectionStatus', '🔄 Starting AI Detection...', 'active');
    showToast('🤖 AI detection started - Sending frames to YOLO backend!', 'success');

    // Ensure audio is unlocked by a user gesture so alarm will play reliably
    await ensureAudioUnlocked();

    // Run detection every 2 seconds (to avoid overwhelming backend)
    detectionInterval = setInterval(async () => {
        await detectPersonsRealBackend();
    }, 2000);

    // Also run immediately
    await detectPersonsRealBackend();
}

function stopDetection() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }

    document.getElementById('startDetection').disabled = false;
    document.getElementById('stopDetection').disabled = true;

    updateStatus('detectionStatus', '⏸️ Detection Stopped', 'inactive');
    document.getElementById('detectionCount').textContent = '0';
    showToast('⏸️ AI detection stopped', 'warning');
    
    // Clear any bounding boxes
    clearBoundingBoxes();
}

// ==================== REAL BACKEND YOLO DETECTION ====================
async function detectPersonsRealBackend() {
    try {
        // Show processing indicator
        showProcessingIndicator(true);

        // Capture frame from video
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

        // Get geolocation (optional)
        let lat = null, lon = null;
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 1000 });
                });
                lat = position.coords.latitude;
                lon = position.coords.longitude;
            } catch (geoError) {
                console.log('Geolocation not available:', geoError.message);
            }
        }

        // Send to backend for REAL YOLO detection
        const formData = new FormData();
        formData.append('image_data', base64Image);
        if (lat) formData.append('lat', lat);
        if (lon) formData.append('lon', lon);
        formData.append('location_name', 'Camera Feed');

        const response = await fetch(`${BACKEND_URL}/api/detect/base64`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        const result = await response.json();
        console.log('🎯 YOLO Detection Result:', result);

        // Update UI with REAL detection results
        const personCount = result.person_count || 0;
        const detections = result.detections || [];
        
        document.getElementById('detectionCount').textContent = personCount;
        
        // Update status based on count
        if (personCount === 0) {
            updateStatus('detectionStatus', '✅ No persons detected', 'inactive');
        } else if (personCount === 1) {
            updateStatus('detectionStatus', '✅ 1 person detected', 'active');
        } else {
            updateStatus('detectionStatus', `🚨 TAILGATING! ${personCount} persons detected`, 'active');
        }

        // Draw bounding boxes from REAL YOLO results
        drawBoundingBoxes(detections);

        // Update detection log
        updateDetectionLog(personCount, detections, true);

        // Handle alerts
        if (result.tailgating_alert) {
            handleTailgatingAlert(personCount);
        }

        showProcessingIndicator(false);

    } catch (error) {
        console.error('❌ Detection error:', error);
        showProcessingIndicator(false);
        
        // Fallback to local simulation if backend fails
        showToast('⚠️ Backend unavailable - using local simulation', 'warning');
        await detectPersonsSimulation();
    }
}

// ==================== FALLBACK SIMULATION (if backend fails) ====================
async function detectPersonsSimulation() {
    try {
        // Simulate detection with realistic probabilities
        await new Promise(resolve => setTimeout(resolve, 100));

        let personCount;
        const rand = Math.random();
        if (rand < 0.7) {
            personCount = Math.floor(Math.random() * 2); // 0 or 1
        } else if (rand < 0.95) {
            personCount = 2; // Tailgating
        } else {
            personCount = Math.floor(Math.random() * 2) + 3; // 3 or 4
        }

        // Generate simulated detections
        const detections = [];
        for (let i = 0; i < personCount; i++) {
            const x1 = Math.random() * 0.5;
            const y1 = Math.random() * 0.4;
            const x2 = x1 + 0.2 + Math.random() * 0.2;
            const y2 = y1 + 0.4 + Math.random() * 0.3;
            
            detections.push({
                bbox: [x1, y1, x2, y2],
                confidence: 0.6 + Math.random() * 0.35,
                class: 'person',
                center: [(x1 + x2) / 2, (y1 + y2) / 2]
            });
        }

        // Update UI
        document.getElementById('detectionCount').textContent = personCount;
        
        if (personCount === 0) {
            updateStatus('detectionStatus', '✅ No persons (simulated)', 'inactive');
        } else if (personCount === 1) {
            updateStatus('detectionStatus', '✅ 1 person (simulated)', 'active');
        } else {
            updateStatus('detectionStatus', `🚨 ${personCount} persons (simulated)`, 'active');
        }

        drawBoundingBoxes(detections);
        updateDetectionLog(personCount, detections, false);

        if (personCount >= 2) {
            handleTailgatingAlert(personCount);
        }

    } catch (error) {
        console.error('Simulation error:', error);
    }
}

// ==================== DRAW BOUNDING BOXES ====================
function drawBoundingBoxes(detections) {
    let canvas = document.getElementById('detectionCanvas');

    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'detectionCanvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '10';
        videoElement.parentElement.style.position = 'relative';
        videoElement.parentElement.appendChild(canvas);
    }

    const videoWidth = videoElement.offsetWidth;
    const videoHeight = videoElement.offsetHeight;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    canvas.style.width = videoWidth + 'px';
    canvas.style.height = videoHeight + 'px';

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each detection
    detections.forEach((detection, index) => {
        const [x1, y1, x2, y2] = detection.bbox;
        const confidence = (detection.confidence * 100).toFixed(1);

        // Convert normalized coords to pixels
        const px1 = x1 * videoWidth;
        const py1 = y1 * videoHeight;
        const pWidth = (x2 - x1) * videoWidth;
        const pHeight = (y2 - y1) * videoHeight;

        // Draw bounding box
        ctx.strokeStyle = confidence > 80 ? '#00ff00' : confidence > 60 ? '#ffff00' : '#ff8800';
        ctx.lineWidth = 3;
        ctx.strokeRect(px1, py1, pWidth, pHeight);

        // Draw label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(px1, py1 - 25, 120, 25);

        // Draw label text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Person ${confidence}%`, px1 + 5, py1 - 7);
    });
}

function clearBoundingBoxes() {
    const canvas = document.getElementById('detectionCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// ==================== PROCESSING INDICATOR ====================
function showProcessingIndicator(show) {
    let indicator = document.getElementById('aiProcessing');
    if (!indicator && show) {
        indicator = document.createElement('div');
        indicator.id = 'aiProcessing';
        indicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 8px 12px;
            border-radius: 8px;
            color: #00ff00;
            font-size: 12px;
            z-index: 20;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        indicator.innerHTML = `
            <div style="display: flex; gap: 4px;">
                <span style="width: 6px; height: 6px; background: #00ff00; border-radius: 50%; animation: pulse 1.4s ease-in-out infinite;"></span>
                <span style="width: 6px; height: 6px; background: #00ff00; border-radius: 50%; animation: pulse 1.4s ease-in-out 0.2s infinite;"></span>
                <span style="width: 6px; height: 6px; background: #00ff00; border-radius: 50%; animation: pulse 1.4s ease-in-out 0.4s infinite;"></span>
            </div>
            <span>AI Processing...</span>
        `;
        videoElement.parentElement.appendChild(indicator);
    }
    
    if (indicator) {
        indicator.style.display = show ? 'flex' : 'none';
    }
}

// ==================== TAILGATING ALERT ====================
function handleTailgatingAlert(personCount) {
    playAlertSound();
    showToast(`🚨 TAILGATING ALERT! ${personCount} persons detected!`, 'error');
    
    console.log(`🚨 TAILGATING: ${personCount} persons at ${new Date().toLocaleTimeString()}`);
}

// ==================== ALERT SOUND (Reliable) ====================
function getAudioContext() {
    if (!window._tgAudioCtx) {
        window._tgAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return window._tgAudioCtx;
}

async function ensureAudioUnlocked() {
    const ctx = getAudioContext();
    try {
        if (ctx.state === 'suspended') {
            await ctx.resume();
            console.log('🔊 AudioContext resumed');
        }
    } catch (e) {
        console.warn('⚠️ Failed to resume AudioContext', e);
    }
}

async function playAlertSound() {
    const ctx = getAudioContext();
    await ensureAudioUnlocked();

    // Short 3-beep alarm pattern with smooth gain envelopes
    const now = ctx.currentTime;
    const pattern = [0, 0.25, 0.55]; // seconds offsets
    const freqs = [900, 1200, 1500];

    pattern.forEach((offset, i) => {
        const start = now + offset;
        const duration = 0.22;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqs[i], start);

        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.6, start + 0.02);
        g.gain.linearRampToValueAtTime(0.0, start + duration);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
    });
}

// ==================== EVIDENCE CAPTURE ====================
async function captureEvidence() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 480;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Get base64 image
        const base64Image = canvas.toDataURL('image/jpeg', 0.9);

        // Save to localStorage
        const evidence = {
            timestamp: new Date().toISOString(),
            image: base64Image,
            type: 'EVIDENCE_CAPTURE'
        };

        const existingEvidence = JSON.parse(localStorage.getItem('evidence') || '[]');
        existingEvidence.push(evidence);
        localStorage.setItem('evidence', JSON.stringify(existingEvidence));

        console.log('📸 Evidence captured:', evidence.timestamp);
        showToast('📸 Evidence captured successfully!', 'success');

        // Try to send to backend evidence endpoint
        try {
            const form = new FormData();
            // Send full data URL so backend can parse with or without prefix
            form.append('image_data', base64Image);
            form.append('timestamp', evidence.timestamp);

            // Include number of persons detected (if available)
            const persons = parseInt(document.getElementById('detectionCount').textContent) || 0;
            form.append('persons', persons);
            form.append('location_name', 'Camera Evidence');

            const response = await fetch(`${BACKEND_URL}/api/evidence/capture`, {
                method: 'POST',
                body: form
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Evidence saved to backend:', data);
                showToast('📸 Evidence uploaded to backend', 'success');

                // Link to evidence file
                if (data.evidence_url) {
                    const url = `${BACKEND_URL}${data.evidence_url}`;
                    console.log('📁 Evidence URL:', url);
                    // Store evidence link locally for quick access
                    const stored = JSON.parse(localStorage.getItem('evidence') || '[]');
                    stored[stored.length - 1].backend_url = url;
                    localStorage.setItem('evidence', JSON.stringify(stored));

                    // Show link in a small modal
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    a.textContent = 'View Evidence';
                    a.style.cssText = 'display:inline-block;margin-top:8px;color:#fff;background:#3f51b5;padding:6px 10px;border-radius:6px;text-decoration:none;';

                    // Quick notification
                    const toast = document.getElementById('toast');
                    if (toast) {
                        toast.innerHTML = '';
                        toast.appendChild(a);
                        toast.className = 'toast success show';
                        setTimeout(() => toast.classList.remove('show'), 7000);
                    }
                }
            } else {
                console.log('Backend returned error while saving evidence');
                showToast('⚠️ Backend error when uploading evidence', 'error');
            }
        } catch (e) {
            console.log('Backend unavailable, evidence saved locally');
            showToast('⚠️ Evidence saved locally (offline)', 'warning');
        }

    } catch (error) {
        console.error('Evidence capture error:', error);
        showToast('❌ Failed to capture evidence', 'error');
    }
}

// ==================== DETECTION LOG ====================
function updateDetectionLog(personCount, detections, isRealYOLO) {
    const logContainer = document.getElementById('detectionLog');
    if (!logContainer) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';

    const avgConfidence = detections.length > 0 ?
        Math.round((detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length) * 100) : 0;

    const source = isRealYOLO ? '🎯 YOLO' : '🔄 Sim';
    
    logEntry.innerHTML = `
        <span class="log-time">${timestamp}</span>
        <span class="log-event">${source} ${personCount} person${personCount !== 1 ? 's' : ''}</span>
        <span class="log-confidence" style="background: ${avgConfidence > 70 ? 'rgba(76, 175, 80, 0.3)' : avgConfidence > 50 ? 'rgba(255, 193, 7, 0.3)' : 'rgba(244, 67, 54, 0.3)'};">${avgConfidence}%</span>
    `;

    logContainer.insertBefore(logEntry, logContainer.firstChild);

    // Keep only last 10 entries
    while (logContainer.children.length > 10) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

// ==================== UTILITIES ====================
function updateStatus(elementId, text, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = text;
        element.className = `detection-status status-${type}`;
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => toast.classList.remove('show'), 5000);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.cameraStream) {
        window.cameraStream.getTracks().forEach(track => track.stop());
    }
});

// ==================== STARTUP BANNER ====================
console.log(`
╔═══════════════════════════════════════════════════╗
║   🔹 CAMERA FEED - SECURITY SENTINEL            ║
║   SOFTWARE DEMO - NO HARDWARE REQUIRED           ║
║   Real YOLO AI Detection via Backend             ║
║   Fallback to Simulation if Backend Offline      ║
╚═══════════════════════════════════════════════════╝
`);
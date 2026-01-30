# TailGuard - AI-Powered Tailgating Detection 🔐

## Hackathon Problem 2: Unauthorized Entry & Tailgating

TailGuard is a comprehensive AI-powered security system designed to detect and prevent tailgating incidents in real-time. Using advanced computer vision with YOLOv8, the system monitors entry points and alerts security personnel when unauthorized access attempts are detected.

## 🚀 Features

- **Real-time Tailgating Detection**: AI-powered detection of multiple persons attempting entry simultaneously
- **YOLOv8 Integration**: State-of-the-art computer vision for accurate human detection
- **Live Monitoring Dashboard**: Web-based interface for real-time security monitoring
- **Incident Logging**: Comprehensive logging of all security incidents with timestamps
- **RESTful API**: FastAPI backend providing robust API endpoints for integration
- **Cross-platform Support**: Works with image uploads, base64 streams, and live camera feeds
- **Statistics Dashboard**: Real-time statistics and incident history
- **Admin Panel**: Management interface for reviewing and managing incidents

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance web framework for building APIs
- **YOLOv8**: Advanced object detection model for human recognition
- **Python**: Core programming language
- **Uvicorn**: ASGI server for running FastAPI applications

### Frontend
- **HTML5/CSS3**: Modern web interface with glassmorphism design
- **JavaScript**: Interactive client-side functionality
- **Leaflet.js**: Interactive maps for location visualization

### Data Storage
- **JSON**: Simple file-based storage for incident data (easily replaceable with databases)

## 📋 Requirements

- Python 3.8+
- Webcam or image input device (for live detection)
- Modern web browser with JavaScript enabled

## 🏗️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd tailguard
   ```

2. **Set up Python virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt  # make sure to use -r; previously using `pip install requirements.txt` will fail
   ```

4. **Enable real-time detection from browser (no hardware required):**
   - The frontend will attempt to access your webcam via the browser's `getUserMedia` API.
   - Allow camera access when your browser prompts (this enables live frame capture and AI detection).
   - The frontend will also request geolocation permission (optional) to provide accurate incident location to the backend.
   - If the YOLO model is not present locally, the backend will download `yolov8n.pt` automatically on first use or you can call the `/api/detect/load-model` endpoint to preload it.


4. **Install YOLOv8 model:**
   The YOLO model will be automatically downloaded on first use, or you can preload it by calling the `/api/detect/load-model` endpoint.

## 🚀 Usage

### Running the Backend Server

Quick (recommended) — start on Windows using helper script:

1. Open PowerShell, then:
   ```powershell
   cd backend
   .\run_backend.ps1
   # Tail logs:
   Get-Content backend\backend.log -Wait
   ```

Manual start (alternative):

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate virtual environment and start server:
   ```powershell
   .\venv\Scripts\Activate.ps1
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level debug
   ```

3. The API will be available at: `http://127.0.0.1:8000`
4. Interactive API documentation: `http://127.0.0.1:8000/docs`

Notes: If the server starts and immediately stops, check the log file `backend/backend.log` (or run with `--log-level debug`) and ensure no antivirus/firewall is blocking Python. If you're running from OneDrive-synced folder, try moving the project to a non-synced local folder to prevent file-locking/reloader interference.

## ✅ Files to push for today's demo (priority)

Push these files first — they demonstrate live detection, evidence capture, counters and admin integration (minimum required for judges):

- `backend/main.py` — evidence endpoint (`/api/evidence/capture`), counter endpoints (`/api/counter/*`) and key API glue
- `backend/services/detection_service.py` — detection logic and threat calculations
- `frontend/camera.js` — live camera capture, base64 detection, evidence upload
- `frontend/monitor.js` — live monitor flow, detection loop, bounding boxes
- `frontend/script.js` — index UI, entry/exit counter buttons and sync logic
- `frontend/admin.js` — admin dashboard auto-refresh and evidence modal
- `frontend/index.html`, `frontend/monitor.html`, `frontend/camera.html`, `frontend/admin.html` — UI pages used in the demo
- `README.md` — updated demo instructions and API notes
- `.gitignore` — updated to ignore local evidence, model partials, and environment files

Suggested commit message for demo push:

```
Demo: Live detection + evidence capture + entry-exit counters — ready for judges
```

---

## 💾 Files to save for tomorrow (lower priority / polish)

These are useful follow-ups you can claim as "in-progress" the next day:

- `frontend/monitor.js` + `styles.css` — Threat level visualizations, pulsing animations, sound alerts for critical events
- `frontend/admin.js` — Charts/graphs (entry-exit mismatch visualization), incident filters, modal improvements
- Add tests: unit tests for `backend/main.py` endpoints and `detection_service.py`
- CI / deployment: Dockerfile, GitHub Actions or Azure/GCP deployment scripts
- Packaging and cleanup: move long-lived artifacts (model weights) to an external release or artifact storage and document steps

---

## 📌 Quick checklist before pushing (do this now)

1. Start backend and confirm `/api/detect/base64` and `/api/evidence/capture` work locally.
2. In your repo root run:

```bash
# create feature branch
git checkout -b feature/live-detection

# check what changed
git status

# stage the priority files
git add backend/main.py backend/services/detection_service.py frontend/camera.js frontend/monitor.js frontend/script.js frontend/admin.js frontend/index.html frontend/monitor.html frontend/camera.html frontend/admin.html README.md .gitignore

# commit
git commit -m "Demo: Live detection + evidence capture + entry-exit counters — ready for judges"

# push branch
git push -u origin feature/live-detection
```

3. Verify changed files in GitHub, attach a short PR description, and optionally add a screenshot or short recorded demo (MP4) to the PR.

---

These steps will ensure judges can run the demo locally and see at least 2-3 working features (live detection, evidence capture, admin incident log / stats) during review.

### Running the Frontend

1. Open your web browser
2. Navigate to the frontend directory and open `index.html`:
   ```bash
   cd frontend
   # Open index.html in your browser, or serve via a local server
   ```

   For better experience, serve the frontend using a local server:
   ```bash
   python -m http.server 3000
   ```
   Then visit: `http://localhost:3000`

## 📖 API Documentation

The backend provides the following key endpoints:

### Core Endpoints
- `GET /` - Health check and system status
- `POST /api/tailgating` - Report tailgating incidents
- `GET /api/incidents` - Retrieve all incidents
- `GET /api/incidents/{id}` - Get specific incident details
- `DELETE /api/incidents/{id}` - Delete incident (testing only)
- `GET /api/stats` - Get system statistics
- `POST /api/evidence/capture` - Upload base64 or file evidence; returns `evidence_url` and `incident_id`
- `POST /api/counter/entry` - Increment entry counter (returns counts)
- `POST /api/counter/exit` - Increment exit counter (returns counts)
- `GET /api/counter` - Get current entry/exit counts and discrepancy

### Detection Endpoints
- `POST /api/detect/image` - Detect humans in uploaded image
- `POST /api/detect/base64` - Detect humans from base64 image data
- `GET /api/detect/model-info` - Get YOLO model information
- `POST /api/detect/load-model` - Load YOLO model

## 📁 Project Structure

```
tailguard/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   ├── incidents_data.json     # Incident data storage
│   └── services/
│       └── detection_service.py # YOLO detection service
├── frontend/
│   ├── index.html             # Main dashboard
│   ├── styles.css             # CSS styling
│   ├── script.js              # Main JavaScript logic
│   ├── camera.html            # Camera interface
│   ├── camera.js              # Camera functionality
│   ├── monitor.html           # Monitoring interface
│   ├── monitor.js             # Monitoring logic
│   ├── admin.html             # Admin panel
│   ├── admin.js               # Admin functionality
│   └── assets/                # Static assets
│       └── alert siren mp3    # Alert sound
├── README.md                  # This file
└── .gitignore                 # Git ignore rules
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory for custom configurations:

```env
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### Model Configuration
The YOLO model configuration can be modified in `services/detection_service.py`:
- Model size (nano, small, medium, large)
- Confidence thresholds
- Detection classes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs`
- Review the code comments for implementation details
- Open an issue on GitHub for bugs or feature requests

## 🎯 Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- Real-time notifications (email/SMS)
- Multi-camera support
- Advanced analytics and reporting
- Mobile app companion
- Integration with existing security systems

---

**Built for Hackathon Problem 2: Unauthorized Entry & Tailgating**
*Empowering security through AI-driven detection*

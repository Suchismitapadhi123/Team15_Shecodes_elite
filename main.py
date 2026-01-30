# 🐍 TAILGUARD - TAILGATING DETECTION BACKEND (FastAPI)
# Hackathon Problem 2: Unauthorized Entry & Tailgating

from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os
import base64
try:
    from services.detection_service import get_detection_service
    DETECTION_AVAILABLE = True
except ImportError:
    print("⚠️ YOLO detection service not available (ultralytics not installed)")
    DETECTION_AVAILABLE = False
    def get_detection_service():
        return None

# ==================== FASTAPI APP INITIALIZATION ====================
app = FastAPI(
    title="TailGuard API",
    description="Backend API for Tailgating Detection System",
    version="1.0.0"
)

# ==================== CORS MIDDLEWARE (Allow Frontend to Connect) ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== DATA MODELS ====================
class TailgatingAlert(BaseModel):
    """Model for tailgating detection alert"""
    persons: int
    location: dict
    timestamp: str = None

class Incident(BaseModel):
    """Model for incident data"""
    timestamp: str
    type: str = "TAILGATING"
    persons: int = 1
    location: dict
    status: str = "DETECTED"

# ==================== IN-MEMORY DATABASE (Simple List) ====================
# In production, this would be a real database like PostgreSQL
# For hackathon demo, we use a simple list that resets on restart
incidents_db: List[dict] = []

# Optional: Save to file for persistence
DB_FILE = "incidents_data.json"

def load_db():
    """Load incidents from file if it exists"""
    global incidents_db
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r') as f:
            incidents_db = json.load(f)
        print(f"📂 Loaded {len(incidents_db)} incidents from file")

def save_db():
    """Save incidents to file"""
    with open(DB_FILE, 'w') as f:
        json.dump(incidents_db, f, indent=2)
    print(f"💾 Saved {len(incidents_db)} incidents to file")

# Load existing data on startup
load_db()

# ==================== API ENDPOINTS ====================

@app.get("/")
async def root():
    """
    Health check endpoint
    Returns basic info about the API
    """
    return {
        "message": "TailGuard - Tailgating Detection Backend Running",
        "status": "active",
        "version": "1.0.0",
        "problem": "Hackathon Problem 2: Unauthorized Entry & Tailgating",
        "total_incidents": len(incidents_db)
    }

@app.get("/health")
async def health():
    """Simple health endpoint for monitoring"""
    return {"status": "ok", "uptime": True, "incidents": len(incidents_db)}

@app.post("/api/tailgating")
async def report_tailgating(request: TailgatingAlert):
    """
    Tailgating Detection Alert Endpoint
    
    Receives tailgating alert from frontend with person count and location
    Saves incident to database
    In production, this would also:
    - Send alerts to security personnel
    - Trigger access control lockdown
    - Notify management
    """
    try:
        # Create incident record
        incident = {
            "id": len(incidents_db) + 1,
            "timestamp": request.timestamp or datetime.now().isoformat(),
            "type": "TAILGATING",
            "persons": request.persons,
            "location": request.location,
            "status": "DETECTED"
        }
        
        # Add to database
        incidents_db.append(incident)
        
        # Save to file
        save_db()
        
        print(f"🚨 TAILGATING DETECTED: {request.persons} persons | {incident}")
        
        return {
            "status": "success",
            "message": "Tailgating alert received and logged",
            "incident_id": incident["id"],
            "persons_detected": request.persons,
            "timestamp": incident["timestamp"]
        }
        
    except Exception as e:
        print(f"❌ Error processing alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/incidents")
async def get_incidents():
    """
    Get All Incidents Endpoint
    
    Returns all recorded incidents
    Used by admin dashboard to display incident history
    """
    try:
        # Return incidents in reverse chronological order (newest first)
        sorted_incidents = sorted(
            incidents_db, 
            key=lambda x: x.get('timestamp', ''), 
            reverse=True
        )
        
        return {
            "status": "success",
            "total": len(sorted_incidents),
            "incidents": sorted_incidents
        }
        
    except Exception as e:
        print(f"❌ Error fetching incidents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: int):
    """
    Get Single Incident Endpoint
    
    Returns details of a specific incident by ID
    """
    try:
        # Find incident by ID
        incident = next(
            (inc for inc in incidents_db if inc.get('id') == incident_id), 
            None
        )
        
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        return {
            "status": "success",
            "incident": incident
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching incident: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/incidents/{incident_id}")
async def delete_incident(incident_id: int):
    """
    Delete Incident Endpoint
    
    Deletes an incident from the database
    (Use with caution - for testing only)
    """
    try:
        global incidents_db
        
        # Find and remove incident
        incident = next(
            (inc for inc in incidents_db if inc.get('id') == incident_id), 
            None
        )
        
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        incidents_db = [inc for inc in incidents_db if inc.get('id') != incident_id]
        save_db()
        
        return {
            "status": "success",
            "message": f"Incident {incident_id} deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting incident: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_statistics():
    """
    Statistics Endpoint
    
    Returns summary statistics about incidents
    """
    try:
        total = len(incidents_db)
        active = len([inc for inc in incidents_db if inc.get('status') == 'ACTIVE'])
        
        # Count today's incidents
        today = datetime.now().date()
        today_count = len([
            inc for inc in incidents_db 
            if datetime.fromisoformat(inc.get('timestamp', '')).date() == today
        ])
        
        return {
            "status": "success",
            "stats": {
                "total_incidents": total,
                "active_incidents": active,
                "today_incidents": today_count
            }
        }
        
    except Exception as e:
        print(f"❌ Error calculating stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EVIDENCE STORAGE ENDPOINT ====================
# Serves saved evidence files from /evidence
if not os.path.exists('evidence'):
    os.makedirs('evidence')

app.mount("/evidence", StaticFiles(directory="evidence"), name="evidence")


@app.post("/api/evidence/capture")
async def capture_evidence(
    image_file: UploadFile = File(None),
    image_data: str = Form(None),
    timestamp: Optional[str] = Form(None),
    incident_id: Optional[int] = Form(None),
    location_name: Optional[str] = Form(None)
):
    """
    Capture Evidence Endpoint

    Accepts either an uploaded file or base64-encoded image data.
    Saves file to the `evidence/` folder and links it to an incident (if provided) or creates a new incident of type 'EVIDENCE'.
    Returns a downloadable URL to the saved evidence.
    """
    try:
        ts = timestamp or datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"evidence_{ts}.jpg"
        file_path = os.path.join('evidence', filename)

        # If a file upload is present, save it directly
        if image_file is not None:
            contents = await image_file.read()
            with open(file_path, 'wb') as f:
                f.write(contents)

        # Else handle base64 form data (data URL or raw base64)
        elif image_data is not None:
            # Remove data URL prefix if present
            if image_data.startswith('data:image'):
                image_data = image_data.split(',', 1)[1]
            try:
                decoded = base64.b64decode(image_data)
            except Exception:
                raise HTTPException(status_code=400, detail='Invalid base64 image data')
            with open(file_path, 'wb') as f:
                f.write(decoded)

        else:
            raise HTTPException(status_code=400, detail='No image provided')

        # Create or update incident record to reference evidence
        if incident_id:
            # Try to find existing incident
            incident = next((inc for inc in incidents_db if inc.get('id') == int(incident_id)), None)
            if incident:
                incident['evidence_url'] = f"/evidence/{filename}"
                save_db()
                return {
                    'status': 'success',
                    'message': 'Evidence saved and linked to incident',
                    'evidence_url': f"/evidence/{filename}",
                    'incident_id': incident.get('id')
                }

        # Else create a new EVIDENCE incident
        new_incident = {
            'id': len(incidents_db) + 1,
            'timestamp': datetime.now().isoformat(),
            'type': 'EVIDENCE',
            'persons': 0,
            'location': {'name': location_name or 'Evidence Capture'},
            'status': 'DETECTED',
            'evidence_url': f"/evidence/{filename}"
        }
        incidents_db.append(new_incident)
        save_db()

        return {
            'status': 'success',
            'message': 'Evidence saved successfully',
            'evidence_url': f"/evidence/{filename}",
            'incident_id': new_incident['id']
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error saving evidence: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ENTRY / EXIT COUNTERS ====================
@app.post('/api/counter/entry')
async def increment_entry():
    try:
        service = get_detection_service()
        service.entry_count += 1

        # Log a simple incident for traceability
        incident = {
            'id': len(incidents_db) + 1,
            'timestamp': datetime.now().isoformat(),
            'type': 'ENTRY',
            'persons': 1,
            'location': {'source': 'COUNTER'},
            'status': 'DETECTED'
        }
        incidents_db.append(incident)
        save_db()

        return {
            'status': 'success',
            'entry_count': service.entry_count,
            'exit_count': service.exit_count,
            'discrepancy': abs(service.entry_count - service.exit_count),
            'incident_id': incident['id']
        }
    except Exception as e:
        print(f"❌ Error incrementing entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post('/api/counter/exit')
async def increment_exit():
    try:
        service = get_detection_service()
        service.exit_count += 1

        incident = {
            'id': len(incidents_db) + 1,
            'timestamp': datetime.now().isoformat(),
            'type': 'EXIT',
            'persons': 1,
            'location': {'source': 'COUNTER'},
            'status': 'DETECTED'
        }
        incidents_db.append(incident)
        save_db()

        return {
            'status': 'success',
            'entry_count': service.entry_count,
            'exit_count': service.exit_count,
            'discrepancy': abs(service.entry_count - service.exit_count),
            'incident_id': incident['id']
        }
    except Exception as e:
        print(f"❌ Error incrementing exit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/api/counter')
async def get_counter():
    try:
        service = get_detection_service()
        return {
            'status': 'success',
            'entry_count': service.entry_count,
            'exit_count': service.exit_count,
            'discrepancy': abs(service.entry_count - service.exit_count)
        }
    except Exception as e:
        print(f"❌ Error getting counter: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== YOLO HUMAN DETECTION ENDPOINTS ====================

@app.post("/api/detect/image")
async def detect_from_image(file: UploadFile = File(...)):
    """
    Detect humans in uploaded image using YOLO

    Accepts image file upload and returns detection results
    """
    try:
        # Read image file
        contents = await file.read()

        # Save temporarily for processing
        temp_path = f"temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        with open(temp_path, 'wb') as f:
            f.write(contents)

        # Get detection service
        service = get_detection_service()

        # Run detection
        results = service.detect_from_file(temp_path)

        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        if not results['success']:
            raise HTTPException(status_code=500, detail=results.get('error', 'Detection failed'))

        # Create incident if tailgating detected
        person_count = results['person_count']
        if person_count >= 2:
            incident = {
                "id": len(incidents_db) + 1,
                "timestamp": datetime.now().isoformat(),
                "type": "TAILGATING_YOLO",
                "persons": person_count,
                "location": {"source": "YOLO_backend", "method": "image_upload"},
                "status": "DETECTED",
                "detection_method": "YOLOv8",
                "confidence_scores": [d['confidence'] for d in results['detections']]
            }
            incidents_db.append(incident)
            save_db()
            print(f"🚨 YOLO TAILGATING DETECTED: {person_count} persons")

        return {
            "status": "success",
            "person_count": person_count,
            "detections": results['detections'],
            "image_shape": results['image_shape'],
            "tailgating_alert": person_count >= 2
        }

    except Exception as e:
        print(f"❌ YOLO detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect/base64")
async def detect_from_base64(
    image_data: str = Form(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    location_name: Optional[str] = Form(None)
):
    """
    Detect humans from base64 encoded image

    Accepts base64 image data and optional geolocation (client-side) and returns detection results
    """
    try:
        # Get detection service
        service = get_detection_service()

        # Run detection
        results = service.detect_from_base64(image_data)

        if not results['success']:
            raise HTTPException(status_code=500, detail=results.get('error', 'Detection failed'))

        # Create incident if tailgating detected
        person_count = results['person_count']
        if person_count >= 2:
            # Use client-provided lat/lon if present, otherwise fallback to server geolocation
            if lat is not None and lon is not None:
                location = {
                    "source": "YOLO_backend",
                    "method": "base64_stream",
                    "lat": lat,
                    "lon": lon,
                    "name": location_name or "Unknown"
                }
            else:
                location_data = service.get_current_location()
                location = {
                    "source": "YOLO_backend",
                    "method": "base64_stream",
                    "city": location_data.get('city', 'Unknown'),
                    "region": location_data.get('region', 'Unknown'),
                    "country": location_data.get('country', 'Unknown'),
                    "lat": location_data.get('lat'),
                    "lon": location_data.get('lon'),
                    "timezone": location_data.get('timezone', 'UTC')
                }

            incident = {
                "id": len(incidents_db) + 1,
                "timestamp": datetime.now().isoformat(),
                "type": "TAILGATING_YOLO",
                "persons": person_count,
                "location": location,
                "status": "DETECTED",
                "detection_method": "YOLOv8",
                "confidence_scores": [d['confidence'] for d in results['detections']]
            }
            incidents_db.append(incident)
            save_db()
            print(f"🚨 YOLO TAILGATING DETECTED: {person_count} persons | location: {location}")

        return {
            "status": "success",
            "person_count": person_count,
            "detections": results['detections'],
            "tailgating_alert": person_count >= 2
        }

    except Exception as e:
        print(f"❌ YOLO base64 detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/detect/model-info")
async def get_model_info():
    """
    Get information about the YOLO model
    """
    try:
        service = get_detection_service()
        info = service.get_model_info()

        return {
            "status": "success",
            "model_info": info
        }

    except Exception as e:
        print(f"❌ Model info error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect/load-model")
async def load_yolo_model():
    """
    Load the YOLO model (call this before first detection)
    """
    try:
        service = get_detection_service()
        service.load_model()

        return {
            "status": "success",
            "message": "YOLO model loaded successfully"
        }

    except Exception as e:
        print(f"❌ Model loading error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== STARTUP EVENT ====================
@app.on_event("startup")
async def startup_event():
    """Run when server starts - improved logging and attempt to load model in background"""
    try:
        print("=" * 50)
        print("🔐 TAILGUARD BACKEND STARTED")
        print("Problem: Unauthorized Entry & Tailgating Detection")
        print("=" * 50)
        print(f"📊 Loaded {len(incidents_db)} existing incidents")
        print("🌐 Server running on: http://127.0.0.1:8000")
        print("📖 API docs available at: http://127.0.0.1:8000/docs")
        print("=" * 50)

        # Attempt to load YOLO model in background thread so server can respond quickly
        import threading
        service = get_detection_service()
        if service and service.model is None:
            print("⚙️ Loading YOLO model in background (this may take while if downloading weights)")
            threading.Thread(target=service.load_model, daemon=True).start()

    except Exception as e:
        print(f"❌ Error during startup_event: {e}")
        raise

# ==================== SHUTDOWN EVENT ====================
@app.on_event("shutdown")
async def shutdown_event():
    """Run when server stops - ensure DB saved and log reason"""
    try:
        save_db()
        print("💾 Data saved. Server shutting down.")
    except Exception as e:
        print(f"❌ Error during shutdown_event: {e}")
        raise

# ==================== RUN SERVER ====================
# To run this file:
# uvicorn main:app --reload --host 0.0.0.0 --port 8000

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
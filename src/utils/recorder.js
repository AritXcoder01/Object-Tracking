export class CanvasRecorder {
  constructor(canvas) {
    this.canvas = canvas;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordedBlob = null;
    this.recording = false;
  }

  startRecording(mimeType = 'video/webm') {
    if (this.recording) return;
    
    this.recordedChunks = [];
    const stream = this.canvas.captureStream(30);
    
    let options = { mimeType };
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn(`${mimeType} is not supported, using default`);
        options = {}; 
    }

    this.mediaRecorder = new MediaRecorder(stream, options);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start();
    this.recording = true;
  }

  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.recording || !this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.recordedBlob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder.mimeType
        });
        this.recording = false;
        resolve(this.recordedBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  isRecording() {
    return this.recording;
  }

  getRecordedBlob() {
    return this.recordedBlob;
  }

  downloadRecording(filename = 'detection-recording') {
    if (!this.recordedBlob) {
      console.warn('No recording available to download.');
      return;
    }
    const url = URL.createObjectURL(this.recordedBlob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    a.href = url;
    
    const ext = this.recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
    a.download = `${filename}.${ext}`;
    
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export function captureSnapshot(canvas, filename = 'detection-snapshot') {
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  a.href = dataUrl;
  a.download = `${filename}.png`;
  a.click();
  document.body.removeChild(a);
}

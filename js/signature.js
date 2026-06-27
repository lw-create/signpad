/**
 * 签名画布模块
 */
class SignaturePad {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.hasSignature = false;
        this.color = '#1a1a1a';
        this.thickness = 3;
        this.lastX = 0;
        this.lastY = 0;
        this.strokes = [];
        this.currentStroke = null;
    }

    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');

        this.setupCanvas();
        this.bindEvents();

        return this;
    }

    setupCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.ctx.scale(dpr, dpr);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.setColor(this.color);
        this.setThickness(this.thickness);

        this.redraw();
    }

    bindEvents() {
        this.canvas.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleEnd.bind(this));

        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleEnd.bind(this));

        window.addEventListener('resize', () => {
            const savedStrokes = JSON.parse(JSON.stringify(this.strokes));
            this.setupCanvas();
            this.strokes = savedStrokes;
            this.redraw();
        });
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    handleStart(e) {
        e.preventDefault();
        this.isDrawing = true;
        const pos = this.getPos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;

        this.currentStroke = {
            color: this.color,
            thickness: this.thickness,
            points: [pos]
        };

        this.canvas.parentElement.classList.add('signed');
    }

    handleMove(e) {
        if (!this.isDrawing) return;
        e.preventDefault();

        const pos = this.getPos(e);
        this.currentStroke.points.push(pos);

        this.ctx.strokeStyle = this.currentStroke.color;
        this.ctx.lineWidth = this.currentStroke.thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();

        this.lastX = pos.x;
        this.lastY = pos.y;

        this.hasSignature = true;
    }

    handleEnd(e) {
        if (this.isDrawing) {
            this.isDrawing = false;
            if (this.currentStroke && this.currentStroke.points.length > 1) {
                this.strokes.push(this.currentStroke);
            }
            this.currentStroke = null;
        }
    }

    redraw() {
        if (!this.ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.ctx.clearRect(0, 0, rect.width, rect.height);

        for (const stroke of this.strokes) {
            if (stroke.points.length < 2) continue;

            this.ctx.strokeStyle = stroke.color;
            this.ctx.lineWidth = stroke.thickness;
            this.ctx.beginPath();
            this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

            for (let i = 1; i < stroke.points.length; i++) {
                this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }

            this.ctx.stroke();
        }

        this.hasSignature = this.strokes.length > 0;
        if (this.hasSignature) {
            this.canvas.parentElement.classList.add('signed');
        } else {
            this.canvas.parentElement.classList.remove('signed');
        }
    }

    clear() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        this.strokes = [];
        this.hasSignature = false;
        this.canvas.parentElement.classList.remove('signed');
    }

    setColor(color) {
        this.color = color;
        if (this.ctx) {
            this.ctx.strokeStyle = color;
        }
        if (this.strokes.length > 0) {
            for (const stroke of this.strokes) {
                stroke.color = color;
            }
            this.redraw();
        }
    }

    setThickness(thickness) {
        this.thickness = thickness;
        if (this.ctx) {
            this.ctx.lineWidth = thickness;
        }
        if (this.strokes.length > 0) {
            for (const stroke of this.strokes) {
                stroke.thickness = thickness;
            }
            this.redraw();
        }
    }

    isEmpty() {
        return !this.hasSignature;
    }

    getImage() {
        if (!this.hasSignature) return null;

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(this.canvas, 0, 0, canvasWidth, canvasHeight);

        return tempCanvas.toDataURL('image/png');
    }

    saveSignature() {
        if (this.hasSignature) {
            const imageData = this.getImage();
            if (imageData) {
                localStorage.setItem('savedSignature', imageData);
            }
        }
    }

    loadSignature() {
        const savedData = localStorage.getItem('savedSignature');
        if (savedData) {
            const img = new Image();
            img.onload = () => {
                const rect = this.canvas.getBoundingClientRect();
                this.ctx.drawImage(img, 0, 0, rect.width, rect.height);
                this.hasSignature = true;
                this.canvas.parentElement.classList.add('signed');
            };
            img.src = savedData;
        }
    }
}

window.SignaturePad = SignaturePad;

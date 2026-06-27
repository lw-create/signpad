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
        this.points = [];
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
    }

    bindEvents() {
        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleEnd.bind(this));

        // 鼠标事件（用于测试）
        this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleEnd.bind(this));

        // 窗口大小变化
        window.addEventListener('resize', () => {
            if (this.hasSignature) {
                this.saveSignature();
                this.setupCanvas();
                this.loadSignature();
            } else {
                this.setupCanvas();
            }
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
        this.points = [pos];

        // 隐藏占位符
        this.canvas.parentElement.classList.add('signed');
    }

    handleMove(e) {
        if (!this.isDrawing) return;
        e.preventDefault();

        const pos = this.getPos(e);
        this.points.push(pos);

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
            this.points = [];
        }
    }

    clear() {
        const dpr = window.devicePixelRatio || 1;
        this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
        this.hasSignature = false;
        this.canvas.parentElement.classList.remove('signed');
    }

    setColor(color) {
        this.color = color;
        if (this.ctx) {
            this.ctx.strokeStyle = color;
        }
    }

    setThickness(thickness) {
        this.thickness = thickness;
        if (this.ctx) {
            this.ctx.lineWidth = thickness;
        }
    }

    isEmpty() {
        return !this.hasSignature;
    }

    getImage() {
        if (!this.hasSignature) return null;

        // 创建透明背景的画布，使用实际像素尺寸
        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasWidth;
        tempCanvas.height = canvasHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // 直接按实际像素尺寸绘制，不缩放
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

// 导出
window.SignaturePad = SignaturePad;

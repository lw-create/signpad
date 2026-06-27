/**
 * 导出模块
 */
class Exporter {
    constructor() {
        this.documentCanvas = null;
        this.exportCanvas = null;
        this.documentImage = null;
        this.signatureImage = null;
        this.signaturePosition = { x: 0, y: 0, scale: 1, rotation: 0 };
        this.documentScale = 1;
        this.documentOffset = { x: 0, y: 0 };
    }

    init(documentCanvasId, exportCanvasId) {
        this.documentCanvas = document.getElementById(documentCanvasId);
        this.exportCanvas = document.getElementById(exportCanvasId);
        return this;
    }

    setDocumentImage(imageData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.documentImage = img;
                this.renderDocumentCanvas();
                resolve();
            };
            img.onerror = reject;
            img.src = imageData;
        });
    }

    setSignatureImage(imageData) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.signatureImage = img;
                resolve();
            };
            img.onerror = reject;
            img.src = imageData;
        });
    }

    renderDocumentCanvas() {
        if (!this.documentCanvas || !this.documentImage) return;

        const ctx = this.documentCanvas.getContext('2d');
        const container = this.documentCanvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        if (containerRect.width === 0 || containerRect.height === 0) return;

        const scaleX = containerRect.width / this.documentImage.width;
        const scaleY = containerRect.height / this.documentImage.height;
        const scale = Math.min(scaleX, scaleY);

        const width = this.documentImage.width * scale;
        const height = this.documentImage.height * scale;

        this.documentCanvas.width = containerRect.width;
        this.documentCanvas.height = containerRect.height;

        const offsetX = (containerRect.width - width) / 2;
        const offsetY = (containerRect.height - height) / 2;

        ctx.clearRect(0, 0, containerRect.width, containerRect.height);
        ctx.drawImage(this.documentImage, offsetX, offsetY, width, height);

        this.documentScale = scale;
        this.documentOffset = { x: offsetX, y: offsetY };
    }

    setSignaturePosition(x, y, scale, rotation = 0) {
        this.signaturePosition = { x, y, scale, rotation };
    }

    getCompositeImage() {
        if (!this.documentImage || !this.signatureImage) return null;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.documentImage.width;
        tempCanvas.height = this.documentImage.height;
        const ctx = tempCanvas.getContext('2d');

        ctx.drawImage(this.documentImage, 0, 0);

        const sigOverlayWidth = 180;
        const sigOverlayHeight = 72;

        const screenSigW = sigOverlayWidth * this.signaturePosition.scale;
        const screenSigH = sigOverlayHeight * this.signaturePosition.scale;

        const origSigW = screenSigW / this.documentScale;
        const origSigH = screenSigH / this.documentScale;

        const origX = (this.signaturePosition.x - this.documentOffset.x) / this.documentScale;
        const origY = (this.signaturePosition.y - this.documentOffset.y) / this.documentScale;

        const centerX = origX + origSigW / 2;
        const centerY = origY + origSigH / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.signaturePosition.rotation * Math.PI / 180);
        ctx.drawImage(
            this.signatureImage,
            -origSigW / 2,
            -origSigH / 2,
            origSigW,
            origSigH
        );
        ctx.restore();

        return tempCanvas.toDataURL('image/png', 1.0);
    }

    renderExportPreview() {
        if (!this.exportCanvas) return;

        const container = this.exportCanvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        if (containerRect.width === 0 || containerRect.height === 0) return;

        const compositeImage = this.getCompositeImage();
        if (!compositeImage) return;

        const img = new Image();
        img.onload = () => {
            const ctx = this.exportCanvas.getContext('2d');

            const scaleX = containerRect.width / img.width;
            const scaleY = containerRect.height / img.height;
            const scale = Math.min(scaleX, scaleY);

            const width = img.width * scale;
            const height = img.height * scale;

            this.exportCanvas.width = containerRect.width;
            this.exportCanvas.height = containerRect.height;

            ctx.fillStyle = '#f5f4f2';
            ctx.fillRect(0, 0, containerRect.width, containerRect.height);
            ctx.drawImage(img, (containerRect.width - width) / 2, (containerRect.height - height) / 2, width, height);
        };
        img.src = compositeImage;
    }

    download(filename = 'signed_document.png') {
        const compositeImage = this.getCompositeImage();
        if (!compositeImage) {
            alert('生成失败，请重试');
            return;
        }

        const link = document.createElement('a');
        link.download = filename;
        link.href = compositeImage;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    getImageData() {
        return this.getCompositeImage();
    }
}

window.Exporter = Exporter;

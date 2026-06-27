/**
 * 导出模块
 */
class Exporter {
    constructor() {
        this.documentCanvas = null;
        this.signatureImage = null;
        this.exportCanvas = null;
        this.signaturePosition = { x: 0, y: 0, scale: 1, rotation: 0 };
    }

    init(documentCanvasId, exportCanvasId) {
        this.documentCanvas = document.getElementById(documentCanvasId);
        this.exportCanvas = document.getElementById(exportCanvasId);
        return this;
    }

    setDocumentImage(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.documentImage = img;
                this.renderDocumentCanvas();
                resolve();
            };
            img.src = imageData;
        });
    }

    setSignatureImage(imageData) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.signatureImage = img;
                resolve();
            };
            img.src = imageData;
        });
    }

    renderDocumentCanvas() {
        if (!this.documentCanvas || !this.documentImage) return;

        const ctx = this.documentCanvas.getContext('2d');
        const container = this.documentCanvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        // 计算缩放比例
        const scaleX = containerRect.width / this.documentImage.width;
        const scaleY = containerRect.height / this.documentImage.height;
        const scale = Math.min(scaleX, scaleY);

        const width = this.documentImage.width * scale;
        const height = this.documentImage.height * scale;

        this.documentCanvas.width = containerRect.width;
        this.documentCanvas.height = containerRect.height;

        // 居中绘制
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
        if (!this.documentCanvas || !this.signatureImage) return null;

        const container = this.documentCanvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        // 创建临时画布
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.documentImage.width;
        tempCanvas.height = this.documentImage.height;
        const ctx = tempCanvas.getContext('2d');

        // 绘制文档
        ctx.drawImage(this.documentImage, 0, 0);

        // 计算签名位置
        const signatureWidth = this.signatureImage.width * this.signaturePosition.scale * this.documentScale;
        const signatureHeight = this.signatureImage.height * this.signaturePosition.scale * this.documentScale;

        const x = this.documentOffset.x + this.signaturePosition.x * this.documentScale;
        const y = this.documentOffset.y + this.signaturePosition.y * this.documentScale;

        // 绘制签名
        ctx.save();
        ctx.translate(x + signatureWidth / 2, y + signatureHeight / 2);
        ctx.rotate(this.signaturePosition.rotation * Math.PI / 180);
        ctx.drawImage(
            this.signatureImage,
            -signatureWidth / 2,
            -signatureHeight / 2,
            signatureWidth,
            signatureHeight
        );
        ctx.restore();

        return tempCanvas.toDataURL('image/png', 1.0);
    }

    renderExportPreview() {
        if (!this.exportCanvas) return;

        const compositeImage = this.getCompositeImage();
        if (!compositeImage) return;

        const img = new Image();
        img.onload = () => {
            const ctx = this.exportCanvas.getContext('2d');
            const container = this.exportCanvas.parentElement;
            const containerRect = container.getBoundingClientRect();

            // 计算缩放
            const scaleX = containerRect.width / img.width;
            const scaleY = containerRect.height / img.height;
            const scale = Math.min(scaleX, scaleY);

            const width = img.width * scale;
            const height = img.height * scale;

            this.exportCanvas.width = containerRect.width;
            this.exportCanvas.height = containerRect.height;

            ctx.clearRect(0, 0, containerRect.width, containerRect.height);
            ctx.drawImage(img, (containerRect.width - width) / 2, (containerRect.height - height) / 2, width, height);
        };
        img.src = compositeImage;
    }

    download(filename = 'signed_document.png') {
        const compositeImage = this.getCompositeImage();
        if (!compositeImage) return;

        const link = document.createElement('a');
        link.download = filename;
        link.href = compositeImage;
        link.click();
    }

    getImageData() {
        return this.getCompositeImage();
    }
}

// 导出
window.Exporter = Exporter;

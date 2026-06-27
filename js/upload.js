/**
 * 图片上传模块
 */
class DocumentUpload {
    constructor() {
        this.container = null;
        this.fileInput = null;
        this.imageElement = null;
        this.imageData = null;
        this.onImageLoaded = null;
    }

    init(containerElement) {
        this.container = containerElement;
        this.fileInput = document.getElementById('fileInput');
        this.imageElement = document.getElementById('previewImage');

        this.bindEvents();

        return this;
    }

    bindEvents() {
        if (this.fileInput) {
            this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        this.showLoading();

        const reader = new FileReader();
        reader.onload = (event) => {
            this.loadImage(event.target.result);
            this.hideLoading();
        };
        reader.onerror = () => {
            alert('图片读取失败，请重试');
            this.hideLoading();
        };
        reader.readAsDataURL(file);
    }

    showLoading() {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            const hint = uploadArea.querySelector('.upload-hint');
            if (hint) {
                hint.style.opacity = '0.5';
            }
        }
    }

    hideLoading() {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            const hint = uploadArea.querySelector('.upload-hint');
            if (hint) {
                hint.style.opacity = '1';
            }
        }
    }

    loadImage(dataUrl) {
        this.imageData = dataUrl;

        if (this.imageElement) {
            this.imageElement.src = dataUrl;
        }

        const uploadArea = document.getElementById('uploadArea');
        const uploadPreview = document.getElementById('uploadPreview');
        const uploadTip = document.getElementById('uploadTip');
        const changeBtn = document.getElementById('changeImageBtn');
        const confirmBtn = document.getElementById('confirmUploadBtn');

        if (uploadArea) uploadArea.style.display = 'none';
        if (uploadPreview) uploadPreview.style.display = 'flex';
        if (uploadTip) uploadTip.style.display = 'block';
        if (changeBtn) changeBtn.style.display = 'flex';
        if (confirmBtn) confirmBtn.disabled = false;
    }

    getImage() {
        return this.imageData;
    }

    reset() {
        this.imageData = null;
        if (this.fileInput) {
            this.fileInput.value = '';
        }

        const uploadArea = document.getElementById('uploadArea');
        const uploadPreview = document.getElementById('uploadPreview');
        const uploadTip = document.getElementById('uploadTip');
        const changeBtn = document.getElementById('changeImageBtn');
        const confirmBtn = document.getElementById('confirmUploadBtn');

        if (uploadArea) uploadArea.style.display = 'flex';
        if (uploadPreview) uploadPreview.style.display = 'none';
        if (uploadTip) uploadTip.style.display = 'none';
        if (changeBtn) changeBtn.style.display = 'none';
        if (confirmBtn) confirmBtn.disabled = true;
    }
}

window.DocumentUpload = DocumentUpload;

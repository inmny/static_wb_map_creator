/**
 * 主逻辑模块
 * 协调各个模块，处理用户交互
 */

class MapCreator {
    constructor() {
        this.imageFile = null;
        this.excelFile = null;
        this.colorMap = null;
        this.statsConfig = {
            playerName: '',
            population: 0,
            worldTime: 0,
            deaths: 0,
            creaturesBorn: 0,
            toleranceLevel: 0  // 颜色容忍度（0-100%）
        };

        this.initializeUI();
    }

    initializeUI() {
        // 图片上传
        const imageUploadArea = document.getElementById('imageUploadArea');
        const imageInput = document.getElementById('imageInput');
        const imageInfo = document.getElementById('imageInfo');

        imageUploadArea.addEventListener('click', () => imageInput.click());
        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.classList.add('dragover');
        });
        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.classList.remove('dragover');
        });
        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageFile(file);
            }
        });

        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageFile(file);
            }
        });

        // Excel上传
        const excelUploadArea = document.getElementById('excelUploadArea');
        const excelInput = document.getElementById('excelInput');
        const excelInfo = document.getElementById('excelInfo');

        excelUploadArea.addEventListener('click', () => excelInput.click());
        excelUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            excelUploadArea.classList.add('dragover');
        });
        excelUploadArea.addEventListener('dragleave', () => {
            excelUploadArea.classList.remove('dragover');
        });
        excelUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            excelUploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                this.handleExcelFile(file);
            }
        });

        excelInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleExcelFile(file);
            }
        });

        // 处理按钮
        const processBtn = document.getElementById('processBtn');
        processBtn.addEventListener('click', () => this.process());

        // 统计设置切换
        this.initStatsCollapsible();
    }

    initStatsCollapsible() {
        const statsContent = document.getElementById('statsContent');
        const statsArrow = document.getElementById('statsArrow');
        let isOpen = false;

        // 统计输入监听
        const statInputs = ['playerName', 'population', 'worldTime', 'deaths', 'creaturesBorn', 'toleranceLevel'];
        statInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    const value = input.type === 'number' || input.type === 'range'
                        ? parseInt(input.value) || 0
                        : input.value;
                    this.statsConfig[this.toCamelCase(id)] = value;
                    
                    // 更新容忍度显示值
                    if (id === 'toleranceLevel') {
                        const displayValue = document.getElementById('toleranceDisplayValue');
                        if (displayValue) {
                            displayValue.textContent = `${value}%`;
                        }
                    }
                });
            }
        });
    }

    toCamelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    toggleStats() {
        const statsContent = document.getElementById('statsContent');
        const statsArrow = document.getElementById('statsArrow');
        statsContent.classList.toggle('open');
        statsArrow.classList.toggle('rotated');
    }

    handleImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('请上传图片文件');
            return;
        }
        this.imageFile = file;
        const imageInfo = document.getElementById('imageInfo');
        const sizeKB = file.size / 1024;
        const sizeText = sizeKB > 1024 
            ? `${(sizeKB / 1024).toFixed(2)} MB` 
            : `${sizeKB.toFixed(2)} KB`;
        imageInfo.textContent = `已选择: ${file.name} (${sizeText})`;
        imageInfo.style.display = 'block';
        this.updateProcessButton();
    }

    handleExcelFile(file) {
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            this.showError('请上传Excel文件 (.xlsx 或 .xls)');
            return;
        }
        this.excelFile = file;
        const excelInfo = document.getElementById('excelInfo');
        const sizeKB = file.size / 1024;
        const sizeText = sizeKB > 1024 
            ? `${(sizeKB / 1024).toFixed(2)} MB` 
            : `${sizeKB.toFixed(2)} KB`;
        excelInfo.textContent = `已选择: ${file.name} (${sizeText})`;
        excelInfo.style.display = 'block';
    }

    updateProcessButton() {
        const processBtn = document.getElementById('processBtn');
        processBtn.disabled = !this.imageFile;
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        const successDiv = document.getElementById('success');
        successDiv.style.display = 'none';
    }

    showSuccess(message) {
        const successDiv = document.getElementById('success');
        successDiv.textContent = message;
        successDiv.style.display = 'block';

        const errorDiv = document.getElementById('error');
        errorDiv.style.display = 'none';
    }

    showProgress(visible) {
        const progressDiv = document.getElementById('progress');
        progressDiv.style.display = visible ? 'block' : 'none';
        if (!visible) {
            this.updateProgress(0);
        }
    }

    updateProgress(percent) {
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${percent}%`;
        progressFill.textContent = `${Math.round(percent)}%`;
    }

    async loadColorMap() {
        try {
            if (this.excelFile) {
                this.colorMap = await ExcelParser.parseExcel(this.excelFile);
            } else {
                this.colorMap = await ExcelParser.loadDefaultExcel();
            }
            return true;
        } catch (error) {
            this.showError(`加载颜色映射表失败: ${error.message}`);
            return false;
        }
    }

    async process() {
        if (!this.imageFile) {
            this.showError('请先上传图片文件');
            return;
        }

        // 隐藏之前的结果和错误信息
        document.getElementById('downloadLink').style.display = 'none';
        document.getElementById('error').style.display = 'none';
        document.getElementById('success').style.display = 'none';

        try {
            this.showProgress(true);
            this.updateProgress(0);

            // 1. 加载颜色映射表
            this.updateProgress(10);
            const mapLoaded = await this.loadColorMap();
            if (!mapLoaded) {
                this.showProgress(false);
                return;
            }

            // 2. 处理图片
            this.updateProgress(20);
            let imageData;
            try {
                imageData = await ImageProcessor.processImage(
                    this.imageFile,
                    this.colorMap,
                    this.statsConfig.toleranceLevel,  // 传递颜色容忍度
                    (current, total) => {
                        // 图片处理进度（20% - 90%）
                        const progress = 20 + (current / total) * 70;
                        this.updateProgress(progress);
                    }
                );
            } catch (error) {
                throw new Error(`图片处理失败: ${error.message}`);
            }

            // 3. 生成存档数据
            this.updateProgress(90);
            const savedMap = SaveGenerator.generateSaveData(
                imageData.width,  // tile宽度（像素，已确保是64的倍数）
                imageData.height, // tile高度（像素，已确保是64的倍数）
                imageData.tiles,
                this.statsConfig  // 传递用户配置的统计数据
            );

            // 4. 生成.wbox文件
            this.updateProgress(95);
            const wboxData = SaveGenerator.generateWboxFile(savedMap);

            // 5. 创建下载链接
            this.updateProgress(100);
            this.downloadFile(wboxData, 'map.wbox');

            const zoneWidth = savedMap.width;
            const zoneHeight = savedMap.height;
            this.showProgress(false);
            this.showSuccess(`成功生成地图存档！Tile尺寸: ${imageData.width}×${imageData.height} (${zoneWidth}×${zoneHeight} zones)`);
        } catch (error) {
            this.showProgress(false);
            this.showError(`处理失败: ${error.message}`);
            console.error('处理错误:', error);
        }
    }

    downloadFile(data, filename) {
        // 创建Blob
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        // 创建下载链接
        const downloadLink = document.getElementById('downloadLink');
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.textContent = `下载 ${filename}`;
        link.style.display = 'inline-block';

        // 清除之前的内容
        downloadLink.innerHTML = '';
        downloadLink.appendChild(link);
        downloadLink.style.display = 'block';

        // 自动下载
        link.click();

        // 清理URL对象（延迟清理以确保下载完成）
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MapCreator();
});


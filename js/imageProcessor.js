/**
 * 图片处理模块
 * 负责读取图片像素并转换为tile类型
 */

class ImageProcessor {
    /**
     * 从图片文件读取像素数据并转换为tile类型数组
     * 图片尺寸会被裁剪为64的倍数（向下取整），保留原始像素值，不进行插值
     * @param {File} imageFile - 图片文件
     * @param {Map<string, string>} colorMap - 颜色到tile类型的映射
     * @param {Function} progressCallback - 进度回调函数 (current, total) => void
     * @returns {Promise<{width: number, height: number, tiles: string[][]}>} 
     *          width和height是tile尺寸（像素，保证是64的倍数），tiles是tile类型二维数组[y][x]
     */
    static async processImage(imageFile, colorMap, progressCallback = null) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                try {
                    // 确保尺寸是64的倍数（向下取整，裁剪而非插值）
                    const originalWidth = img.width;
                    const originalHeight = img.height;
                    const tileWidth = Math.floor(originalWidth / 64) * 64;
                    const tileHeight = Math.floor(originalHeight / 64) * 64;

                    if (tileWidth === 0 || tileHeight === 0) {
                        throw new Error(`图片尺寸太小：${originalWidth}×${originalHeight}，至少需要64×64像素`);
                    }

                    if (tileWidth !== originalWidth || tileHeight !== originalHeight) {
                        console.warn(`图片尺寸 ${originalWidth}×${originalHeight} 不是64的倍数，将裁剪为 ${tileWidth}×${tileHeight}`);
                    }

                    // 设置canvas尺寸为裁剪后的尺寸
                    canvas.width = tileWidth;
                    canvas.height = tileHeight;

                    // 绘制图片到canvas（只绘制裁剪后的部分，保留原始像素值，不进行缩放）
                    // 源图片从(0,0)开始，取tileWidth×tileHeight的区域
                    // 绘制到canvas的(0,0)位置，尺寸保持tileWidth×tileHeight
                    ctx.drawImage(img, 0, 0, tileWidth, tileHeight);

                    // 获取图片数据
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;

                    // 处理每个像素
                    const tiles = [];
                    const totalPixels = canvas.width * canvas.height;
                    let processedPixels = 0;
                    const unmatchedColors = new Map();

                    for (let y = 0; y < canvas.height; y++) {
                        const row = [];
                        for (let x = 0; x < canvas.width; x++) {
                            const index = (y * canvas.width + x) * 4;
                            const r = data[index];
                            const g = data[index + 1];
                            const b = data[index + 2];
                            // 注意：忽略alpha通道

                            // 转换为16进制字符串（6位，大写）
                            const colorHex = this.rgbToHex(r, g, b);

                            // 在颜色映射表中查找
                            let tileType = colorMap.get(colorHex);

                            if (!tileType) {
                                // 如果找不到精确匹配，记录未匹配的颜色
                                const count = unmatchedColors.get(colorHex) || 0;
                                unmatchedColors.set(colorHex, count + 1);
                                
                                // 使用默认tile类型
                                tileType = 'soil_low'; // 默认值
                            }

                            row.push(tileType);
                            processedPixels++;

                            // 更新进度（每处理1000个像素更新一次）
                            if (progressCallback && processedPixels % 1000 === 0) {
                                progressCallback(processedPixels, totalPixels);
                            }
                        }
                        tiles.push(row);
                    }

                    // 最终进度更新
                    if (progressCallback) {
                        progressCallback(totalPixels, totalPixels);
                    }

                    // 输出未匹配的颜色统计（仅在控制台）
                    if (unmatchedColors.size > 0) {
                        const totalUnmatched = Array.from(unmatchedColors.values())
                            .reduce((sum, count) => sum + count, 0);
                        console.warn(`警告: 发现 ${unmatchedColors.size} 种未匹配的颜色，共 ${totalUnmatched} 个像素使用了默认tile类型`);
                        const topUnmatched = Array.from(unmatchedColors.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10);
                        topUnmatched.forEach(([color, count]) => {
                            console.warn(`  #${color}: ${count} 个像素`);
                        });
                    }

                    resolve({
                        width: canvas.width,
                        height: canvas.height,
                        tiles: tiles
                    });
                } catch (error) {
                    reject(new Error(`图片处理失败: ${error.message}`));
                }
            };

            img.onerror = () => {
                reject(new Error('无法加载图片文件'));
            };

            // 使用FileReader读取图片
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = () => {
                reject(new Error('读取图片文件失败'));
            };
            reader.readAsDataURL(imageFile);
        });
    }

    /**
     * 将RGB值转换为16进制字符串
     * @param {number} r - 红色分量 (0-255)
     * @param {number} g - 绿色分量 (0-255)
     * @param {number} b - 蓝色分量 (0-255)
     * @returns {string} 6位16进制字符串（大写）
     */
    static rgbToHex(r, g, b) {
        const toHex = (value) => {
            const hex = Math.round(value).toString(16).toUpperCase();
            return hex.padStart(2, '0');
        };
        return toHex(r) + toHex(g) + toHex(b);
    }
}


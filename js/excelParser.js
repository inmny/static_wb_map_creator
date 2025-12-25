/**
 * Excel解析模块
 * 负责读取Excel文件并构建颜色到tile类型的映射
 */

class ExcelParser {
    /**
     * 解析Excel文件，构建颜色到tile类型的映射
     * @param {File|ArrayBuffer} fileOrBuffer - Excel文件或ArrayBuffer
     * @returns {Promise<Map<string, string>>} 颜色(大写16进制)到tile类型的映射
     */
    static async parseExcel(fileOrBuffer) {
        try {
            let workbook;
            
            if (fileOrBuffer instanceof File) {
                const arrayBuffer = await fileOrBuffer.arrayBuffer();
                workbook = XLSX.read(arrayBuffer, { type: 'array' });
            } else if (fileOrBuffer instanceof ArrayBuffer) {
                workbook = XLSX.read(fileOrBuffer, { type: 'array' });
            } else {
                throw new Error('不支持的文件类型');
            }

            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // 转换为JSON数组
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

            // 构建颜色到tile类型的映射
            const colorMap = new Map();

            // 从第二行开始（第一行可能是标题）
            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                if (!row || row.length < 2) continue;

                const tileType = String(row[0]).trim();
                let colorValue = row[1];

                // 跳过空行
                if (!tileType || !colorValue) continue;

                // 处理颜色值：可能是字符串、数字或其他格式
                let colorHex = '';
                if (typeof colorValue === 'string') {
                    colorHex = colorValue.trim().toUpperCase();
                    // 移除可能的#号
                    colorHex = colorHex.replace(/^#/, '');
                } else if (typeof colorValue === 'number') {
                    // 如果是数字，转换为16进制字符串
                    colorHex = colorValue.toString(16).toUpperCase().padStart(6, '0');
                } else {
                    // 尝试转换为字符串
                    colorHex = String(colorValue).trim().toUpperCase().replace(/^#/, '');
                }

                // 验证颜色格式（应该是6位16进制）
                if (/^[0-9A-F]{6}$/.test(colorHex)) {
                    colorMap.set(colorHex, tileType);
                } else {
                    console.warn(`第${i + 1}行的颜色格式无效: ${colorValue}`);
                }
            }

            if (colorMap.size === 0) {
                throw new Error('Excel文件中没有找到有效的颜色映射数据');
            }

            console.log(`成功解析 ${colorMap.size} 个颜色映射`);
            return colorMap;
        } catch (error) {
            console.error('Excel解析错误:', error);
            throw new Error(`Excel解析失败: ${error.message}`);
        }
    }

    /**
     * 加载默认的Excel文件（default.xlsx）
     * @returns {Promise<Map<string, string>>} 颜色到tile类型的映射
     */
    static async loadDefaultExcel() {
        try {
            const response = await fetch('default.xlsx');
            if (!response.ok) {
                throw new Error(`无法加载default.xlsx: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            return await this.parseExcel(arrayBuffer);
        } catch (error) {
            console.error('加载默认Excel文件错误:', error);
            throw new Error(`无法加载默认Excel文件: ${error.message}`);
        }
    }
}


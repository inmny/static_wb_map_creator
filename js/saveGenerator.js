/**
 * 存档生成模块
 * 负责生成符合WorldBox格式的游戏存档文件
 */

class SaveGenerator {
    /**
     * 生成游戏存档数据
     * @param {number} width - 地图宽度（像素）
     * @param {number} height - 地图高度（像素）
     * @param {string[][]} tiles - tile类型二维数组 [y][x]
     * @returns {Object} SavedMap JSON对象
     */
    static generateSaveData(width, height, tiles) {
        // 构建tileMap：所有唯一的tile类型字符串列表
        const tileMapSet = new Set();
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                tileMapSet.add(tiles[y][x]);
            }
        }
        const tileMap = Array.from(tileMapSet);

        // 创建tile类型到索引的映射
        const tileTypeToIndex = new Map();
        tileMap.forEach((tileType, index) => {
            tileTypeToIndex.set(tileType, index);
        });

        // 使用RLE压缩生成tileArray和tileAmounts
        const { tileArray, tileAmounts } = this.generateRLECompressedTiles(
            width, height, tiles, tileTypeToIndex
        );

        // 创建SavedMap对象
        const savedMap = {
            saveVersion: 10, // 使用合理的版本号
            width: width,
            height: height,
            hotkey_tabs_data: null,
            camera_pos_x: 0,
            camera_pos_y: 0,
            camera_zoom: 1.0,
            mapStats: {
                population: 0,
                deaths: 0
            },
            worldLaws: {},
            tileString: null,
            tileMap: tileMap,
            tileArray: tileArray,
            tileAmounts: tileAmounts,
            fire: [],
            conwayEater: [],
            conwayCreator: [],
            frozen_tiles: [],
            tiles: [],
            cities: [],
            actors_data: [],
            buildings: [],
            kingdoms: [],
            clans: [],
            alliances: [],
            wars: [],
            plots: [],
            relations: [],
            cultures: [],
            books: [],
            subspecies: [],
            languages: [],
            religions: [],
            families: [],
            armies: [],
            items: []
        };

        return savedMap;
    }

    /**
     * 使用RLE压缩生成tileArray和tileAmounts
     * 根据SavedMap.cs的create()方法实现
     * @param {number} width - 地图宽度
     * @param {number} height - 地图高度
     * @param {string[][]} tiles - tile类型二维数组
     * @param {Map<string, number>} tileTypeToIndex - tile类型到索引的映射
     * @returns {{tileArray: number[][], tileAmounts: number[][]}} RLE压缩后的数据
     */
    static generateRLECompressedTiles(width, height, tiles, tileTypeToIndex) {
        const tileArray = [];
        const tileAmounts = [];

        // 按行处理
        for (let y = 0; y < height; y++) {
            const rowTileArray = [];
            const rowTileAmounts = [];

            let lastTileType = null;
            let tileCount = 0;

            // 遍历该行的每个tile
            for (let x = 0; x < width; x++) {
                const currentTileType = tiles[y][x];

                if (currentTileType === lastTileType && tileCount > 0) {
                    // 相同tile类型，增加计数
                    tileCount++;
                } else {
                    // 不同tile类型，保存上一个tile的数据
                    if (tileCount > 0 && lastTileType !== null) {
                        const tileIndex = tileTypeToIndex.get(lastTileType);
                        rowTileArray.push(tileIndex);
                        rowTileAmounts.push(tileCount);
                    }

                    // 开始新的tile序列
                    lastTileType = currentTileType;
                    tileCount = 1;
                }
            }

            // 保存最后一个tile序列
            if (tileCount > 0 && lastTileType !== null) {
                const tileIndex = tileTypeToIndex.get(lastTileType);
                rowTileArray.push(tileIndex);
                rowTileAmounts.push(tileCount);
            }

            tileArray.push(rowTileArray);
            tileAmounts.push(rowTileAmounts);
        }

        return { tileArray, tileAmounts };
    }

    /**
     * 将SavedMap对象序列化为JSON字符串
     * @param {Object} savedMap - SavedMap对象
     * @param {boolean} beautify - 是否格式化JSON
     * @returns {string} JSON字符串
     */
    static toJSON(savedMap, beautify = false) {
        if (beautify) {
            return JSON.stringify(savedMap, null, 2);
        } else {
            return JSON.stringify(savedMap);
        }
    }

    /**
     * 将JSON字符串压缩为.wbox格式（zlib压缩）
     * @param {string} jsonString - JSON字符串
     * @returns {Uint8Array} 压缩后的二进制数据
     */
    static compressToWbox(jsonString) {
        try {
            // 将字符串转换为Uint8Array
            const jsonBytes = new TextEncoder().encode(jsonString);

            // 使用pako进行zlib压缩
            const compressed = pako.deflate(jsonBytes, {
                level: 9, // 最高压缩级别
                windowBits: 15,
                memLevel: 9
            });

            return compressed;
        } catch (error) {
            throw new Error(`压缩失败: ${error.message}`);
        }
    }

    /**
     * 生成完整的.wbox文件（压缩的JSON）
     * @param {Object} savedMap - SavedMap对象
     * @returns {Uint8Array} .wbox文件的二进制数据
     */
    static generateWboxFile(savedMap) {
        const jsonString = this.toJSON(savedMap, false);
        return this.compressToWbox(jsonString);
    }
}


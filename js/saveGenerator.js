/**
 * 存档生成模块
 * 负责生成符合WorldBox格式的游戏存档文件
 */

class SaveGenerator {
    /**
     * 生成游戏存档数据
     * @param {number} tileWidth - tile地图宽度（像素，必须是64的倍数）
     * @param {number} tileHeight - tile地图高度（像素，必须是64的倍数）
     * @param {string[][]} tiles - tile类型二维数组 [y][x]
     * @param {Object} statsConfig - 用户配置的统计数据
     * @returns {Object} SavedMap JSON对象
     */
    static generateSaveData(tileWidth, tileHeight, tiles, statsConfig = {}) {
        // 验证尺寸是64的倍数
        if (tileWidth % 64 !== 0 || tileHeight % 64 !== 0) {
            throw new Error(`tile尺寸必须是64的倍数，当前尺寸：${tileWidth}×${tileHeight}`);
        }

        // width和height是zone的数量（tile尺寸/64）
        const zoneWidth = tileWidth / 64;
        const zoneHeight = tileHeight / 64;

        // 构建tileMap：所有唯一的tile类型字符串列表
        const tileMapSet = new Set();
        for (let y = 0; y < tileHeight; y++) {
            for (let x = 0; x < tileWidth; x++) {
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
            tileWidth, tileHeight, tiles, tileTypeToIndex
        );

        // 创建SavedMap对象
        // width和height是zone的数量（tile尺寸/64）
        const savedMap = {
            saveVersion: 17, // 使用合理的版本号
            width: zoneWidth,  // zone数量 = tile宽度 / 64
            height: zoneHeight, // zone数量 = tile高度 / 64
            hotkey_tabs_data: null,
            camera_pos_x: 0,
            camera_pos_y: 0,
            camera_zoom: 1.0,
            mapStats: {
                population: statsConfig.population || 0,
                deaths: statsConfig.deaths || 0,
                player_name: statsConfig.playerName || 'The Creator',
                world_time: (statsConfig.worldTime || 0) * 5 * 60 // 转换为秒（月*5*60=秒，假设每月约5天）
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
            items: [],
            // 用户自定义的统计数据
            creaturesBorn: statsConfig.creaturesBorn || 0
        };

        return savedMap;
    }

    /**
     * 使用RLE压缩生成tileArray和tileAmounts
     * 根据SavedMap.cs的create()方法实现
     * @param {number} tileWidth - tile地图宽度（像素）
     * @param {number} tileHeight - tile地图高度（像素）
     * @param {string[][]} tiles - tile类型二维数组
     * @param {Map<string, number>} tileTypeToIndex - tile类型到索引的映射
     * @returns {{tileArray: number[][], tileAmounts: number[][]}} RLE压缩后的数据
     */
    static generateRLECompressedTiles(tileWidth, tileHeight, tiles, tileTypeToIndex) {
        const tileArray = [];
        const tileAmounts = [];

        // 按行处理
        for (let y = 0; y < tileHeight; y++) {
            const rowTileArray = [];
            const rowTileAmounts = [];

            let lastTileType = null;
            let tileCount = 0;

            // 遍历该行的每个tile
            for (let x = 0; x < tileWidth; x++) {
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

// ===================================
// ゲームの初期設定
// ===================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const healthBarInner = document.getElementById('health-bar-inner');
const scoreDisplay = document.getElementById('score');
const gameOverDisplay = document.getElementById('game-over');

// ゲームの状態
let score = 0;
let gameOver = false;
let gameRunning = true;

// 物理定数
const GRAVITY = 0.5;
const GROUND_Y = canvas.height - 50; // 地面のY座標

// エンドレス化のための設定
let gameSpeed = 3; 
const gameSpeedIncrease = 0.001;

// 障害物とアイテムの生成マーカーを分離
let nextObstacleSpawnX = canvas.width + 50; // 障害物用の生成マーカー
let nextItemSpawnX = canvas.width + 500;   // アイテム用の生成マーカー

// ===================================
// プレイヤー（猫）の設定
// ===================================
const player = {
    x: 50,
    y: GROUND_Y,
    width: 30,
    height: 50,
    speed: 5,
    velocityX: 0,
    velocityY: 0,
    jumpPower: 12,
    isJumping: false,
    health: 100,
    maxHealth: 100,
    color: '#FFD700'
};

// ===================================
// ゲームオブジェクトの管理配列
// ===================================
let obstacles = [];
let items = [];

// ===================================
// 入力処理
// ===================================
const keys = {};
document.addEventListener('keydown', (e) => { keys[e.code] = true; });
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

function handleInput() {
    if (gameOver) return;
    if (keys['ArrowLeft'] && player.x > 0) { player.x -= player.speed; }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) { player.x += player.speed; }
    if (keys['Space'] && !player.isJumping) {
        player.velocityY = -player.jumpPower;
        player.isJumping = true;
    }
}

// ===================================
// 当たり判定関数
// ===================================
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ===================================
// オブジェクト生成関数
// ===================================

// 「障害物」を生成する専用の関数
function generateObstacles() {
    const spawnX = nextObstacleSpawnX;
    
    // 50%の確率で動く障害物、50%で通常の固定障害物を生成
    if (Math.random() < 0.5) {
        // 動く障害物
        obstacles.push({
            x: spawnX, y: GROUND_Y - 20, width: 40, height: 20,
            // 速度にランダム性を追加
            speed: -(gameSpeed + Math.random() * 2), 
            color: '#228B22'
        });
    } else {
        // 通常の固定障害物
        const obsHeight = Math.random() * 50 + 20;
        obstacles.push({
            x: spawnX, y: GROUND_Y - obsHeight, width: 30, height: obsHeight, color: '#A52A2A'
        });
    }

    // 次の"障害物"の生成マーカーを更新（密度を高く保つ）
    const spawnInterval = Math.random() * 200 + 150;
    nextObstacleSpawnX = spawnX + spawnInterval;
}

// 「アイテム」を生成する専用の関数
function generateItems() {
    const spawnX = nextItemSpawnX;
    
    items.push({
        x: spawnX, y: GROUND_Y - 100, width: 20, height: 20,
        color: '#FF69B4', type: 'health', value: 20
    });

    // 次の"アイテム"の生成マーカーを更新（出現頻度を減らす）
    const spawnInterval = Math.random() * 600 + 600;
    nextItemSpawnX = spawnX + spawnInterval;
}


// ===================================
// ゲームの更新処理
// ===================================
function update() {
    if (!gameRunning) return;

    handleInput();

    // --- プレイヤーの更新 ---
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    if (player.y + player.height > GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // --- 自動スクロール ---
    [obstacles, items].forEach(arr => {
        arr.forEach(obj => {
            obj.x -= gameSpeed;
            if (obj.speed) { obj.x += obj.speed; }
        });
    });

    // --- スコアと難易度の更新 ---
    score += 1;
    gameSpeed += gameSpeedIncrease;

    // --- オブジェクト生成管理 ---
    // 障害物の生成チェック
    nextObstacleSpawnX -= gameSpeed;
    if (nextObstacleSpawnX <= canvas.width) {
        generateObstacles();
    }

    // アイテムの生成チェック
    nextItemSpawnX -= gameSpeed;
    if (nextItemSpawnX <= canvas.width) {
        generateItems();
    }

    // --- 画面外オブジェクトの削除 ---
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
    items = items.filter(item => item.x + item.width > 0);

    // --- 当たり判定 ---
    obstacles.forEach(obs => {
        if (checkCollision(player, obs)) { player.health -= 0.5; }
    });
    
    items.forEach((item, index) => {
        if (checkCollision(player, item)) {
            if (item.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + item.value);
                score += 50;
                items.splice(index, 1);
            }
        }
    });

    // --- UIの更新 ---
    player.health -= 0.05; 
    healthBarInner.style.width = `${Math.max(0, player.health)}%`;
    scoreDisplay.textContent = score;

    // --- ゲームオーバー判定 ---
    if (player.health <= 0) {
        gameOver = true;
        gameRunning = false;
        gameOverDisplay.style.display = 'block';
    }
}

// ===================================
// 描画処理
// ===================================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    const allObjects = [...obstacles, ...items];
    allObjects.forEach(obj => {
        ctx.fillStyle = obj.color;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    });
}

// ===================================
// ゲームループ
// ===================================
function gameLoop() {
    update();
    draw();
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// ゲーム開始
gameLoop();

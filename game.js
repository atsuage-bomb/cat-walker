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
    color: '#FFD700' // 猫の色（金色）
};

// ===================================
// ゲームオブジェクトの定義
// ===================================
// 固定障害物
const fixedObstacles = [
    { x: 300, y: GROUND_Y - 40, width: 40, height: 40, color: '#A52A2A' },
    { x: 600, y: GROUND_Y - 60, width: 20, height: 60, color: '#A52A2A' },
    { x: 1000, y: GROUND_Y - 50, width: 50, height: 50, color: '#A52A2A' }
];

// 動く障害物（敵）
const movingObstacles = [
    { x: 800, y: GROUND_Y - 30, width: 50, height: 30, speed: -2, color: '#8B4513' }, // 猛獣
    { x: 1200, y: GROUND_Y - 20, width: 40, height: 20, speed: -1, color: '#228B22' } // ヘビ
];

// アイテム（おやつ）
const items = [
    { x: 450, y: GROUND_Y - 80, width: 20, height: 20, color: '#FF69B4', type: 'health', value: 20 },
    { x: 900, y: GROUND_Y - 30, width: 20, height: 20, color: '#FF69B4', type: 'health', value: 20 }
];

// チェックポイント
const checkpoints = [
    { x: 700, y: GROUND_Y - 100, width: 10, height: 100, color: 'rgba(0, 255, 0, 0.5)', passed: false, bonus: 100 }
];


// ===================================
// 入力処理
// ===================================
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function handleInput() {
    if (gameOver) return;

    // 左移動
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    // 右移動
    if (keys['ArrowRight'] && player.x < canvas.width / 3) { // 画面の1/3以上右には進めず、背景が動く
        player.x += player.speed;
    }
    // ジャンプ
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
// ゲームの更新処理
// ===================================
function update() {
    if (!gameRunning) return;

    handleInput();

    // --- プレイヤーの更新 ---
    player.velocityY += GRAVITY;
    player.y += player.velocityY;

    // 地面との衝突
    if (player.y + player.height > GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }

    // --- 背景スクロール ---
    if (keys['ArrowRight'] && player.x >= canvas.width / 3) {
        const scrollSpeed = player.speed;
        score += 1; // 進行度でスコアアップ
        [fixedObstacles, movingObstacles, items, checkpoints].forEach(arr => {
            arr.forEach(obj => obj.x -= scrollSpeed);
        });
    }

    // --- オブジェクトの更新と当たり判定 ---
    // 動く障害物
    movingObstacles.forEach(obs => {
        obs.x += obs.speed;
        if (checkCollision(player, obs)) {
            player.health -= 0.5;
        }
    });

    // 固定障害物
    fixedObstacles.forEach(obs => {
        if (checkCollision(player, obs)) {
            player.health -= 0.5;
        }
    });
    
    // アイテム
    items.forEach((item, index) => {
        if (checkCollision(player, item)) {
            if (item.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + item.value);
                score += 50; // アイテム獲得ボーナス
                items.splice(index, 1); // アイテムを消す
            }
        }
    });

    // チェックポイント
    checkpoints.forEach(cp => {
        if (!cp.passed && checkCollision(player, cp)) {
            cp.passed = true;
            player.health = player.maxHealth; // 体力全回復
            score += cp.bonus;
        }
    });

    // --- 体力とスコアの更新 ---
    // 時間経過で体力が減る
    player.health -= 0.05;
    
    // UIの更新
    healthBarInner.style.width = `${Math.max(0, player.health)}%`;
    scoreDisplay.textContent = score;

    // ゲームオーバー判定
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
    // 画面をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 地面を描画
    ctx.fillStyle = '#2E8B57'; // 地面の色
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // プレイヤーを描画
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // 各オブジェクトを描画
    const allObjects = [...fixedObstacles, ...movingObstacles, ...items, ...checkpoints];
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

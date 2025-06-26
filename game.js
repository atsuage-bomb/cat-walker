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

// ★変更点：エンドレス化のための設定
let gameSpeed = 3; // ゲームの初期スクロール速度
const gameSpeedIncrease = 0.001; // スピードの増加量
let nextSpawnX = canvas.width; // 次にオブジェクトを生成するX座標の閾値

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
// ゲームオブジェクトの管理配列
// ===================================
// ★変更点：開始時のオブジェクトは空か少量にして、動的に生成する
let obstacles = [];
let items = [];

// ===================================
// 入力処理 (変更なし)
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

    // ★変更点：プレイヤーが画面内を自由に動けるようにする
    // 左移動
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    // 右移動
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    // ジャンプ
    if (keys['Space'] && !player.isJumping) {
        player.velocityY = -player.jumpPower;
        player.isJumping = true;
    }
}

// ===================================
// 当たり判定関数 (変更なし)
// ===================================
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ★追加：オブジェクトをランダムに生成する関数
function generateObjects() {
    // 次の生成ポイントをランダムに決定
    const spawnInterval = Math.random() * 400 + 200; // 200pxから600pxの間隔
    nextSpawnX += spawnInterval;

    // 確率で何を生成するか決める
    const rand = Math.random();
    if (rand < 0.6) { // 60%の確率で障害物
        const obsHeight = Math.random() * 40 + 20; // 高さをランダムに
        obstacles.push({
            x: nextSpawnX,
            y: GROUND_Y - obsHeight,
            width: 30,
            height: obsHeight,
            color: '#A52A2A'
        });
    } else if (rand < 0.8) { // 20%の確率で動く障害物
         obstacles.push({
            x: nextSpawnX,
            y: GROUND_Y - 20,
            width: 40,
            height: 20,
            speed: -gameSpeed * (Math.random() * 0.5 + 0.8), // 速度も少しランダムに
            color: '#228B22'
        });
    } else { // 20%の確率で回復アイテム
        items.push({
            x: nextSpawnX,
            y: GROUND_Y - 80, // アイテムはジャンプで取る位置に
            width: 20,
            height: 20,
            color: '#FF69B4',
            type: 'health',
            value: 20
        });
    }
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

    // ★変更点：自動スクロールとオブジェクト管理
    // 全てのオブジェクトを左にスクロールさせる
    [obstacles, items].forEach(arr => {
        arr.forEach(obj => {
            obj.x -= gameSpeed;
            // 動く障害物は自身の速度も加算
            if (obj.speed) {
                obj.x += obj.speed;
            }
        });
    });

    // スコアを加算し、難易度を上げる
    score += 1;
    gameSpeed += gameSpeedIncrease;

    // ★変更点：画面外に出たオブジェクトを配列から削除してメモリを節約
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
    items = items.filter(item => item.x + item.width > 0);

    // ★変更点：一定距離進んだら新しいオブジェクトを生成
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width) {
        generateObjects();
    }
    
    // --- 当たり判定 ---
    // 障害物
    obstacles.forEach(obs => {
        if (checkCollision(player, obs)) {
            player.health -= 0.5;
        }
    });
    
    // アイテム
    items.forEach((item, index) => {
        if (checkCollision(player, item)) {
            if (item.type === 'health') {
                player.health = Math.min(player.maxHealth, player.health + item.value);
                score += 50;
                items.splice(index, 1); // アイテムを消す
            }
        }
    });

    // --- 体力とスコアの更新 ---
    player.health -= 0.05; // 時間経過で体力が減る
    
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

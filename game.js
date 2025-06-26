// ===================================
// 1. 初期設定
// ===================================

// HTML要素の取得
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const deviceSelectScreen = document.getElementById('device-select-screen');
const btnPc = document.getElementById('btn-pc');
const btnSp = document.getElementById('btn-sp');
const uiContainer = document.getElementById('ui-container');
const touchControls = document.getElementById('touch-controls');
const healthBarInner = document.getElementById('health-bar-inner');
const scoreDisplay = document.getElementById('score');
const gameOverDisplay = document.getElementById('game-over');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnJump = document.getElementById('btn-jump');

// アセットの読み込み
const playerImage = new Image();
playerImage.src = 'cat.png';
const bgm = new Audio('bgm.mp3');
bgm.loop = true;
bgm.volume = 0.3;

// ゲーム状態を管理する変数
let gameState = 'waiting'; // 'waiting', 'playing', 'gameOver'
let score = 0;
let gameSpeed = 3;
const gameSpeedIncrease = 0.001;
let nextObstacleSpawnX = 850;
let nextItemSpawnX = 1300;

// 物理定数とプレイヤーオブジェクト
const GRAVITY = 0.5;
const GROUND_Y = canvas.height - 50;
const player = {
    x: 50, y: GROUND_Y, width: 30, height: 50,
    speed: 5, velocityY: 0, isJumping: false,
    health: 100, maxHealth: 100,
};

// その他の変数
let obstacles = [];
let items = [];
const keys = {};

// ===================================
// 2. ゲームの主要な関数
// ===================================

/** ゲームを開始する関数 */
function startGame(isMobile) {
    if (gameState !== 'waiting') return; // ゲームが既に始まっている場合は何もしない

    gameState = 'playing';

    // UIの表示切り替え
    deviceSelectScreen.style.display = 'none';
    uiContainer.style.display = 'flex';
    if (isMobile) {
        touchControls.style.display = 'flex';
    }

    // BGM再生
    bgm.play().catch(err => console.error("BGM再生に失敗:", err));

    // キーボード操作の受付を開始
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

/** 毎フレームの更新処理 */
function update() {
    handlePlayerInput();
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    if (player.y + player.height > GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.velocityY = 0;
        player.isJumping = false;
    }
    // オブジェクトのスクロールと生成
    [obstacles, items].forEach(arr => { arr.forEach(obj => { obj.x -= gameSpeed; if (obj.speed) { obj.x += obj.speed; } }); });
    nextObstacleSpawnX -= gameSpeed;
    if (nextObstacleSpawnX <= canvas.width) { generateObstacles(); }
    nextItemSpawnX -= gameSpeed;
    if (nextItemSpawnX <= canvas.width) { generateItems(); }
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
    items = items.filter(item => item.x + item.width > 0);
    // 当たり判定と体力・スコア更新
    obstacles.forEach(obs => { if (checkCollision(player, obs)) { player.health -= 0.5; } });
    items.forEach((item, index) => { if (checkCollision(player, item)) { if (item.type === 'health') { player.health = Math.min(player.maxHealth, player.health + item.value); score += 50; items.splice(index, 1); } } });
    player.health -= 0.05;
    score += 1;
    gameSpeed += gameSpeedIncrease;
    // ゲームオーバー判定
    if (player.health <= 0) {
        gameState = 'gameOver';
        gameOverDisplay.style.display = 'flex';
        bgm.pause(); // ゲームオーバーでBGMを停止
    }
}

/** 毎フレームの描画処理 */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 地面
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    // プレイヤー
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    // 障害物とアイテム
    const allObjects = [...obstacles, ...items];
    allObjects.forEach(obj => { ctx.fillStyle = obj.color; ctx.fillRect(obj.x, obj.y, obj.width, obj.height); });
    // UIの更新（描画ループ内で行うとスムーズ）
    if (gameState === 'playing') {
        healthBarInner.style.width = `${Math.max(0, player.health)}%`;
        scoreDisplay.textContent = score;
    }
}

// ===================================
// 3. ヘルパー関数（補助的な関数）
// ===================================
function handleKeyDown(e) { if (e.code === 'Space') { e.preventDefault(); } keys[e.code] = true; }
function handleKeyUp(e) { keys[e.code] = false; }
function handlePlayerInput() { if (keys['ArrowLeft'] && player.x > 0) { player.x -= player.speed; } if (keys['ArrowRight'] && player.x < canvas.width - player.width) { player.x += player.speed; } if (keys['Space'] && !player.isJumping) { player.velocityY = -player.jumpPower; player.isJumping = true; } }
function checkCollision(rect1, rect2) { return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }
function generateObstacles() { const spawnX = nextObstacleSpawnX; if (Math.random() < 0.5) { obstacles.push({ x: spawnX, y: GROUND_Y - 20, width: 40, height: 20, speed: -(gameSpeed + Math.random() * 2), color: '#228B22' }); } else { const obsHeight = Math.random() * 50 + 20; obstacles.push({ x: spawnX, y: GROUND_Y - obsHeight, width: 30, height: obsHeight, color: '#A52A2A' }); } const spawnInterval = Math.random() * 200 + 150; nextObstacleSpawnX = spawnX + spawnInterval; }
function generateItems() { const spawnX = nextItemSpawnX; items.push({ x: spawnX, y: GROUND_Y - 100, width: 20, height: 20, color: '#FF69B4', type: 'health', value: 20 }); const spawnInterval = Math.random() * 600 + 600; nextItemSpawnX = spawnX + spawnInterval; }

// ===================================
// 4. メインループとイベントリスナーの登録
// ===================================
function gameLoop() {
    // 現在のゲーム状態に応じて処理を分岐
    if (gameState === 'playing') {
        update();
    }
    draw(); // 描画は常に行う

    requestAnimationFrame(gameLoop);
}

// スタートボタンのイベントリスナー
btnPc.addEventListener('click', () => startGame(false));
btnSp.addEventListener('click', () => startGame(true));
window.addEventListener('keydown', (e) => {
    if (gameState === 'waiting' && e.code === 'Space') {
        e.preventDefault();
        startGame(false);
    }
});

// スマホ用タッチ操作のイベントリスナー
function handleTouchStart(e, keyCode) {
    e.preventDefault();
    if (gameState !== 'playing') return;
    keys[keyCode] = true;
}
function handleTouchEnd(e, keyCode) {
    e.preventDefault();
    keys[keyCode] = false;
}
btnLeft.addEventListener('mousedown', (e) => handleTouchStart(e, 'ArrowLeft'));
btnLeft.addEventListener('mouseup', (e) => handleTouchEnd(e, 'ArrowLeft'));
btnLeft.addEventListener('touchstart', (e) => handleTouchStart(e, 'ArrowLeft'));
btnLeft.addEventListener('touchend', (e) => handleTouchEnd(e, 'ArrowLeft'));
btnRight.addEventListener('mousedown', (e) => handleTouchStart(e, 'ArrowRight'));
btnRight.addEventListener('mouseup', (e) => handleTouchEnd(e, 'ArrowRight'));
btnRight.addEventListener('touchstart', (e) => handleTouchStart(e, 'ArrowRight'));
btnRight.addEventListener('touchend', (e) => handleTouchEnd(e, 'ArrowRight'));
btnJump.addEventListener('mousedown', (e) => handleTouchStart(e, 'Space'));
btnJump.addEventListener('mouseup', (e) => handleTouchEnd(e, 'Space'));
btnJump.addEventListener('touchstart', (e) => handleTouchStart(e, 'Space'));
btnJump.addEventListener('touchend', (e) => handleTouchEnd(e, 'Space'));
window.addEventListener('contextmenu', function (e) { e.preventDefault(); });

// ゲームループを開始
gameLoop();

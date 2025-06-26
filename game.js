// ===================================
// 初期設定
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

// 画像とBGM
const playerImage = new Image();
playerImage.src = 'cat.png';
const bgm = new Audio('bgm.mp3');
bgm.loop = true;
bgm.volume = 0.3;

// ゲーム状態変数
let gameState = 'waiting'; // 'waiting', 'playing', 'gameOver'
let score = 0;
let gameSpeed = 3;
const gameSpeedIncrease = 0.001;
let nextObstacleSpawnX = 850;
let nextItemSpawnX = 1300;

// 物理定数
const GRAVITY = 0.5;
const GROUND_Y = canvas.height - 50;

// プレイヤーオブジェクト
const player = {
    x: 50, y: GROUND_Y, width: 30, height: 50,
    speed: 5, velocityY: 0, isJumping: false,
    health: 100, maxHealth: 100,
};

// オブジェクト配列
let obstacles = [];
let items = [];
const keys = {};

// ===================================
// ゲームの起動処理
// ===================================
function initGame(isMobile) {
    // 状態を'playing'に移行
    gameState = 'playing';

    // 画面の表示を切り替え
    deviceSelectScreen.style.display = 'none';
    uiContainer.style.display = 'flex';
    if (isMobile) {
        touchControls.style.display = 'flex';
    }

    // BGM再生
    bgm.play().catch(err => console.error("BGM再生エラー:", err));

    // キー入力の受付を開始
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

// ===================================
// イベントリスナー
// ===================================
// スタートボタン
btnPc.addEventListener('click', () => initGame(false));
btnSp.addEventListener('click', () => initGame(true));
// スペースキーでもPCとしてスタート
window.addEventListener('keydown', (e) => {
    if (gameState === 'waiting' && e.code === 'Space') {
        e.preventDefault();
        initGame(false);
    }
});

// キー入力処理
function handleKeyDown(e) {
    if (e.code === 'Space') { e.preventDefault(); }
    keys[e.code] = true;
}
function handleKeyUp(e) {
    if (e.code === 'Space') { e.preventDefault(); }
    keys[e.code] = false;
}

// ===================================
// 各種ゲーム関数
// ===================================
function checkCollision(rect1, rect2) { /* (変更なし) */ }
function generateObstacles() { /* (変更なし) */ }
function generateItems() { /* (変更なし) */ }
function handlePlayerInput() { /* (変更なし) */ }

// updateとdrawはそのまま関数として定義
function update() {
    handlePlayerInput();
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    if (player.y + player.height > GROUND_Y) { player.y = GROUND_Y - player.height; player.velocityY = 0; player.isJumping = false; }
    [obstacles, items].forEach(arr => { arr.forEach(obj => { obj.x -= gameSpeed; if (obj.speed) { obj.x += obj.speed; } }); });
    score += 1;
    gameSpeed += gameSpeedIncrease;
    nextObstacleSpawnX -= gameSpeed;
    if (nextObstacleSpawnX <= canvas.width) { generateObstacles(); }
    nextItemSpawnX -= gameSpeed;
    if (nextItemSpawnX <= canvas.width) { generateItems(); }
    obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
    items = items.filter(item => item.x + item.width > 0);
    obstacles.forEach(obs => { if (checkCollision(player, obs)) { player.health -= 0.5; } });
    items.forEach((item, index) => { if (checkCollision(player, item)) { if (item.type === 'health') { player.health = Math.min(player.maxHealth, player.health + item.value); score += 50; items.splice(index, 1); } } });
    player.health -= 0.05;
    if (player.health <= 0) {
        gameState = 'gameOver';
        gameOverDisplay.style.display = 'flex';
    }
}
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    const allObjects = [...obstacles, ...items];
    allObjects.forEach(obj => { ctx.fillStyle = obj.color; ctx.fillRect(obj.x, obj.y, obj.width, obj.height); });
    healthBarInner.style.width = `${Math.max(0, player.health)}%`;
    scoreDisplay.textContent = score;
}
// ===================================
// メインゲームループ
// ===================================
function gameLoop() {
    // 現在のゲーム状態に応じて処理を分岐
    if (gameState === 'playing') {
        update();
    }
    // 描画は常に行う（最初のフレームでねこを表示するため）
    draw();

    requestAnimationFrame(gameLoop);
}

// ページが読み込まれたらゲームループを開始
gameLoop();

// スマホ用タッチ操作のロジック
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnJump = document.getElementById('btn-jump');
function handleTouchStart(e, keyCode) {
    e.preventDefault();
    if (gameState !== 'playing') return; // プレイ中じゃなければ何もしない
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

// 再利用する関数の中身（ご自身のコードからペーストしてください）
function checkCollision(rect1, rect2) { return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }
function generateObstacles() { const spawnX = nextObstacleSpawnX; if (Math.random() < 0.5) { obstacles.push({ x: spawnX, y: GROUND_Y - 20, width: 40, height: 20, speed: -(gameSpeed + Math.random() * 2), color: '#228B22' }); } else { const obsHeight = Math.random() * 50 + 20; obstacles.push({ x: spawnX, y: GROUND_Y - obsHeight, width: 30, height: obsHeight, color: '#A52A2A' }); } const spawnInterval = Math.random() * 200 + 150; nextObstacleSpawnX = spawnX + spawnInterval; }
function generateItems() { const spawnX = nextItemSpawnX; items.push({ x: spawnX, y: GROUND_Y - 100, width: 20, height: 20, color: '#FF69B4', type: 'health', value: 20 }); const spawnInterval = Math.random() * 600 + 600; nextItemSpawnX = spawnX + spawnInterval; }
function handlePlayerInput() { if (keys['ArrowLeft'] && player.x > 0) { player.x -= player.speed; } if (keys['ArrowRight'] && player.x < canvas.width - player.width) { player.x += player.speed; } if (keys['Space'] && !player.isJumping) { player.velocityY = -player.jumpPower; player.isJumping = true; } }

// DOMが完全に読み込まれてから、すべての処理を開始する
document.addEventListener('DOMContentLoaded', () => {

    // ===================================
    // 1. 初期設定と変数定義
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

    // ゲーム状態の管理
    let gameState = 'waiting'; // 'waiting', 'playing', 'gameOver'

    // ゲーム世界の定数
    const GRAVITY = 0.5;
    const GROUND_Y = canvas.height - 50;
    const GAME_SPEED_INCREASE = 0.001;

    // ゲームの動的変数
    let score = 0;
    let gameSpeed = 3;
    let nextObstacleSpawnX = 850;
    let nextItemSpawnX = 1300;
    const keys = {};

// プレイヤーオブジェクト
const player = {
    x: 50, y: GROUND_Y - 50, width: 30, height: 50,
    speed: 5, velocityY: 0,
    jumpPower: 12,      // ★★★修正点★★★: この行を追加
    isJumping: false,   // ★★★修正点★★★: trueからfalseに変更
    health: 100, maxHealth: 100,
};

    // オブジェクト配列
    let obstacles = [];
    let items = [];

    // ===================================
    // 2. ゲームの主要な関数
    // ===================================

    /** ゲームを開始する関数。一度だけ呼ばれる。 */
    function startGame(isMobile) {
        if (gameState !== 'waiting') return;
        console.log("startGame called. isMobile:", isMobile); // デバッグ用

        gameState = 'playing';

        deviceSelectScreen.style.display = 'none';
        uiContainer.style.display = 'flex';
        if (isMobile) {
            touchControls.style.display = 'flex';
        }

        bgm.play().catch(err => console.error("BGM再生に失敗:", err));
    }

    /** 毎フレームの更新処理 */
    function update() {
        // プレイヤー入力の処理
        if (keys['ArrowLeft'] && player.x > 0) { player.x -= player.speed; }
        if (keys['ArrowRight'] && player.x < canvas.width - player.width) { player.x += player.speed; }
        if (keys['Space'] && !player.isJumping) {
            player.velocityY = -player.jumpPower;
            player.isJumping = true;
        }

        // 物理演算
        player.velocityY += GRAVITY;
        player.y += player.velocityY;
        if (player.y + player.height > GROUND_Y) {
            player.y = GROUND_Y - player.height;
            player.velocityY = 0;
            player.isJumping = false;
        }
        
        // オブジェクトのスクロール、生成、削除
        [obstacles, items].forEach(arr => { arr.forEach(obj => { obj.x -= gameSpeed; if (obj.speed) { obj.x += obj.speed; } }); });
        nextObstacleSpawnX -= gameSpeed;
        if (nextObstacleSpawnX <= canvas.width) { generateObstacles(); }
        nextItemSpawnX -= gameSpeed;
        if (nextItemSpawnX <= canvas.width) { generateItems(); }
        obstacles = obstacles.filter(obs => obs.x + obs.width > 0);
        items = items.filter(item => item.x + item.width > 0);
        
// 当たり判定
    obstacles.forEach(obs => {
        if (checkCollision(player, obs)) {
            // ★★★修正点★★★: 敵の種類（色）によってダメージを変える
            if (obs.color === '#228B22') { // もし緑色の敵なら
                player.health -= 4.0; // ダメージ大
            } else { // それ以外（茶色の敵）なら
                player.health -= 1.5; // ダメージ小
            }
        }
    });
        items.forEach((item, index) => { if (checkCollision(player, item)) { if (item.type === 'health') { player.health = Math.min(player.maxHealth, player.health + item.value); score += 50; items.splice(index, 1); } } });
        
        // ステータス更新
        player.health -= 0.05;
        score += 1;
        gameSpeed += GAME_SPEED_INCREASE;

        // ゲームオーバー判定
        if (player.health <= 0) {
            gameState = 'gameOver';
            gameOverDisplay.style.display = 'flex';
            bgm.pause();
        }
    }

    /** 毎フレームの描画処理 */
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        const allObjects = [...obstacles, ...items];
        allObjects.forEach(obj => { ctx.fillStyle = obj.color; ctx.fillRect(obj.x, obj.y, obj.width, obj.height); });

        if (gameState === 'playing' || gameState === 'gameOver') {
            healthBarInner.style.width = `${Math.max(0, player.health)}%`;
            scoreDisplay.textContent = Math.floor(score);
        }
    }
    
    // ===================================
    // 3. メインゲームループ
    // ===================================
    function gameLoop() {
        if (gameState === 'playing') {
            update();
        }
        draw();
        requestAnimationFrame(gameLoop);
    }

    // ===================================
    // 4. イベントリスナーの登録
    // ===================================

    // ---- スタート関連 ----
    btnPc.addEventListener('click', () => startGame(false));
    btnSp.addEventListener('click', () => startGame(true));
    window.addEventListener('keydown', (e) => {
        if (gameState === 'waiting' && e.code === 'Space') {
            e.preventDefault();
            startGame(false);
        } else if (gameState === 'playing') {
            if (e.code === 'Space') { e.preventDefault(); }
            keys[e.code] = true;
        }
    });
    window.addEventListener('keyup', (e) => {
        if (gameState === 'playing') {
            keys[e.code] = false;
        }
    });

    // ---- スマホのタッチ操作関連 ----
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

    // ---- その他の補助関数 ----
    function checkCollision(rect1, rect2) { return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y; }
    function generateObstacles() { const spawnX = nextObstacleSpawnX; if (Math.random() < 0.5) { obstacles.push({ x: spawnX, y: GROUND_Y - 20, width: 40, height: 20, speed: -(gameSpeed + Math.random() * 2), color: '#228B22' }); } else { const obsHeight = Math.random() * 50 + 20; obstacles.push({ x: spawnX, y: GROUND_Y - obsHeight, width: 30, height: obsHeight, color: '#A52A2A' }); } const spawnInterval = Math.random() * 200 + 150; nextObstacleSpawnX = spawnX + spawnInterval; }
function generateItems() {
    const spawnX = nextItemSpawnX;

    // ★★★修正点(1)★★★: アイテムの高さをランダムにする
    // 40〜150ピクセルの間でランダムな高さを決定
    const randomHeightOffset = Math.random() * 110 + 40;

    items.push({
        x: spawnX,
        y: GROUND_Y - randomHeightOffset, // ★ランダムな高さを設定
        width: 20,
        height: 20,
        color: '#FF69B4',
        type: 'health',
        value: 5
    });

    // ★★★修正点(2)★★★: アイテムの出現間隔をより長くする
    // 800px〜1600pxの間隔に変更し、出現数を減らす
    const spawnInterval = Math.random() * 800 + 800;
    nextItemSpawnX = spawnX + spawnInterval;
}

    // ===================================
    // 5. ゲーム全体の開始
    // ===================================
    gameLoop();
});

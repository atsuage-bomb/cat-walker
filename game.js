// ===================================
// ゲームの初期設定
// ===================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('game-container');
const startScreen = document.getElementById('start-screen');
// (healthBar, score, gameOverDisplayの取得はそのまま)

// ★★★修正点★★★: ゲーム世界の基準サイズを定数化
const GAME_WORLD_WIDTH = 800;
const GAME_WORLD_HEIGHT = 400;

// (画像の読み込み、BGMの読み込みはそのまま)
// (ゲームの状態変数、物理定数はそのまま)

// ★★★修正点★★★: GROUND_Yは動的に計算するため、ここでは初期化しない
let GROUND_Y; 

// (エンドレス化の設定、プレイヤーの設定、オブジェクト管理配列はそのまま)

// ★★★ここから下をすべて追加★★★
// ===================================
// Canvasサイズ調整
// ===================================
let scale = 1;
function resizeCanvas() {
    const screenWidth = gameContainer.clientWidth;
    scale = screenWidth / GAME_WORLD_WIDTH;

    // canvasの描画バッファサイズを、アスペクト比を保ったまま更新
    canvas.width = GAME_WORLD_WIDTH;
    canvas.height = GAME_WORLD_HEIGHT;

    // canvas要素の表示スタイルを更新（CSSでも設定しているが念のため）
    canvas.style.width = screenWidth + 'px';
    canvas.style.height = (GAME_WORLD_HEIGHT * scale) + 'px';
    
    // ゲームコンテナ自体の高さを設定
    gameContainer.style.height = (GAME_WORLD_HEIGHT * scale) + 'px';

    // 地面のY座標を再計算
    GROUND_Y = canvas.height - 50;
    
    // ゲームが始まっていない場合は、プレイヤーを地面に再配置
    if (!gameStarted) {
        player.y = GROUND_Y - player.height;
    }
}


// ===================================
// 入力処理 (変更なし)
// ===================================
// (既存の入力処理コードをそのままここにペースト)


// ===================================
// 描画処理
// ===================================
function draw() {
    // 描画を始める前に、画面をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 地面を描画
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);

    // プレイヤーを描画
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
    
    // 障害物とアイテムを描画
    const allObjects = [...obstacles, ...items];
    allObjects.forEach(obj => {
        ctx.fillStyle = obj.color;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    });
}
// ★★★ここまで修正★★★ (以下の既存のコードは、 resizeCanvas の呼び出し以外はそのまま)


// ===================================
// ゲームループ
// ===================================
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ★★★修正点★★★: ゲーム開始前に一度サイズ調整を実行し、リサイズイベントにも対応
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); 

gameLoop();

// (スマホ用タッチ操作のロジックはそのまま)

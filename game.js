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
// ... (healthBar, score, gameOverDisplayの取得も同様)

// 画像とBGM
const playerImage = new Image();
playerImage.src = 'cat.png';
const bgm = new Audio('bgm.mp3');
bgm.loop = true;
bgm.volume = 0.3;

// ゲーム状態変数
let gameRunning = false; // ★★★修正点★★★: 最初は停止状態

// ... (物理定数、プレイヤー、オブジェクト配列などは変更なし)

// ★★★修正点★★★: ゲームを開始するメイン関数
function initGame(isMobile = false) {
    // 選択画面を非表示
    deviceSelectScreen.style.display = 'none';

    // UIを表示
    uiContainer.style.display = 'flex';

    // スマホの場合のみタッチボタンを表示
    if (isMobile) {
        touchControls.style.display = 'flex';
    }

    // BGM再生（ユーザーのアクションが起点なので再生されやすい）
    bgm.play().catch(err => console.error("BGM再生エラー:", err));

    // ゲームループを開始
    gameRunning = true;
    gameLoop();
}


// ===================================
// イベントリスナー
// ===================================
// PCボタンがクリックされたら
btnPc.addEventListener('click', () => initGame(false));

// スマホボタンがクリックされたら
btnSp.addEventListener('click', () => initGame(true));

// PCでスペースキーが押されてもスタート
window.addEventListener('keydown', (e) => {
    if (!gameRunning && e.code === 'Space') {
        e.preventDefault();
        initGame(false);
    }
});


// ... (keydown, keyupのイベントリスナーはゲーム開始後に有効にするため、後ほど設定)
// ... (各種ゲーム関数は変更なし)
// ... (スマホ用タッチ操作のロジックは変更なし)


// ===================================
// ゲームループ
// ===================================
function gameLoop() {
    if (!gameRunning) return;

    update(); // ゲーム状態の更新
    draw();   // 描画

    requestAnimationFrame(gameLoop);
}

// ★★★注意★★★: ここではまだgameLoop()を呼び出さない！
// initGame()が呼ばれた時に初めてループが始まります。

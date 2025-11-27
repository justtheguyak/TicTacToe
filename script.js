document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const gameState = {
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X',
        gameActive: true,
        mode: 'pvp', // 'pvp' or 'bot'
        isBotTurn: false,
        scores: {
            X: 0,
            O: 0
        },
        winningCombinations: [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ]
    };

    // DOM elements
    const gameBoard = document.getElementById('game-board');
    const currentPlayerElement = document.getElementById('current-player');
    const gameStatusElement = document.getElementById('game-status');
    const scoreXElement = document.getElementById('score-x');
    const scoreOElement = document.getElementById('score-o');
    const resetButton = document.getElementById('reset-btn');
    const restartButton = document.getElementById('restart-btn');
    const particlesContainer = document.getElementById('particles');
    const winningLine = document.getElementById('winning-line');
    
    // Mode Buttons
    const btnPvp = document.getElementById('btn-pvp');
    const btnBot = document.getElementById('btn-bot');
    const player2Label = document.getElementById('player-2-label');

    // Initialize the game board
    function initializeBoard() {
        const cells = gameBoard.querySelectorAll('.cell');
        cells.forEach(cell => cell.remove());
        
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('data-index', i);
            cell.addEventListener('click', () => handleCellClick(i));
            gameBoard.appendChild(cell);
        }
    }

    // Handle cell click (Player Move)
    function handleCellClick(index) {
        if (gameState.board[index] !== '' || !gameState.gameActive || gameState.isBotTurn) {
            return;
        }

        executeMove(index);

        if (gameState.mode === 'bot' && gameState.gameActive) {
            gameState.isBotTurn = true;
            setTimeout(makeBotMove, 500);
        }
    }

    // Execute a move
    function executeMove(index) {
        gameState.board[index] = gameState.currentPlayer;
        
        const cell = document.querySelector(`.cell[data-index="${index}"]`);
        cell.textContent = gameState.currentPlayer;
        cell.classList.add(gameState.currentPlayer.toLowerCase());
        
        const winResult = checkWin();
        
        if (winResult) {
            endGame(false, winResult);
        } else if (checkDraw()) {
            endGame(true, null);
        } else {
            gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
            currentPlayerElement.textContent = gameState.currentPlayer;
            
            if (gameState.mode === 'bot' && gameState.currentPlayer === 'O') {
                gameStatusElement.textContent = "Bot is thinking...";
            } else {
                gameStatusElement.textContent = `Your move, Player ${gameState.currentPlayer}`;
            }
        }
    }

    // Bot Logic
    function makeBotMove() {
        if (!gameState.gameActive) return;

        let moveIndex;
        moveIndex = findBestMove('O'); // Try to Win
        if (moveIndex === null) moveIndex = findBestMove('X'); // Block
        if (moveIndex === null && gameState.board[4] === '') moveIndex = 4; // Center
        if (moveIndex === null) { 
            const available = gameState.board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
            moveIndex = available[Math.floor(Math.random() * available.length)];
        }

        executeMove(moveIndex);
        gameState.isBotTurn = false;
    }

    function findBestMove(playerSymbol) {
        for (const combination of gameState.winningCombinations) {
            const [a, b, c] = combination;
            const values = [gameState.board[a], gameState.board[b], gameState.board[c]];
            const symbolCount = values.filter(v => v === playerSymbol).length;
            const emptyCount = values.filter(v => v === '').length;
            if (symbolCount === 2 && emptyCount === 1) {
                if (gameState.board[a] === '') return a;
                if (gameState.board[b] === '') return b;
                if (gameState.board[c] === '') return c;
            }
        }
        return null;
    }

    function checkWin() {
        for (let i = 0; i < gameState.winningCombinations.length; i++) {
            const combination = gameState.winningCombinations[i];
            const [a, b, c] = combination;
            if (
                gameState.board[a] !== '' &&
                gameState.board[a] === gameState.board[b] &&
                gameState.board[a] === gameState.board[c]
            ) {
                return { combination, index: i };
            }
        }
        return null;
    }

    function checkDraw() {
        return !gameState.board.includes('');
    }

    function endGame(isDraw, winResult) {
        gameState.gameActive = false;
        gameState.isBotTurn = false;
        
        if (isDraw) {
            gameStatusElement.textContent = "Game ended in a draw!";
        } else {
            gameState.scores[gameState.currentPlayer]++;
            updateScores();
            
            winResult.combination.forEach(index => {
                const cell = document.querySelector(`.cell[data-index="${index}"]`);
                cell.classList.add('winning-cell');
            });

            drawWinningLine(winResult.combination);

            let winnerName = gameState.currentPlayer;
            if (gameState.mode === 'bot' && winnerName === 'O') winnerName = "Bot";
            gameStatusElement.innerHTML = `<span class="win-message">${winnerName} wins!</span>`;
        }
    }

    // --- Line Calculation ---
    function drawWinningLine(combination) {
        // Reset
        winningLine.className = 'winning-line active';
        winningLine.classList.add(gameState.currentPlayer === 'X' ? 'x-win' : 'o-win');
        winningLine.style.width = '0';
        winningLine.style.transform = 'none';

        // Get start and end cells
        const startCell = document.querySelector(`.cell[data-index="${combination[0]}"]`);
        const endCell = document.querySelector(`.cell[data-index="${combination[2]}"]`);
        const boardRect = gameBoard.getBoundingClientRect();
        const startRect = startCell.getBoundingClientRect();
        const endRect = endCell.getBoundingClientRect();

        // Calculate Centers relative to board
        const x1 = startRect.left - boardRect.left + startRect.width / 2;
        const y1 = startRect.top - boardRect.top + startRect.height / 2;
        const x2 = endRect.left - boardRect.left + endRect.width / 2;
        const y2 = endRect.top - boardRect.top + endRect.height / 2;

        // Calculate Angle and Distance
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

        // Extension: width / 2.2 for tighter fit
        const extension = startRect.width / 2.2; 
        const totalLength = length + (extension * 2);

        // Adjust starting position
        const startX = x1 - extension * Math.cos(angle * (Math.PI / 180));
        const startY = y1 - extension * Math.sin(angle * (Math.PI / 180));

        // Apply Styles
        winningLine.style.left = `${startX}px`;
        winningLine.style.top = `${startY}px`;
        winningLine.style.transform = `rotate(${angle}deg)`;
        
        // Trigger animation
        requestAnimationFrame(() => {
            winningLine.style.width = `${totalLength}px`;
        });
    }
    // ---------------------------------------

    function updateScores() {
        scoreXElement.textContent = gameState.scores.X;
        scoreOElement.textContent = gameState.scores.O;
    }

    function setMode(mode) {
        gameState.mode = mode;
        if (mode === 'pvp') {
            btnPvp.classList.add('active');
            btnBot.classList.remove('active');
            player2Label.textContent = "Player 2";
        } else {
            btnBot.classList.add('active');
            btnPvp.classList.remove('active');
            player2Label.textContent = "Bot (CPU)";
        }
        restartGame();
    }

    function resetGame() {
        gameState.board = ['', '', '', '', '', '', '', '', ''];
        gameState.currentPlayer = 'X';
        gameState.gameActive = true;
        gameState.isBotTurn = false;
        
        currentPlayerElement.textContent = gameState.currentPlayer;
        gameStatusElement.textContent = `Your move, Player ${gameState.currentPlayer}`;
        
        winningLine.style.width = '0';
        winningLine.classList.remove('active', 'x-win', 'o-win');

        initializeBoard();
    }

    function restartGame() {
        gameState.scores.X = 0;
        gameState.scores.O = 0;
        updateScores();
        resetGame();
    }

    function createParticles() {
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            Object.assign(particle.style, {
                position: 'absolute',
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                borderRadius: '50%',
                backgroundColor: Math.random() > 0.5 ? '#00ffff' : '#ff00ff',
                left: Math.random() * 100 + 'vw',
                top: Math.random() * 100 + 'vh',
                opacity: Math.random() * 0.5 + 0.1,
                boxShadow: `0 0 ${Math.random() * 10 + 5}px ${Math.random() > 0.5 ? '#00ffff' : '#ff00ff'}`
            });
            particlesContainer.appendChild(particle);
            animateParticle(particle);
        }
    }

    function animateParticle(particle) {
        let x = parseFloat(particle.style.left);
        let y = parseFloat(particle.style.top);
        const xSpeed = (Math.random() - 0.5) * 0.5;
        const ySpeed = (Math.random() - 0.5) * 0.5;
        
        function move() {
            x += xSpeed;
            y += ySpeed;
            if (x > 100) x = 0; if (x < 0) x = 100;
            if (y > 100) y = 0; if (y < 0) y = 100;
            particle.style.left = x + 'vw';
            particle.style.top = y + 'vh';
            requestAnimationFrame(move);
        }
        move();
    }

    resetButton.addEventListener('click', resetGame);
    restartButton.addEventListener('click', restartGame);
    btnPvp.addEventListener('click', () => setMode('pvp'));
    btnBot.addEventListener('click', () => setMode('bot'));

    initializeBoard();
    createParticles();
});
// Game State
let gameState = {
    phase: 'placement', // 'placement', 'battle'
    selectedVerbs: [],
    ships: {
        carrier: { size: 5, placed: false, position: null, orientation: 'horizontal' },
        battleship: { size: 4, placed: false, position: null, orientation: 'horizontal' },
        cruiser: { size: 3, placed: false, position: null, orientation: 'horizontal' },
        submarine: { size: 3, placed: false, position: null, orientation: 'horizontal' },
        destroyer: { size: 2, placed: false, position: null, orientation: 'horizontal' }
    },
    ownBoard: {},
    attackBoard: {},
    currentAttackState: 'water',
    selectedShip: null,
    selectedOrientation: 'horizontal'
};

// Default verbs list
const defaultVerbs = [
    'hablar', 'comer', 'vivir', 'estudiar', 'trabajar', 'caminar', 'correr', 'escribir',
    'leer', 'beber', 'ser', 'llamarse', 'tener', 'hacer', 'ir', 'venir', 'ver', 'dar',
    'saber', 'querer', 'poder', 'decir', 'estar', 'poner', 'salir', 'volver', 'llegar',
    'pasar', 'quedar', 'seguir', 'conocer', 'parecer', 'resultar', 'encontrar', 'llevar',
    'traer', 'conseguir', 'sentir', 'dormir', 'morir', 'servir', 'vestir', 'pedir',
    'repetir', 'mentir', 'preferir', 'divertir', 'convertir', 'advertir', 'sugerir'
];

// Basic conjugations for validation
const conjugations = {
    'hablar': { 'yo': 'hablo', 'tú': 'hablas', 'él/ella': 'habla', 'nosotros': 'hablamos', 'vosotros': 'habláis', 'ellos/ellas': 'hablan' },
    'comer': { 'yo': 'como', 'tú': 'comes', 'él/ella': 'come', 'nosotros': 'comemos', 'vosotros': 'coméis', 'ellos/ellas': 'comen' },
    'vivir': { 'yo': 'vivo', 'tú': 'vives', 'él/ella': 'vive', 'nosotros': 'vivimos', 'vosotros': 'vivís', 'ellos/ellas': 'viven' },
    'estudiar': { 'yo': 'estudio', 'tú': 'estudias', 'él/ella': 'estudia', 'nosotros': 'estudiamos', 'vosotros': 'estudiáis', 'ellos/ellas': 'estudian' },
    'trabajar': { 'yo': 'trabajo', 'tú': 'trabajas', 'él/ella': 'trabaja', 'nosotros': 'trabajamos', 'vosotros': 'trabajáis', 'ellos/ellas': 'trabajan' },
    'caminar': { 'yo': 'camino', 'tú': 'caminas', 'él/ella': 'camina', 'nosotros': 'caminamos', 'vosotros': 'camináis', 'ellos/ellas': 'caminan' },
    'correr': { 'yo': 'corro', 'tú': 'corres', 'él/ella': 'corre', 'nosotros': 'corremos', 'vosotros': 'corréis', 'ellos/ellas': 'corren' },
    'escribir': { 'yo': 'escribo', 'tú': 'escribes', 'él/ella': 'escribe', 'nosotros': 'escribimos', 'vosotros': 'escribís', 'ellos/ellas': 'escriben' },
    'leer': { 'yo': 'leo', 'tú': 'lees', 'él/ella': 'lee', 'nosotros': 'leemos', 'vosotros': 'leéis', 'ellos/ellas': 'leen' },
    'beber': { 'yo': 'bebo', 'tú': 'bebes', 'él/ella': 'bebe', 'nosotros': 'bebemos', 'vosotros': 'bebéis', 'ellos/ellas': 'beben' },
    'ser': { 'yo': 'soy', 'tú': 'eres', 'él/ella': 'es', 'nosotros': 'somos', 'vosotros': 'sois', 'ellos/ellas': 'son' },
    'llamarse': { 'yo': 'me llamo', 'tú': 'te llamas', 'él/ella': 'se llama', 'nosotros': 'nos llamamos', 'vosotros': 'os llamáis', 'ellos/ellas': 'se llaman' }
};

const pronouns = ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos/ellas'];

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    setupEventListeners();
});

function initializeGame() {
    // Set default verbs
    gameState.selectedVerbs = ['hablar', 'comer', 'vivir', 'estudiar', 'trabajar', 'caminar', 'correr', 'escribir', 'ser', 'llamarse'];
    
    // Initialize boards
    generateBoards();
    updateSelectedVerbsDisplay();
    updateGamePhase();
    populateVerbModal();
}

function setupEventListeners() {
    // Verb selection
    document.getElementById('verb-selector-btn').addEventListener('click', openVerbModal);
    document.getElementById('apply-verbs-btn').addEventListener('click', applyVerbSelection);
    document.getElementById('cancel-verbs-btn').addEventListener('click', closeVerbModal);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });
    
    // Ship placement
    document.getElementById('fix-ships-btn').addEventListener('click', fixShips);
    
    // Attack state buttons
    document.querySelectorAll('.btn-state').forEach(btn => {
        btn.addEventListener('click', setAttackState);
    });
    
    // Reset game
    document.getElementById('reset-game-btn').addEventListener('click', resetGame);
    
    // Verb search
    document.getElementById('verb-search').addEventListener('input', filterVerbs);
    
    // Ship selection
    document.querySelectorAll('.ship').forEach(ship => {
        ship.addEventListener('click', function(e) {
            if (e.target.classList.contains('rotate-btn')) return;

            const shipType = this.dataset.ship;
            if (gameState.ships[shipType].placed) return;

            gameState.selectedShip = shipType;
            gameState.selectedOrientation = this.dataset.orientation || 'horizontal';
            highlightSelectedShip(shipType);
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModals();
        }
    });
}

function populateVerbModal() {
    const verbList = document.getElementById('verb-list');
    verbList.innerHTML = '';
    
    defaultVerbs.forEach(verb => {
        const verbItem = document.createElement('div');
        verbItem.className = 'verb-item';
        verbItem.innerHTML = `
            <label>
                <input type="checkbox" value="${verb}" ${gameState.selectedVerbs.includes(verb) ? 'checked' : ''}>
                ${verb}
            </label>
        `;
        verbList.appendChild(verbItem);
    });
}

function filterVerbs() {
    const searchTerm = document.getElementById('verb-search').value.toLowerCase();
    const verbItems = document.querySelectorAll('.verb-item');
    
    verbItems.forEach(item => {
        const verbName = item.textContent.toLowerCase();
        item.style.display = verbName.includes(searchTerm) ? 'block' : 'none';
    });
}

function openVerbModal() {
    document.getElementById('verb-modal').style.display = 'block';
}

function closeVerbModal() {
    document.getElementById('verb-modal').style.display = 'none';
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function applyVerbSelection() {
    const checkboxes = document.querySelectorAll('#verb-list input[type="checkbox"]');
    gameState.selectedVerbs = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            gameState.selectedVerbs.push(checkbox.value);
        }
    });
    
    if (gameState.selectedVerbs.length === 0) {
        showToast('Please select at least one verb.', 'error');
        return;
    }
    
    generateBoards();
    updateSelectedVerbsDisplay();
    closeVerbModal();
}

function updateSelectedVerbsDisplay() {
    const display = document.getElementById('selected-verbs');
    display.innerHTML = gameState.selectedVerbs.map(verb => `<span class="verb-tag">${verb}</span>`).join('');
}

function generateBoards() {
    generateOwnBoard();
    generateAttackBoard();
}

function generateOwnBoard() {
    const grid = document.getElementById('own-board-grid');
    grid.innerHTML = '';
    
    gameState.selectedVerbs.forEach((verb, rowIndex) => {
        const row = document.createElement('div');
        row.className = 'board-row';
        
        // Verb label
        const verbCell = document.createElement('div');
        verbCell.className = 'verb-cell';
        verbCell.textContent = verb;
        row.appendChild(verbCell);
        
        // Pronoun cells
        pronouns.forEach((pronoun, colIndex) => {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.verb = verb;
            cell.dataset.pronoun = pronoun;
            cell.dataset.row = rowIndex;
            cell.dataset.col = colIndex;
            cell.addEventListener('click', () => handleOwnBoardClick(cell));
            cell.addEventListener('mouseenter', () => showShipPreview(cell));
            cell.addEventListener('mouseleave', () => hideShipPreview());
            row.appendChild(cell);
        });
        
        grid.appendChild(row);
    });

    // After populating, mark all empty cells as water by default
    document.querySelectorAll('#own-board-grid .board-cell').forEach(cell => {
        const key = `${cell.dataset.row},${cell.dataset.col}`;
        if (!gameState.ownBoard[key]) {
            cell.dataset.state = 'water';
            cell.classList.add('water');
        }
    });
}

function generateAttackBoard() {
    const grid = document.getElementById('attack-board-grid');
    grid.innerHTML = '';
    
    gameState.selectedVerbs.forEach((verb, rowIndex) => {
        const row = document.createElement('div');
        row.className = 'board-row';
        
        // Verb label
        const verbCell = document.createElement('div');
        verbCell.className = 'verb-cell';
        verbCell.textContent = verb;
        row.appendChild(verbCell);
        
        // Pronoun cells
        pronouns.forEach((pronoun, colIndex) => {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.verb = verb;
            cell.dataset.pronoun = pronoun;
            cell.dataset.row = rowIndex;
            cell.dataset.col = colIndex;
            cell.dataset.state = 'water';
            cell.addEventListener('click', () => handleAttackBoardClick(cell));
            row.appendChild(cell);
        });
        
        grid.appendChild(row);
    });
}


function canPlaceShip(row, col, size, orientation) {
    const maxRow = gameState.selectedVerbs.length;
    const maxCol = pronouns.length;
    
    // Check if ship fits in grid
    if (orientation === 'horizontal') {
        if (col + size > maxCol) return false;
    } else {
        if (row + size > maxRow) return false;
    }
    
    // Check for collisions and adjacency
    const positions = [];
    for (let i = 0; i < size; i++) {
        const checkRow = orientation === 'horizontal' ? row : row + i;
        const checkCol = orientation === 'horizontal' ? col + i : col;
        positions.push({ row: checkRow, col: checkCol });
    }
    
    // Check each position and its neighbors
    for (let pos of positions) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const checkRow = pos.row + dr;
                const checkCol = pos.col + dc;
                
                if (checkRow >= 0 && checkRow < maxRow && checkCol >= 0 && checkCol < maxCol) {
                    const key = `${checkRow},${checkCol}`;
                    if (gameState.ownBoard[key]) {
                        return false;
                    }
                }
            }
        }
    }
    
    return true;
}

function placeShip(row, col, type, orientation) {
    const size = gameState.ships[type].size;
    const positions = [];

    for (let i = 0; i < size; i++) {
        const shipRow = orientation === 'horizontal' ? row : row + i;
        const shipCol = orientation === 'horizontal' ? col + i : col;

        const key = `${shipRow},${shipCol}`;
        gameState.ownBoard[key] = type;
        positions.push({ row: shipRow, col: shipCol });

        // Visual update
        const cell = document.querySelector(`#own-board-grid .board-cell[data-row="${shipRow}"][data-col="${shipCol}"]`);
        cell.classList.add('ship-placed');
        cell.classList.remove('water');
        if (cell.dataset.state === 'water') {
            delete cell.dataset.state;
        }
    }

    gameState.ships[type].position = positions;
    gameState.ships[type].orientation = orientation;
}

function removeShip(type) {
    const ship = gameState.ships[type];
    if (!ship.position) return;
    ship.position.forEach(pos => {
        const key = `${pos.row},${pos.col}`;
        delete gameState.ownBoard[key];
        const cell = document.querySelector(`#own-board-grid .board-cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            cell.classList.remove('ship-placed', 'ship-fixed');
            cell.dataset.state = 'water';
            cell.classList.add('water');
        }
    });
    ship.position = null;
    ship.placed = false;
}

function showShipPreview(cell) {
    if (gameState.phase !== 'placement' || !gameState.selectedShip) return;

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const shipSize = gameState.ships[gameState.selectedShip].size;
    const orientation = gameState.selectedOrientation;

    const previewCells = [];
    for (let i = 0; i < shipSize; i++) {
        const previewRow = orientation === 'horizontal' ? row : row + i;
        const previewCol = orientation === 'horizontal' ? col + i : col;
        previewCells.push({ row: previewRow, col: previewCol });
    }

    const isValid = canPlaceShip(row, col, shipSize, orientation);

    previewCells.forEach(pos => {
        const previewCell = document.querySelector(
            `#own-board-grid .board-cell[data-row="${pos.row}"][data-col="${pos.col}"]`
        );
        if (previewCell) {
            previewCell.classList.add('ship-preview');
            if (isValid) previewCell.classList.add('valid');
        }
    });
}

function hideShipPreview() {
    document.querySelectorAll('.ship-preview').forEach(cell => {
        cell.classList.remove('ship-preview', 'valid');
    });
}

function highlightSelectedShip(shipType) {
    document.querySelectorAll('.ship').forEach(ship => {
        ship.classList.toggle('active', ship.dataset.ship === shipType);
    });
}

function rotateShip(button) {
    const ship = button.closest('.ship');
    const visual = ship.querySelector('.ship-visual');
    const currentOrientation = ship.dataset.orientation || 'horizontal';

    if (currentOrientation === 'horizontal') {
        ship.dataset.orientation = 'vertical';
        visual.classList.add('vertical');
    } else {
        ship.dataset.orientation = 'horizontal';
        visual.classList.remove('vertical');
    }

    if (gameState.selectedShip === ship.dataset.ship) {
        gameState.selectedOrientation = ship.dataset.orientation;
    }
}

function updateShipsRemaining() {
    const remaining = Object.values(gameState.ships).filter(ship => !ship.placed).length;
    document.getElementById('ships-remaining').textContent = remaining;
}

function fixShips() {
    const allShipsPlaced = Object.values(gameState.ships).every(ship => ship.placed);
    
    if (!allShipsPlaced) {
        showToast('Please place all ships before fixing them.', 'info');
        return;
    }
    
    // Make ships semi-transparent
    document.querySelectorAll('.ship-placed').forEach(cell => {
        cell.classList.add('ship-fixed');
    });
    
    // Hide ship placement UI
    document.getElementById('ships-container').style.display = 'none';
    document.getElementById('ship-placement-controls').style.display = 'none';

    // Switch to battle phase
    gameState.phase = 'battle';
    gameState.selectedShip = null;
    highlightSelectedShip(null);
    updateGamePhase();
}

function updateGamePhase() {
    const phaseText = document.getElementById('phase-text');
    const turnInfo = document.getElementById('turn-info');
    
    if (gameState.phase === 'placement') {
        phaseText.textContent = 'Phase: Ship Placement';
        turnInfo.textContent = 'Click a ship then a cell to place it. Click "Fix Ships" when ready';
    } else {
        phaseText.textContent = 'Phase: Battle';
        turnInfo.textContent = 'Click on enemy board to attack. Use conjugation to validate your move.';
    }
}

function handleOwnBoardClick(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (gameState.phase === 'placement') {
        if (!gameState.selectedShip) {
            showToast('Select a ship first', 'info');
            return;
        }

        const selectedType = gameState.selectedShip;
        const ship = gameState.ships[selectedType];

        if (ship.position && gameState.ownBoard[`${row},${col}`] === selectedType) {
            removeShip(selectedType);
            document.getElementById(`ship-${selectedType}`).style.display = '';
            updateShipsRemaining();
            return;
        }

        if (canPlaceShip(row, col, ship.size, gameState.selectedOrientation)) {
            placeShip(row, col, selectedType, gameState.selectedOrientation);
            document.getElementById(`ship-${selectedType}`).style.display = 'none';
            ship.placed = true;
            updateShipsRemaining();
        } else {
            showToast("You can't place your boats next to each other", 'error');
        }
        return;
    }

    if (gameState.phase !== 'battle') return;

    const key = `${row},${col}`;
    const shipType = gameState.ownBoard[key];

    // Ignore clicks on empty water cells
    if (!shipType && cell.dataset.state === 'water') {
        return;
    }

    // Toggle hit/sunk state for ship cells
    const currentState = cell.dataset.state;
    let newState;
    if (currentState === 'hit') {
        newState = 'sunk';
    } else if (currentState === 'sunk') {
        newState = 'hit';
    } else {
        newState = 'hit';
    }

    cell.dataset.state = newState;
    cell.classList.remove('water', 'hit', 'sunk');
    cell.classList.add(newState);

    if (shipType && newState === 'hit') {
        checkIfShipSunk(shipType);
    }
}

function checkIfShipSunk(type){
    const positions = gameState.ships[type].position;
    const allHit = positions.every(p=>{
        const cell = document.querySelector(`#own-board-grid .board-cell[data-row="${p.row}"][data-col="${p.col}"]`);
        return cell.dataset.state === 'hit';
    });
    if(allHit){
        positions.forEach(p=>{
            const cellSel = `#own-board-grid .board-cell[data-row="${p.row}"][data-col="${p.col}"]`;
            const cell = document.querySelector(cellSel);
            cell.dataset.state = 'sunk';
            cell.classList.remove('hit');
            cell.classList.add('sunk');
        });
    }
}

function handleAttackBoardClick(cell) {
    if (gameState.phase !== 'battle') return;

    if (cell.dataset.unlocked !== 'true') {
        // Apply chosen state and require conjugation
        cell.dataset.state = gameState.currentAttackState;
        cell.className = `board-cell ${gameState.currentAttackState}`;
        showAttackModal(cell);
        return;
    }

    // Already unlocked: simply cycle through states
    cycleAttackIcon(cell);
}

function cycleAttackIcon(cell) {
    const order = ['water', 'hit', 'sunk'];
    let idx = order.indexOf(cell.dataset.state || 'water');
    idx = (idx + 1) % order.length;
    cell.dataset.state = order[idx];
    cell.classList.remove('water', 'hit', 'sunk');
    cell.classList.add(order[idx]);
}

function showAttackModal(cell) {
    const modal = document.getElementById('attack-modal');
    const verb = cell.dataset.verb;
    const pronoun = cell.dataset.pronoun;
    const position = `${String.fromCharCode(65 + parseInt(cell.dataset.col))}${parseInt(cell.dataset.row) + 1}`;
    
    document.getElementById('attack-position').textContent = position;
    document.getElementById('attack-verb').textContent = verb;
    document.getElementById('attack-pronoun').textContent = pronoun;
    document.getElementById('conjugation').value = '';
    document.getElementById('conjugation-result').innerHTML = '';
    
    modal.style.display = 'block';
    
    // Setup conjugation check
    const checkBtn = document.getElementById('check-conjugation-btn');
    checkBtn.onclick = () => checkConjugation(cell, verb, pronoun);
    
    // Allow Enter key to check
    document.getElementById('conjugation').onkeypress = (e) => {
        if (e.key === 'Enter') {
            checkConjugation(cell, verb, pronoun);
        }
    };
}

function checkConjugation(cell, verb, pronoun) {
    const userInput = document.getElementById('conjugation').value.toLowerCase().trim();
    const resultDiv = document.getElementById('conjugation-result');
    
    if (conjugations[verb] && conjugations[verb][pronoun]) {
        const correctAnswer = conjugations[verb][pronoun].toLowerCase();
        
        if (userInput === correctAnswer) {
            resultDiv.innerHTML = '<div class="success">✓ Correct! You can make this attack.</div>';
            cell.dataset.unlocked = 'true';
            setTimeout(() => {
                closeModals();
            }, 1500);
        } else {
            resultDiv.innerHTML = `<div class="error">✗ Incorrect. The correct answer is: <strong>${conjugations[verb][pronoun]}</strong></div>`;
        }
    } else {
        resultDiv.innerHTML = '<div class="error">Conjugation not available for this verb.</div>';
    }
}

function setAttackState(e) {
    // Remove active class from all buttons
    document.querySelectorAll('.btn-state').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    e.target.classList.add('active');
    
    // Set current attack state
    gameState.currentAttackState = e.target.dataset.state;
}

function resetGame() {
    if (confirm('Are you sure you want to reset the game?')) {
        // Reset game state
        gameState.phase = 'placement';
        gameState.ships = {
            carrier: { size: 5, placed: false, position: null, orientation: 'horizontal' },
            battleship: { size: 4, placed: false, position: null, orientation: 'horizontal' },
            cruiser: { size: 3, placed: false, position: null, orientation: 'horizontal' },
            submarine: { size: 3, placed: false, position: null, orientation: 'horizontal' },
            destroyer: { size: 2, placed: false, position: null, orientation: 'horizontal' }
        };
        gameState.ownBoard = {};
        gameState.attackBoard = {};
        gameState.currentAttackState = 'water';
        gameState.selectedShip = null;
        gameState.selectedOrientation = 'horizontal';

        // Reset UI
        document.getElementById('ships-container').style.display = 'block';
        document.getElementById('ship-placement-controls').style.display = 'block';
        document.querySelectorAll('.ship').forEach(ship => {
            ship.style.display = 'block';
            ship.dataset.orientation = 'horizontal';
            ship.classList.remove('active');
            const visual = ship.querySelector('.ship-visual');
            if (visual) visual.classList.remove('vertical');
        });
        highlightSelectedShip(null);
        
        // Reset boards
        generateBoards();
        updateShipsRemaining();
        updateGamePhase();
        
        // Reset attack state buttons
        document.querySelectorAll('.btn-state').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('water-btn').classList.add('active');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%);
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

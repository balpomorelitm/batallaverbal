// Game State
let gameState = {
    phase: 'placement', // 'placement', 'battle'
    selectedVerbs: [],
    selectedTense: 'present', // New: default tense
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

// Global variable to store all verbs data from JSON
let allVerbsData = [];

const pronouns = ['yo', 'tú', 'vos', 'él', 'nosotros', 'vosotros', 'ellos'];

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    // Fetch verbs data from verbos.json
    fetch('verbos.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            allVerbsData = data;
            initializeGame();
            setupEventListeners();
        })
        .catch(error => console.error('Error loading verbs data:', error));
});

function initializeGame() {
    // Set default verbs from loaded data (e.g., first 10 infinitives)
    // Ensure that selected verbs are available in the loaded allVerbsData
    gameState.selectedVerbs = allVerbsData.slice(0, 10).map(v => v.infinitive_es);
    
    // Initialize boards
    generateBoards();
    updateSelectedVerbsDisplay();
    updateGamePhase();
    populateVerbModal();
    populateTenseSelector(); // Call the new function to populate the tense dropdown
    updateShipsRemaining(); // Ensure ship counter is updated on init
}

function setupEventListeners() {
    // Verb selection
    document.getElementById('verb-selector-btn').addEventListener('click', openVerbModal);
    document.getElementById('apply-verbs-btn').addEventListener('click', applyVerbSelection);
    document.getElementById('cancel-verbs-btn').addEventListener('click', closeVerbModal);
    
    // Tense selection
    document.getElementById('tense-select').addEventListener('change', (event) => {
        gameState.selectedTense = event.target.value;
        // Optionally, regenerate boards or show a message if tense changes affect current game
        // For simplicity, we'll just update the selected tense
    });

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

            // CHECK IF SHIP IS ALREADY PLACED
            if (gameState.ships[shipType].placed) {
                showToast('This ship has already been placed!', 'error');
                return; // Prevent selection
            }

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
    
    allVerbsData.forEach(verbObj => {
        const infinitive = verbObj.infinitive_es;
        const verbItem = document.createElement('div');
        verbItem.className = 'verb-item';
        verbItem.innerHTML = `
            <label>
                <input type="checkbox" value="${infinitive}" ${gameState.selectedVerbs.includes(infinitive) ? 'checked' : ''}>
                ${infinitive}
            </label>
        `;
        verbList.appendChild(verbItem);
    });
}

function populateTenseSelector() {
    const tenseSelect = document.getElementById('tense-select');
    tenseSelect.innerHTML = ''; // Clear existing options

    // Assuming all verbs have the same tenses available, pick from the first one
    if (allVerbsData.length > 0) {
        const firstVerb = allVerbsData[0];
        for (const tenseKey in firstVerb.conjugations) {
            const option = document.createElement('option');
            option.value = tenseKey;
            option.textContent = formatTenseName(tenseKey);
            tenseSelect.appendChild(option);
        }
    }
    // Set the selected value to the current game state's tense
    tenseSelect.value = gameState.selectedTense;
}

// Helper function to format tense names for display
function formatTenseName(tenseKey) {
    const tenseNames = {
        'present': 'Presente',
        'past_simple': 'Pretérito Perfecto Simple',
        'present_perfect': 'Pretérito Perfecto Compuesto',
        'future_simple': 'Futuro Simple',
        'condicional_simple': 'Condicional Simple',
        'imperfect_indicative': 'Pretérito Imperfecto'
    };
    return tenseNames[tenseKey] || tenseKey.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
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
    
    // Reset ships when verbs are re-selected
    resetShipsState();
    generateBoards();
    updateSelectedVerbsDisplay();
    closeVerbModal();
    updateShipsRemaining();
    updateGamePhase(); // Update game phase display to reflect changes
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

function placeShip(row, col, shipType, shipObject) {
    const size = shipObject.size;
    const orientation = gameState.selectedOrientation;
    const positions = [];

    for (let i = 0; i < size; i++) {
        const shipRow = orientation === 'horizontal' ? row : row + i;
        const shipCol = orientation === 'horizontal' ? col + i : col;

        const key = `${shipRow},${shipCol}`;
        gameState.ownBoard[key] = shipType;
        positions.push({ row: shipRow, col: shipCol });

        // Visual update
        const cell = document.querySelector(`#own-board-grid .board-cell[data-row="${shipRow}"][data-col="${shipCol}"]`);
        if (cell) {
            cell.classList.add('ship-placed');
            cell.classList.remove('water');
            if (cell.dataset.state === 'water') {
                delete cell.dataset.state;
            }
        }
    }

    // MARK SHIP AS PLACED AND STORE POSITION AND CURRENT ORIENTATION
    gameState.ships[shipType].placed = true;
    gameState.ships[shipType].position = positions;
    gameState.ships[shipType].orientation = orientation;

    // HIDE THE SHIP FROM SELECTION
    const shipElement = document.querySelector(`[data-ship="${shipType}"]`);
    if (shipElement) {
        shipElement.classList.add('ship-placed-ui');
        const shipVisual = shipElement.querySelector('.ship-visual');
        if (shipVisual) {
            if (orientation === 'vertical') {
                shipVisual.classList.add('vertical');
            } else {
                shipVisual.classList.remove('vertical');
            }
        }
    }

    // CLEAR SELECTION
    gameState.selectedShip = null;
    highlightSelectedShip(null);
    updateShipsRemaining();
}

function removeShip(shipType) {
    const shipData = gameState.ships[shipType];
    if (!shipData || !shipData.position) return;

    shipData.position.forEach(pos => {
        const key = `${pos.row},${pos.col}`;
        delete gameState.ownBoard[key];
        const cell = document.querySelector(`#own-board-grid .board-cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            cell.classList.remove('ship-placed', 'ship-fixed');
            cell.dataset.state = 'water';
            cell.classList.add('water');
        }
    });

    shipData.position = null;
    shipData.placed = false;
    shipData.orientation = 'horizontal';

    const shipElement = document.querySelector(`[data-ship="${shipType}"]`);
    if (shipElement) {
        shipElement.classList.remove('ship-placed-ui');
        shipElement.dataset.orientation = 'horizontal';
        const shipVisual = shipElement.querySelector('.ship-visual');
        if (shipVisual) {
            shipVisual.classList.remove('vertical');
        }
    }

    if (gameState.selectedShip === shipType) {
        gameState.selectedShip = null;
        highlightSelectedShip(null);
    }
    updateShipsRemaining();
}

function handleShipRelocation(shipType) {
    if (!gameState.ships[shipType].placed) return;

    // Remove ship from board
    const positions = gameState.ships[shipType].position;
    positions.forEach(pos => {
        const key = `${pos.row},${pos.col}`;
        delete gameState.ownBoard[key];

        const cell = document.querySelector(`#own-board-grid .board-cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
        if (cell) {
            cell.classList.remove('ship-placed');
        }
    });

    // Reset ship state
    gameState.ships[shipType].placed = false;
    gameState.ships[shipType].position = null;

    // Show ship in palette again
    const shipElement = document.querySelector(`[data-ship="${shipType}"]`);
    if (shipElement) shipElement.classList.remove('ship-placed-ui');

    // Auto-select for replacement
    gameState.selectedShip = shipType;
    gameState.selectedOrientation = shipElement.dataset.orientation || 'horizontal';
    highlightSelectedShip(shipType);

    showToast(`${shipType} removed. Click on the board to place it again.`, 'info');
    updateShipsRemaining();
}

function resetIndividualShip(shipType) {
    if (gameState.ships[shipType].placed) {
        handleShipRelocation(shipType);
    }
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
        
        // Only add to preview if within bounds
        if (previewRow < gameState.selectedVerbs.length && previewCol < pronouns.length) {
            previewCells.push({ row: previewRow, col: previewCol });
        } else {
            // If any part of the ship is out of bounds, it's invalid
            previewCells.length = 0; // Clear preview cells
            break;
        }
    }

    const isValid = previewCells.length === shipSize && canPlaceShip(row, col, shipSize, orientation);

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

    // Update Fix Ships button state
    const fixButton = document.getElementById('fix-ships-btn');
    if (remaining === 0) {
        fixButton.disabled = false;
        fixButton.classList.remove('btn-disabled');
    } else {
        fixButton.disabled = true;
        fixButton.classList.add('btn-disabled');
    }
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
    const enemyBoard = document.querySelector('.board-section.enemy-board');

    if (gameState.phase === 'placement') {
        phaseText.textContent = 'Phase: Ship Placement';
        turnInfo.textContent = 'Select a ship and click on your board to place it';
        if (enemyBoard) enemyBoard.classList.add('hidden');
    } else {
        phaseText.textContent = 'Phase: Battle';
        turnInfo.textContent = 'Attack enemy positions by clicking their board';
        if (enemyBoard) enemyBoard.classList.remove('hidden');
    }
}

function handleOwnBoardClick(cell) {
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (gameState.phase === 'placement') {
        if (!gameState.selectedShip) {
            showToast('Select a ship first!', 'warning');
            return;
        }

        const shipType = gameState.selectedShip; // e.g., 'carrier'
        const currentShipData = gameState.ships[shipType];

        if (canPlaceShip(row, col, currentShipData.size, gameState.selectedOrientation)) {
            placeShip(row, col, shipType, currentShipData);
            showToast(`${shipType.charAt(0).toUpperCase() + shipType.slice(1)} placed!`, 'info');
        } else {
            showToast("You can't place your boats next to each other or outside the board.", 'error');
        }
        hideShipPreview();
        return; // Exit function after handling placement logic
    }

    // This part is for manually marking cells in 'battle' phase (for testing/dev)
    if (gameState.phase !== 'battle') return;

    const key = `${row},${col}`;
    const hasShip = !!gameState.ownBoard[key];

    if (!hasShip) {
        const currentState = cell.dataset.state || 'empty';

        if (currentState === 'empty' || currentState === 'sunk') {
            cell.dataset.state = 'water';
            cell.classList.add('water');
            cell.classList.remove('sunk'); // Remove sunk if it was there
        } else if (currentState === 'water') {
            cell.dataset.state = 'empty';
            cell.classList.remove('water');
        }
    } else {
        const currentState = cell.dataset.state;
        let newState;
        if (currentState === 'hit') {
            newState = 'sunk';
        } else if (currentState === 'sunk') {
            newState = 'water'; // Revert sunk to water
        } else {
            newState = 'hit';
        }

        cell.dataset.state = newState;
        cell.classList.remove('water', 'hit', 'sunk');
        cell.classList.add(newState);

        if (newState === 'hit') {
            const shipType = gameState.ownBoard[key];
            checkIfShipSunk(shipType);
        } else if (newState === 'sunk') {
            checkGameOver();
        }
    }
}

function checkIfShipSunk(type){
    const positions = gameState.ships[type].position;
    const allHit = positions.every(p=>{
        const cell = document.querySelector(`#own-board-grid .board-cell[data-row="${p.row}"][data-col="${p.col}"]`);
        return cell && cell.dataset.state === 'hit'; // Ensure cell exists
    });
    if(allHit){
        positions.forEach(p=>{
            const cellSel = `#own-board-grid .board-cell[data-row="${p.row}"][data-col="${p.col}"]`;
            const cell = document.querySelector(cellSel);
            if(cell) { // Ensure cell exists
                cell.dataset.state = 'sunk';
                cell.classList.remove('hit');
                cell.classList.add('sunk');
            }
        });
        checkGameOver();
    }
}

function handleAttackBoardClick(cell) {
    if (gameState.phase !== 'battle') return;

    if (cell.dataset.unlocked !== 'true') {
        // Apply chosen state and require conjugation
        // cell.dataset.state = gameState.currentAttackState; // No, state is set after conjugation check
        // cell.className = `board-cell ${gameState.currentAttackState}`; // No, state is set after conjugation check
        showAttackModal(cell);
        return;
    }

    // Already unlocked: simply cycle through states (for testing purposes)
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
    const position = `${String.fromCharCode(65 + parseInt(cell.dataset.col))}${parseInt(cell.dataset.row) + 1}`; // e.g., A1

    document.getElementById('attack-position').textContent = position;
    document.getElementById('attack-verb').textContent = verb;
    document.getElementById('attack-pronoun').textContent = pronoun;
    document.getElementById('conjugation').value = ''; // Clear previous input
    document.getElementById('conjugation-result').innerHTML = ''; // Clear previous result
    
    modal.style.display = 'block';
    
    // Setup conjugation check
    const checkBtn = document.getElementById('check-conjugation-btn');
    checkBtn.onclick = () => checkConjugation(cell, verb, pronoun);
    
    // Allow Enter key to check
    document.getElementById('conjugation').onkeypress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission
            checkConjugation(cell, verb, pronoun);
        }
    };
}

function checkConjugation(cell, verb, pronoun) {
    const userInput = document.getElementById('conjugation').value.toLowerCase().trim();
    const resultDiv = document.getElementById('conjugation-result');
    const selectedTense = gameState.selectedTense;

    // Find the verb object in allVerbsData
    const verbObj = allVerbsData.find(v => v.infinitive_es === verb);

    if (verbObj && verbObj.conjugations && verbObj.conjugations[selectedTense] && verbObj.conjugations[selectedTense][pronoun]) {
        const correctAnswer = verbObj.conjugations[selectedTense][pronoun].toLowerCase();
        
        if (userInput === correctAnswer) {
            resultDiv.innerHTML = '<div class="success">✓ Correct! You can make this attack.</div>';
            cell.dataset.unlocked = 'true'; // Mark cell as unlocked
            cell.dataset.state = gameState.currentAttackState; // Apply the chosen state
            cell.classList.add(gameState.currentAttackState); // Apply the chosen class
            setTimeout(() => {
                closeModals();
            }, 1500);
        } else {
            resultDiv.innerHTML = `<div class="error">✗ Incorrect. The correct answer is: <strong>${verbObj.conjugations[selectedTense][pronoun]}</strong></div>`;
        }
    } else {
        resultDiv.innerHTML = '<div class="error">Conjugation not available for this verb/tense/pronoun.</div>';
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
        // Reset all ships to unplaced state and visual
        Object.keys(gameState.ships).forEach(shipType => {
            removeShip(shipType);
        });

        // Reset game state properties
        gameState.phase = 'placement';
        gameState.ownBoard = {};
        gameState.attackBoard = {};
        gameState.currentAttackState = 'water';
        gameState.selectedShip = null;
        gameState.selectedOrientation = 'horizontal';
        // Keep selectedVerbs and selectedTense as they were, or reset to default if preferred
        // gameState.selectedVerbs = allVerbsData.slice(0, 10).map(v => v.infinitive_es);
        // gameState.selectedTense = 'present';

        // Reset UI elements that are not handled by removeShip
        document.getElementById('ships-container').style.display = 'block';
        document.getElementById('ship-placement-controls').style.display = 'block';
        document.querySelectorAll('.ship').forEach(ship => {
            ship.classList.remove('active');
        });
        highlightSelectedShip(null);

        // Regenerate boards to clear any visual artifacts and re-add water class
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

function resetShipsState() {
    gameState.ships = {
        carrier: { size: 5, placed: false, position: null, orientation: 'horizontal' },
        battleship: { size: 4, placed: false, position: null, orientation: 'horizontal' },
        cruiser: { size: 3, placed: false, position: null, orientation: 'horizontal' },
        submarine: { size: 3, placed: false, position: null, orientation: 'horizontal' },
        destroyer: { size: 2, placed: false, position: null, orientation: 'horizontal' }
    };
    // Ensure all cells are reset visually
    document.querySelectorAll('#own-board-grid .board-cell').forEach(cell => {
        cell.classList.remove('ship-placed', 'ship-fixed', 'water', 'hit', 'sunk', 'ship-preview', 'valid');
        delete cell.dataset.state; // Remove data-state to ensure clean slate
    });
    document.querySelectorAll('#attack-board-grid .board-cell').forEach(cell => {
        cell.classList.remove('water', 'hit', 'sunk');
        cell.classList.add('water'); // Default to water
        cell.dataset.state = 'water';
        delete cell.dataset.unlocked; // Remove unlocked state
    });
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
    // Adjust background for error toasts
    if (type === 'error') {
        toast.style.background = 'linear-gradient(135deg, #d32f2f 0%, #f44336 100%)';
    }
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function checkGameOver() {
    const allShipsSunk = Object.values(gameState.ships).every(ship => {
        // A ship is considered "sunk" if it was placed and all its parts are marked as 'sunk'
        if (!ship.placed || !ship.position) return false;

        return ship.position.every(pos => {
            const cell = document.querySelector(
                `#own-board-grid .board-cell[data-row="${pos.row}"][data-col="${pos.col}"]`
            );
            return cell && cell.dataset.state === 'sunk';
        });
    });

    if (allShipsSunk) {
        showGameOverMessage();
    }
}

function showGameOverMessage() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content game-over-modal">
            <div class="modal-header">
                <h2>💀 GAME OVER 💀</h2>
            </div>
            <div class="modal-body">
                <div class="game-over-message">
                    <h3>You tried but you died!</h3>
                    <p>Time to say <strong>Felicidades</strong> to your frenemy!</p>
                    <button class="btn btn-primary" onclick="resetGame(); this.closest('.modal').remove();">
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

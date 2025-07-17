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

let allVerbsData = []; // Will store verbs from verbos.json
let currentConjugations = {}; // Conjugations for the currently selected tense
let selectedTense = 'present';
let selectedIrregularityTypes = new Set();
let showReflexiveOnly = false;

// Order of tenses from easiest to hardest for dropdown
const TENSE_ORDER = [
    "present",
    "present_perfect",
    "past_simple",
    "future_simple",
    "condicional_simple",
    "imperfect_indicative"
];

const pronouns = ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos/ellas'];

function getUniqueTenses() {
    const tenses = new Set();
    allVerbsData.forEach(verb => {
        Object.keys(verb.conjugations).forEach(tense => tenses.add(tense));
    });
    return Array.from(tenses).sort();
}

function getUniqueIrregularityTypes() {
    const types = new Set();
    allVerbsData.forEach(verb => {
        Object.values(verb.types).flat().forEach(type => {
            if (type !== 'regular' && type !== 'reflexive') {
                types.add(type);
            }
        });
    });
    return Array.from(types).sort();
}

function populateTenseSelect() {
    const tenseSelect = document.getElementById('tense-select');
    if (!tenseSelect) return;
    tenseSelect.innerHTML = '';
    let tenses = getUniqueTenses();

    // Sort tenses based on predefined order
    tenses.sort((a, b) => {
        const indexA = TENSE_ORDER.indexOf(a);
        const indexB = TENSE_ORDER.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    tenses.forEach(tense => {
        const option = document.createElement('option');
        option.value = tense;
        option.textContent = tense.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        tenseSelect.appendChild(option);
    });

    const initialTense = 'present';
    tenseSelect.value = initialTense;
    selectedTense = initialTense;

    tenseSelect.addEventListener('change', (e) => {
        selectedTense = e.target.value;
        updateConjugationsForSelectedTense();
        populateIrregularityOptions();
        populateVerbModal();
    });

    // Populate irregularity options for default tense
    populateIrregularityOptions();
}

function populateIrregularityOptions() {
    const irregularityOptionsDiv = document.getElementById('irregularity-options');
    if (!irregularityOptionsDiv) return;
    irregularityOptionsDiv.innerHTML = '';

    const relevantIrregularityTypes = new Set();

    // Filter verbs that contain the currently selected tense
    const verbsForSelectedTense = allVerbsData.filter(verb => verb.conjugations[selectedTense]);

    verbsForSelectedTense.forEach(verb => {
        if (verb.types[selectedTense]) {
            verb.types[selectedTense].forEach(type => {
                if (type !== 'regular' && type !== 'reflexive') {
                    relevantIrregularityTypes.add(type);
                }
            });
        }
    });

    // Remove previously selected types that no longer apply
    selectedIrregularityTypes.forEach(type => {
        if (!relevantIrregularityTypes.has(type)) {
            selectedIrregularityTypes.delete(type);
        }
    });

    const sortedIrregularityTypes = Array.from(relevantIrregularityTypes).sort();

    sortedIrregularityTypes.forEach(type => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.innerHTML = `
            <input type="checkbox" value="${type}" ${selectedIrregularityTypes.has(type) ? 'checked' : ''} style="transform: scale(1.3); accent-color: #42a5f5; margin-right: 0.5rem;">
            ${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        `;
        const checkbox = label.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedIrregularityTypes.add(e.target.value);
            } else {
                selectedIrregularityTypes.delete(e.target.value);
            }
            populateVerbModal();
        });
        irregularityOptionsDiv.appendChild(label);
    });
}

function updateConjugationsForSelectedTense() {
    currentConjugations = {};
    allVerbsData.forEach(verb => {
        if (verb.conjugations[selectedTense]) {
            currentConjugations[verb.infinitive_es] = verb.conjugations[selectedTense];
        }
    });
}

// Initialize the game after loading verbs
document.addEventListener('DOMContentLoaded', function() {
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
        .catch(error => {
            console.error('Error loading verbos.json:', error);
            showToast('Failed to load verb data. Please refresh.', 'error');
        });
});

function initializeGame() {
    // Set initial selected verbs (e.g., first 10 from loaded data)
    gameState.selectedVerbs = allVerbsData.slice(0, 10).map(v => v.infinitive_es);

    populateTenseSelect(); // also sets selectedTense and irregularity options
    updateConjugationsForSelectedTense();
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

    const reflexiveCheckbox = document.getElementById('filter-reflexive-verbs');
    if (reflexiveCheckbox) {
        reflexiveCheckbox.addEventListener('change', (e) => {
            showReflexiveOnly = e.target.checked;
            populateVerbModal();
        });
    }
    
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

    const searchTerm = document.getElementById('verb-search').value.toLowerCase();

    const filteredVerbs = allVerbsData.filter(verb => {
        const matchesSearchTerm = verb.infinitive_es.toLowerCase().includes(searchTerm);
        if (!matchesSearchTerm) return false;

        if (!verb.conjugations[selectedTense]) return false;

        // Filter by reflexive only if requested
        if (showReflexiveOnly) {
            if (!Array.isArray(verb.types[selectedTense]) || !verb.types[selectedTense].includes('reflexive')) {
                return false;
            }
        }

        let matchesIrregularity = true;
        if (selectedIrregularityTypes.size > 0) {
            const verbIrregularityTypesForTense = verb.types[selectedTense] || [];
            matchesIrregularity = Array.from(selectedIrregularityTypes).every(type =>
                verbIrregularityTypesForTense.includes(type)
            );
        }

        return matchesIrregularity;
    });

    filteredVerbs.forEach(verbData => {
        const verb = verbData.infinitive_es;
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
    // Re-populate modal based on search term and filters
    populateVerbModal();
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

function placeShip(row, col, ship) {
    const size = ship.size;
    const positions = [];

    for (let i = 0; i < size; i++) {
        const shipRow = gameState.selectedOrientation === 'horizontal' ? row : row + i;
        const shipCol = gameState.selectedOrientation === 'horizontal' ? col + i : col;

        const key = `${shipRow},${shipCol}`;
        gameState.ownBoard[key] = ship.type;
        positions.push({ row: shipRow, col: shipCol });

        // Visual update
        const cell = document.querySelector(`#own-board-grid .board-cell[data-row="${shipRow}"][data-col="${shipCol}"]`);
        cell.classList.add('ship-placed');
        cell.classList.remove('water');
        if (cell.dataset.state === 'water') {
            delete cell.dataset.state;
        }
    }

    // MARK SHIP AS PLACED AND STORE POSITION
    gameState.ships[ship.type].placed = true;
    gameState.ships[ship.type].position = positions;

    // HIDE THE SHIP FROM SELECTION
    const shipElement = document.querySelector(`[data-ship="${ship.type}"]`);
    if (shipElement) shipElement.classList.add('ship-placed-ui');

    // CLEAR SELECTION
    gameState.selectedShip = null;
    highlightSelectedShip(null);
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
    const current = ship.dataset.orientation || 'horizontal';

    ship.dataset.orientation = current === 'horizontal' ? 'vertical' : 'horizontal';

    if (ship.dataset.orientation === 'vertical') {
        visual.classList.add('vertical');
    } else {
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

        const shipType = gameState.selectedShip;

        // DOUBLE CHECK: Ensure ship isn't already placed
        if (gameState.ships[shipType].placed) {
            showToast('This ship type has already been placed!', 'error');
            return;
        }

        const shipSize = gameState.ships[shipType].size;

        if (canPlaceShip(row, col, shipSize, gameState.selectedOrientation)) {
            placeShip(row, col, {
                type: shipType,
                size: shipSize
            });
            updateShipsRemaining();
        } else {
            showToast("You can't place your boats next to each other", 'error');
        }
        return;
    }

    if (gameState.phase !== 'battle') return;

    const key = `${row},${col}`;
    const hasShip = !!gameState.ownBoard[key];

    if (!hasShip) {
        const currentState = cell.dataset.state || 'empty';

        if (currentState === 'empty') {
            cell.dataset.state = 'water';
            cell.classList.add('water');
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
            newState = 'hit';
        } else {
            newState = 'hit';
        }

        cell.dataset.state = newState;
        cell.classList.remove('water', 'hit', 'sunk');
        cell.classList.add(newState);

        if (newState === 'hit') {
            const shipType = gameState.ownBoard[key];
            checkIfShipSunk(shipType);
        }
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
        checkGameOver();
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

    const pronounMap = { 'él/ella': 'él', 'ellos/ellas': 'ellos' };
    const dataPronoun = pronounMap[pronoun] || pronoun;

    if (currentConjugations[verb] && currentConjugations[verb][dataPronoun]) {
        const correctAnswer = currentConjugations[verb][dataPronoun].toLowerCase();
        
        if (userInput === correctAnswer) {
            resultDiv.innerHTML = '<div class="success">✓ Correct! You can make this attack.</div>';
            cell.dataset.unlocked = 'true';
            setTimeout(() => {
                closeModals();
            }, 1500);
        } else {
            resultDiv.innerHTML = `<div class="error">✗ Incorrect. The correct answer is: <strong>${currentConjugations[verb][dataPronoun]}</strong></div>`;
        }
    } else {
        resultDiv.innerHTML = '<div class="error">Conjugation not available for this verb in the selected tense.</div>';
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
        // Reset all ships to unplaced state
        Object.keys(gameState.ships).forEach(shipType => {
            gameState.ships[shipType].placed = false;
            gameState.ships[shipType].position = null;

            // Reset ship UI
            const shipElement = document.querySelector(`[data-ship="${shipType}"]`);
            if (shipElement) shipElement.classList.remove('ship-placed-ui');
        });

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

function checkGameOver() {
    const allShipsSunk = Object.values(gameState.ships).every(ship => {
        if (!ship.position) return false;

        return ship.position.every(pos => {
            const key = `${pos.row},${pos.col}`;
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

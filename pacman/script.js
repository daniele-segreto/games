$(document).ready(function() { // Avvia lo script solo quando l'intera pagina HTML è stata caricata
    const grid = $('#grid'); // Seleziona il div della griglia utilizzando il selettore jQuery
    const scoreDisplay = $('#score'); // Seleziona l'elemento dove mostrare il punteggio
    let score = 0; // Inizializza la variabile del punteggio a zero
    const width = 19; // Definisce la larghezza del labirinto espressa in numero di celle
    
    const layout = [ // Array numerico che rappresenta la mappa del gioco
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1, // Riga 1: Pareti
        1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1, // Riga 2: Punti e pareti
        1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1, // Riga 3: Labirinto interno
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1, // Riga 4: Corridoio libero
        1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1, // Riga 5
        1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1, // Riga 6
        1,1,1,1,0,1,1,1,3,1,3,1,1,1,0,1,1,1,1, // Riga 7
        1,1,1,1,0,1,3,3,3,3,3,3,3,1,0,1,1,1,1, // Riga 8
        1,1,1,1,0,1,3,1,1,2,1,1,3,1,0,1,1,1,1, // Riga 9
        3,3,3,3,0,3,3,1,2,2,2,1,3,3,0,3,3,3,3, // Riga 10: Zona fantasma centrale
        1,1,1,1,0,1,3,1,1,1,1,1,3,1,0,1,1,1,1, // Riga 11
        1,1,1,1,0,1,3,3,3,3,3,3,3,1,0,1,1,1,1, // Riga 12
        1,1,1,1,0,1,3,1,1,1,1,1,3,1,0,1,1,1,1, // Riga 13
        1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1, // Riga 14
        1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1, // Riga 15
        1,0,0,1,0,0,0,0,0,3,0,0,0,0,0,1,0,0,1, // Riga 16
        1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1, // Riga 17
        1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1, // Riga 18
        1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1, // Riga 19
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1, // Riga 20
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1  // Riga 21
    ]; // Fine definizione array mappa

    const squares = []; // Array vuoto che conterrà i riferimenti DOM di ogni cella della griglia

    function createBoard() { // Funzione per generare visivamente il campo di gioco
        for (let i = 0; i < layout.length; i++) { // Ciclo attraverso ogni elemento dell'array layout
            const square = $('<div class="cell"></div>'); // Crea un nuovo elemento div con classe "cell" usando jQuery
            grid.append(square); // Aggiunge fisicamente il nuovo div all'interno della griglia HTML
            squares.push(square); // Salva il riferimento del div nell'array squares per usi futuri

            if (layout[i] === 1) squares[i].addClass('wall'); // Se il valore nell'array è 1, aggiunge la classe muro
            else if (layout[i] === 0) squares[i].addClass('dot'); // Se è 0, aggiunge la classe punto (cibo)
            else if (layout[i] === 2) squares[i].addClass('ghost-house'); // Se è 2, definisce la zona dei fantasmi
        } // Fine ciclo creazione griglia
    } // Fine funzione createBoard

    let pacmanCurrentIndex = 180; // Imposta la posizione di partenza di Pac-Man nell'array
    
    function drawPacman() { // Funzione per visualizzare Pac-Man sulla mappa
        squares[pacmanCurrentIndex].addClass('pacman'); // Aggiunge la classe CSS pacman alla cella corrente
    } // Fine funzione drawPacman

    function movePacman(e) { // Gestore dell'evento di movimento tramite tastiera
        squares[pacmanCurrentIndex].removeClass('pacman'); // Rimuove Pac-Man dalla sua posizione precedente
        switch(e.keyCode) { // Analizza il codice del tasto premuto
            case 37: // Caso: Freccia Sinistra
                if (pacmanCurrentIndex % width !== 0 && !squares[pacmanCurrentIndex - 1].hasClass('wall')) 
                    pacmanCurrentIndex -= 1; // Sposta a sinistra se non colpisce il bordo o un muro
                break; // Esci dal caso
            case 38: // Caso: Freccia Su
                if (pacmanCurrentIndex - width >= 0 && !squares[pacmanCurrentIndex - width].hasClass('wall')) 
                    pacmanCurrentIndex -= width; // Sposta in su se non colpisce il bordo o un muro
                break; // Esci dal caso
            case 39: // Caso: Freccia Destra
                if (pacmanCurrentIndex % width < width - 1 && !squares[pacmanCurrentIndex + 1].hasClass('wall')) 
                    pacmanCurrentIndex += 1; // Sposta a destra se non colpisce il bordo o un muro
                break; // Esci dal caso
            case 40: // Caso: Freccia Giù
                if (pacmanCurrentIndex + width < layout.length && !squares[pacmanCurrentIndex + width].hasClass('wall')) 
                    pacmanCurrentIndex += width; // Sposta in giù se non colpisce il bordo o un muro
                break; // Esci dal caso
        } // Fine switch tasti
        drawPacman(); // Disegna Pac-Man nella nuova posizione calcolata
        eatDot(); // Controlla se nella nuova posizione c'è un punto da mangiare
    } // Fine funzione movePacman

    function eatDot() { // Funzione per gestire la collisione con i punti
        if (squares[pacmanCurrentIndex].hasClass('dot')) { // Se la cella attuale contiene un punto
            score++; // Incrementa il punteggio di 1
            scoreDisplay.text(score); // Aggiorna il testo visualizzato nell'interfaccia
            squares[pacmanCurrentIndex].removeClass('dot'); // Rimuove il punto mangiato dalla griglia
        } // Fine controllo punto
    } // Fine funzione eatDot

    let ghostIndex = 161; // Posizione iniziale del fantasma
    function moveGhost() { // Funzione per gestire il movimento automatico del fantasma
        const directions = [-1, 1, width, -width]; // Array delle possibili direzioni: sx, dx, giù, su
        let direction = directions[Math.floor(Math.random() * directions.length)]; // Sceglie una direzione iniziale casuale

        setInterval(() => { // Avvia un ciclo temporizzato che si ripete ogni 300 millisecondi
            squares[ghostIndex].removeClass('ghost'); // Rimuove il fantasma dalla posizione attuale
            if (!squares[ghostIndex + direction].hasClass('wall')) { // Se la direzione scelta non porta contro un muro
                ghostIndex += direction; // Aggiorna la posizione del fantasma
            } else { // Se invece colpisce un muro
                direction = directions[Math.floor(Math.random() * directions.length)]; // Ne sceglie una nuova casualmente
            } // Fine controllo muro
            squares[ghostIndex].addClass('ghost'); // Disegna il fantasma nella nuova posizione

            if (ghostIndex === pacmanCurrentIndex) { // Se il fantasma raggiunge la posizione di Pac-Man
                alert("Game Over, Professore! Punteggio: " + score); // Mostra un messaggio di fine gioco personalizzato
                location.reload(); // Ricarica la pagina per ricominciare la partita
            } // Fine controllo game over
        }, 300); // Intervallo di aggiornamento del fantasma in millisecondi
    } // Fine funzione moveGhost

    $('#start-btn').on('click', function() { // Gestore dell'evento click sul pulsante "Inizia Partita"
        $(this).hide(); // Nasconde il pulsante per liberare la visuale
        createBoard(); // Genera il labirinto
        drawPacman(); // Disegna il personaggio iniziale
        $(document).on('keydown', movePacman); // Abilita l'ascolto dei tasti per il movimento
        moveGhost(); // Attiva l'intelligenza artificiale del fantasma
    }); // Fine evento click
}); // Fine script caricamento pagina
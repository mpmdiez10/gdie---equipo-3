function random() {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const randomNotes = [];
    for (let i = 0; i < 4; i++) {
        randomNotes.push(notes[Math.floor(Math.random() * notes.length)]);
    }
    document.querySelector('piano-component').setAttribute('notes', randomNotes.join(','));
}
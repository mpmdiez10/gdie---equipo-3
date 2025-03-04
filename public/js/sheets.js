const contenedor_sheets = $('.container-sheets');

function cargarSheets() {
    const sequences = [
        `
        <scribe-music type="sequence">
            0 C4 0.2 4
            0 D4 0.2 4
            1 E4 0.2 4
            2 F4 0.2 1
            2 G4 0.2 1
            3 A4 0.2 2
            3 B4 0.2 2
            3 C5 0.2 2
            4 D5 0.2 3
            5 E5 0.2 2
        </scribe-music>
        `,
        `
        <scribe-music type="sequence">
            0 E4 0.2 4
            0 F#4 0.2 4
            1 G4 0.2 4
            2 A4 0.2 4
            2 B4 0.2 4
            3 C5 0.2 4
            3 D5 0.2 4
            3 E5 0.2 4
            4 F#5 0.2 4
            5 G5 0.2 4
        </scribe-music>
        `,
        `
        <scribe-music type="sequence">
            0 G4 0.2 4
            0 A4 0.2 4
            1 B4 0.2 4
            2 C5 0.2 4
            2 D5 0.2 4
            3 E5 0.2 4
            3 F#5 0.2 4
            3 G5 0.2 4
            4 A5 0.2 4
            5 B5 0.2 4
        </scribe-music>
        `,
        `
        <scribe-music type="sequence">
            0 A4 0.2 4
            0 B4 0.2 4
            1 C5 0.2 4
            2 D5 0.2 4
            2 E5 0.2 4
            3 F#5 0.2 4
            3 G5 0.2 4
            3 A5 0.2 4
            4 B5 0.2 4
            5 C6 0.2 4
        </scribe-music>
        `
    ];

    const randomSequence = sequences[Math.floor(Math.random() * sequences.length)];
    contenedor_sheets.append(randomSequence);
}